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

export function TwoFactorScreen({ navigation, route }) {
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
    const calcRemaining = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      return remaining;
    };

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Two-Factor Verification</Text>
          {serverMessage ? (
            <Text style={styles.subtitle}>{serverMessage}</Text>
          ) : (
            <Text style={styles.subtitle}>
              Enter the verification code sent to your device
            </Text>
          )}
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {expirySeconds !== null && (
            <View
              style={[
                styles.expiryBanner,
                expirySeconds <= 0 && styles.expiryExpired,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={expirySeconds <= 0 ? Colors.error : Colors.warning}
              />
              <Text
                style={[
                  styles.expiryText,
                  expirySeconds <= 0 && styles.expiryTextExpired,
                ]}
              >
                {expirySeconds <= 0
                  ? "Code expired. Please request a new one."
                  : `Code expires in ${formatTime(expirySeconds)}`}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/[^0-9]/g, "").slice(0, 6));
              setError("");
            }}
            placeholder="000000"
            placeholderTextColor={Colors.textLight}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            textContentType="oneTimeCode"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.secondaryLink}>
                Didn't receive a code? Log in again to resend
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
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
  expiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  expiryExpired: {
    backgroundColor: "#FDECEA",
  },
  expiryText: {
    fontSize: 13,
    color: "#856404",
    fontWeight: "500",
    flex: 1,
  },
  expiryTextExpired: {
    color: Colors.error,
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
  linksContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  secondaryLink: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
});
