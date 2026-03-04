import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import { API_BASE_URL, DEV_MODE } from "../config";

export function LoginScreen({ navigation, route }) {
  const { login } = useAuth();

  const prefillEmail = route.params?.email ?? "";
  const verified = route.params?.verified ?? false;
  const resetSuccess = route.params?.resetSuccess ?? false;

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const passwordRef = useRef(null);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  useEffect(() => {
    if (verified) {
      setSuccessBanner("Email verified successfully! You can now log in.");
    } else if (resetSuccess) {
      setSuccessBanner("Password reset successful! Log in with your new password.");
    }
  }, [verified, resetSuccess]);

  useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(""), 5000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  const handleLogin = async () => {
    setError("");
    setUnverifiedEmail("");
    setSuccessBanner("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.requiresTwoFactor) {
        navigation.navigate("TwoFactor", {
          email: result.email || email.trim(),
          message: result.message,
          expiresAt: result.twoFactorExpiresAt || null,
        });
      }
    } catch (err) {
      const msg = err.message || "Login failed";
      if (/email not verified/i.test(msg)) {
        setUnverifiedEmail(email.trim());
        setError("Your email has not been verified yet.");
      } else if (/temporarily locked|too many failed/i.test(msg)) {
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>Wellness App</Text>
          <Text style={styles.subtitle}>
            Your daily companion for well-being
          </Text>
        </View>

        <View style={styles.form}>
          {DEV_MODE && (
            <View style={styles.devBanner}>
              <Ionicons name="code-slash" size={16} color="#856404" />
              <Text style={styles.devBannerText}>
                Dev Mode — Using real Auth API
              </Text>
            </View>
          )}

          {successBanner ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.successBannerText}>{successBanner}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name={/locked/i.test(error) ? "lock-closed" : "alert-circle"}
                size={18}
                color={Colors.error}
              />
              <Text style={styles.errorBannerText}>{error}</Text>
              {unverifiedEmail ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("VerifyEmail", { email: unverifiedEmail })
                  }
                >
                  <Text style={styles.errorActionLink}>Verify now</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, error && !password && styles.inputError]}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
              setUnverifiedEmail("");
            }}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError("");
              }}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              textContentType="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.apiInfo}>API: {API_BASE_URL}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  form: {
    width: "100%",
  },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  devBannerText: {
    fontSize: 13,
    color: "#856404",
    fontWeight: "500",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  successBannerText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: "500",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECEA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "500",
    flex: 1,
  },
  errorActionLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 4,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: Platform.OS === "ios" ? 0 : 10,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  apiInfo: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 16,
  },
});
