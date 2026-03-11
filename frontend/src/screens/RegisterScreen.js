import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "../services/authApi";
import { useTheme } from "../context/ThemeContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function validateFields({ username, email, password, confirmPassword }) {
  const errors = {};
  if (!username.trim()) errors.username = "Username is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Invalid email format";
  if (!password) errors.password = "Password is required";
  else if (password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Must be at least ${PASSWORD_MIN_LENGTH} characters`;
  else if (!/[A-Z]/.test(password))
    errors.password = "Must contain at least one uppercase letter";
  else if (!/[0-9]/.test(password))
    errors.password = "Must contain at least one number";
  if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (password && confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const Colors = colors;
  const styles = createStyles(Colors);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const phoneRef = useRef(null);

  const handleFieldBlur = (field) => {
    const fieldErrors = validateFields({ username, email, password, confirmPassword });
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field] || undefined,
    }));
  };

  const handleRegister = async () => {
    setApiError("");
    const fieldErrors = validateFields({ username, email, password, confirmPassword });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const result = await authApi.register(
        username.trim(),
        email.trim(),
        password,
        phone.trim() || null
      );

      if (result.error) {
        const msg = result.error;
        if (/email.*already/i.test(msg)) {
          setErrors((prev) => ({ ...prev, email: msg }));
          setApiError("This email is already registered. Log in instead?");
        } else if (/username.*already|username.*taken/i.test(msg)) {
          setErrors((prev) => ({ ...prev, username: msg }));
        } else if (/phone.*already/i.test(msg)) {
          setErrors((prev) => ({ ...prev, phone: msg }));
        } else {
          setApiError(msg);
        }
        return;
      }

      navigation.navigate("VerifyEmail", { email: email.trim() });
    } catch (error) {
      setApiError(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join the Wellness App community
            </Text>
          </View>

          <View style={styles.form}>
            {apiError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{apiError}</Text>
                {/already registered/i.test(apiError) && (
                  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.errorActionLink}>Log in</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={username}
              onChangeText={(t) => { setUsername(t); setErrors((p) => ({ ...p, username: undefined })); }}
              onBlur={() => handleFieldBlur("username")}
              placeholder="Choose a username"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              textContentType="username"
            />
            {errors.username ? <Text style={styles.fieldError}>{errors.username}</Text> : null}

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={emailRef}
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: undefined })); }}
              onBlur={() => handleFieldBlur("email")}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              textContentType="emailAddress"
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
                onBlur={() => handleFieldBlur("password")}
                placeholder="Create a password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                textContentType="newPassword"
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
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                ref={confirmPasswordRef}
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                onBlur={() => handleFieldBlur("confirmPassword")}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                textContentType="newPassword"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
            ) : null}

            {/* Phone (optional) */}
            <Text style={styles.label}>
              Phone <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              ref={phoneRef}
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrors((p) => ({ ...p, phone: undefined })); }}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              textContentType="telephoneNumber"
            />
            {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  form: {
    width: "100%",
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
  optional: {
    fontWeight: "400",
    color: Colors.textSecondary,
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
  fieldError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
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
});
