import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

/**
 * Placeholder AI Chat screen.
 * Will be replaced with a full AI chatbot feature later.
 */
export function AIChatScreen() {
  return (
    <View style={styles.container}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color={Colors.textLight}
      />
      <Text style={styles.title}>AI Chat</Text>
      <Text style={styles.subtitle}>
        Chat with your AI wellness assistant here.{"\n"}
        Feature coming soon!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
