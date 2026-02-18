import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import { API_BASE_URL, DEV_MODE } from "../config";

/**
 * Placeholder login screen.
 *
 * In dev mode this accepts a User ID (and optional email) to simulate
 * a logged-in session.  When the real Auth Service is ready, replace this
 * screen with a proper email / password form that calls the Auth API.
 */
export function LoginScreen() {
  const { login } = useAuth();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim()) {
      Alert.alert("Validation", "Please enter a User ID.");
      return;
    }

    setIsLoading(true);
    try {
      await login(userId.trim(), email.trim());
    } catch (error) {
      Alert.alert("Login Error", error.message);
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>Wellness App</Text>
          <Text style={styles.subtitle}>
            Your daily companion for well-being
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {DEV_MODE && (
            <View style={styles.devBanner}>
              <Ionicons name="code-slash" size={16} color="#856404" />
              <Text style={styles.devBannerText}>
                Dev Mode — Placeholder Login
              </Text>
            </View>
          )}

          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="Enter your user ID"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Logging in…" : "Log In"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.apiInfo}>API: {API_BASE_URL}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- styles ---------- */

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
  apiInfo: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 16,
  },
});
