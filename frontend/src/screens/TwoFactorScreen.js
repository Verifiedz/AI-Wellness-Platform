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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Logo } from "../components/Logo";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";

export function TwoFactorScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const email = route.params?.email ?? "";
  const serverMessage = route.params?.message ?? "";
  const expiresAt = route.params?.expiresAt ?? null;

  const { verifyTwoFactor } = useAuth();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(null);
  const expiryRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) return;
    const calcRemaining = () =>
      Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

    setExpirySeconds(calcRemaining());
    expiryRef.current = setInterval(() => {
      const remaining = calcRemaining();
      setExpirySeconds(remaining);
      if (remaining <= 0) clearInterval(expiryRef.current);
    }, 1000);

    return () => clearInterval(expiryRef.current);
  }, [expiresAt]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    setError("");
    if (!code.trim() || code.trim().length < 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      await verifyTwoFactor(email, code.trim());
    } catch (err) {
      setError(err.message || "Verification failed");
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
        <View style={styles.header}>
          <Logo size="small" showText={false} />
          <Ionicons name="shield-checkmark" size={32} color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={[fonts.heading2, { color: colors.text, marginTop: 16 }]}>Two-Factor Verification</Text>
          <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 6, textAlign: "center", paddingHorizontal: 16 }]}>
            {serverMessage || "Enter the verification code sent to your device"}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Banner variant="error" message={error} /> : null}

          {expirySeconds !== null && (
            <Banner
              variant={expirySeconds <= 0 ? "error" : "warning"}
              message={
                expirySeconds <= 0
                  ? "Code expired. Please request a new one."
                  : `Code expires in ${formatTime(expirySeconds)}`
              }
              icon="time-outline"
            />
          )}

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
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            textContentType="oneTimeCode"
          />

          <Button
            title={expirySeconds === 0 ? "Code Expired" : "Verify"}
            onPress={handleVerify}
            loading={isLoading}
            disabled={expirySeconds === 0}
            style={{ marginTop: 24 }}
          />

          <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate("Login")}>
            <Text style={[fonts.bodySmall, { color: colors.textSecondary, textAlign: "center" }]}>
              Didn't receive a code? Log in again to resend
            </Text>
          </TouchableOpacity>

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
  linkContainer: { alignItems: "center", marginTop: 20 },
  footer: { alignItems: "center", marginTop: 16 },
});
