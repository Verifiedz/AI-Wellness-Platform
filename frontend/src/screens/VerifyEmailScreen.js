import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "../services/authApi";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "../components/Logo";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";

const RESEND_COOLDOWN = 60;
const MAX_RESEND_ATTEMPTS = 3;

export function VerifyEmailScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const email = route.params?.email ?? "";

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendCount, setResendCount] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const cooldownRef = useRef(null);

  useEffect(() => {
    startCooldown();
    return () => clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    setError("");
    if (!code.trim() || code.trim().length < 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.verifyEmail(email, code.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      navigation.navigate("Login", { email, verified: true });
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendCount >= MAX_RESEND_ATTEMPTS) return;

    setError("");
    setResendMessage("");
    try {
      const result = await authApi.resendVerification(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setResendCount((c) => c + 1);
      setResendMessage("A new code has been sent to your email");
      startCooldown();
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  if (!email) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={[fonts.heading2, { color: colors.text, marginTop: 16 }]}>Missing Email</Text>
            <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 8, textAlign: "center" }]}>
              No email address was provided. Please register or log in first.
            </Text>
          </View>
          <Button title="Go to Register" onPress={() => navigation.navigate("Register")} />
          <TouchableOpacity style={{ alignItems: "center", marginTop: 16 }} onPress={() => navigation.navigate("Login")}>
            <Text style={[fonts.body, { color: colors.primary, fontWeight: "600" }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size="small" showText={false} />
          <Ionicons name="mail-open" size={32} color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={[fonts.heading2, { color: colors.text, marginTop: 16 }]}>Verify Your Email</Text>
          <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 6 }]}>
            A verification code was sent to
          </Text>
          <Text style={[fonts.body, { color: colors.primary, fontWeight: "600", marginTop: 2 }]}>{email}</Text>
        </View>

        <View style={styles.form}>
          {error ? <Banner variant="error" message={error} /> : null}
          {resendMessage ? <Banner variant="success" message={resendMessage} /> : null}

          <Text style={[fonts.caption, { color: colors.text, fontWeight: "600", marginBottom: 6 }]}>
            Verification Code
          </Text>
          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/[^0-9]/g, "").slice(0, 6));
              setError("");
            }}
            placeholder="000000"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            textContentType="oneTimeCode"
          />

          <Button title="Verify Email" onPress={handleVerify} loading={isLoading} style={{ marginTop: 24 }} />

          <View style={styles.resendContainer}>
            {resendCount >= MAX_RESEND_ATTEMPTS ? (
              <Text style={[fonts.body, { color: colors.textLight }]}>Maximum resend attempts reached</Text>
            ) : cooldown > 0 ? (
              <Text style={[fonts.body, { color: colors.textSecondary }]}>Resend code in {cooldown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[fonts.body, { color: colors.primary, fontWeight: "600" }]}>Resend code</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Login")}>
            <Text style={[fonts.body, { color: colors.primary, fontWeight: "600" }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  header: { alignItems: "center", marginBottom: 32 },
  form: { width: "100%" },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "600",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resendContainer: { alignItems: "center", marginTop: 20 },
  footer: { alignItems: "center", marginTop: 24 },
});
