import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export function Avatar({ name, size = 56 }) {
  const { colors, fonts } = useTheme();
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${colors.primary}20`,
        },
      ]}
    >
      <Text
        style={[
          fonts.heading2,
          { color: colors.primary, fontSize: size * 0.4 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: "center", alignItems: "center" },
});
