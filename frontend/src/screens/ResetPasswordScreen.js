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
import { Colors } from "../theme/colors";

const PASSWORD_MIN_LENGTH = 8;

function validateFields({ code, newPassword, confirmPassword }) {
  const errors = {};
  if (!code.trim() || code.trim().length < 6)
    errors.code = "Please enter the 6-digit reset code";
  if (!newPassword) errors.newPassword = "Password is required";
  else if (newPassword.length < PASSWORD_MIN_LENGTH)
    errors.newPassword = `Must be at least ${PASSWORD_MIN_LENGTH} characters`;
  else if (!/[A-Z]/.test(newPassword))
    errors.newPassword = "Must contain at least one uppercase letter";
  else if (!/[0-9]/.test(newPassword))
    errors.newPassword = "Must contain at least one number";
  if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (newPassword && confirmPassword !== newPassword)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function ResetPasswordScreen({ navigation, route }) {
  const email = route.params?.email ?? "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleFieldBlur = (field) => {
    const fieldErrors = validateFields({ code, newPassword, confirmPassword });
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field] || undefined,
    }));
  };

  const handleReset = async () => {
    setApiError("");
    const fieldErrors = validateFields({ code, newPassword, confirmPassword });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const result = await authApi.resetPassword(
        email,
        code.trim(),
        newPassword,
        confirmPassword
      );

      if (result.error) {
        setApiError(result.error);
        return;
      }

      navigation.navigate("Login", { email, resetSuccess: true });
    } catch (error) {
      setApiError(error.message || "Password reset failed");
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
              <Ionicons name="lock-open" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to your email and choose a new password
            </Text>
          </View>

          <View style={styles.form}>
            {apiError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            ) : null}

            {/* Reset Code */}
            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput, errors.code && styles.inputError]}
              value={code}
              onChangeText={(t) => {
                setCode(t.replace(/[^0-9]/g, "").slice(0, 6));
                setErrors((p) => ({ ...p, code: undefined }));
              }}
              onBlur={() => handleFieldBlur("code")}
              placeholder="000000"
              placeholderTextColor={Colors.textLight}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              textContentType="oneTimeCode"
            />
            {errors.code ? <Text style={styles.fieldError}>{errors.code}</Text> : null}

            {/* New Password */}
            <Text style={styles.label}>New Password</Text>
            <View style={[styles.passwordContainer, errors.newPassword && styles.inputError]}>
              <TextInput
                ref={newPasswordRef}
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  setErrors((p) => ({ ...p, newPassword: undefined }));
                }}
                onBlur={() => handleFieldBlur("newPassword")}
                placeholder="Create a new password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                textContentType="newPassword"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.fieldError}>{errors.newPassword}</Text>
            ) : null}

            {/* Confirm New Password */}
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                ref={confirmPasswordRef}
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                onBlur={() => handleFieldBlur("confirmPassword")}
                placeholder="Re-enter your new password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReset}
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

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    textAlign: "center",
    paddingHorizontal: 16,
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
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "500",
    flex: 1,
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
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "600",
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
    alignItems: "center",
    marginTop: 24,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
});
