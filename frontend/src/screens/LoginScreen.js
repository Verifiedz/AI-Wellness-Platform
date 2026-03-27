import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL, DEV_MODE } from "../config";
import { Logo } from "../components/Logo";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";

export function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const { colors, fonts } = useTheme();

  const prefillEmail = route.params?.email ?? "";
  const verified = route.params?.verified ?? false;
  const resetSuccess = route.params?.resetSuccess ?? false;

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
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
      const msg = err.message || "";
      if (/email not verified/i.test(msg)) {
        setUnverifiedEmail(email.trim());
        setError("Your email has not been verified yet.");
      } else if (/temporarily locked|too many failed/i.test(msg)) {
        setError("Your account is temporarily locked. Please try again later.");
      } else if (/invalid credentials/i.test(msg)) {
        setError("Incorrect email or password.");
      } else if (/deactivated/i.test(msg)) {
        setError("This account has been deactivated.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Logo size="medium" />
          <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 8 }]}>
            Your daily companion for well-being
          </Text>
        </View>

        <View style={styles.form}>
          {DEV_MODE && (
            <Banner variant="warning" message="Dev Mode — Using real Auth API" icon="code-slash" />
          )}

          {successBanner ? (
            <Banner variant="success" message={successBanner} />
          ) : null}

          {error ? (
            <Banner
              variant="error"
              message={error}
              icon={/locked/i.test(error) ? "lock-closed" : "alert-circle"}
              action={unverifiedEmail ? "Verify now" : undefined}
              onAction={
                unverifiedEmail
                  ? () => navigation.navigate("VerifyEmail", { email: unverifiedEmail })
                  : undefined
              }
            />
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError("");
              setUnverifiedEmail("");
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            textContentType="emailAddress"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder="Enter your password"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            textContentType="password"
            inputRef={passwordRef}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: "500" }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={isLoading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.footer}>
            <Text style={[fonts.body, { color: colors.textSecondary }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[fonts.body, { color: colors.secondary, fontWeight: "600" }]}>
                Create account
              </Text>
            </TouchableOpacity>
          </View>

          {DEV_MODE && (
            <Text style={[fonts.caption, { color: colors.textLight, textAlign: "center", marginTop: 16 }]}>
              API: {API_BASE_URL}
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  logoSection: { alignItems: "center", marginBottom: 48 },
  form: { width: "100%" },
  forgotLink: { alignSelf: "flex-end", marginBottom: 8, marginTop: -8 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
});
