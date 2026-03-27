import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  textContentType,
  error,
  inputRef,
  onBlur,
  multiline = false,
  style,
  optional = false,
}) {
  const { colors, fonts } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[fonts.caption, styles.label, { color: colors.text }]}>
          {label}
          {optional && (
            <Text style={{ color: colors.textSecondary, fontWeight: "400" }}> (optional)</Text>
          )}
        </Text>
      )}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          multiline && styles.multiline,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            fonts.body,
            styles.input,
            { color: colors.text },
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          onBlur={onBlur}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={[fonts.caption, { color: colors.error, marginTop: 4 }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: "600" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 4,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 0 : 10,
  },
  multiline: {
    alignItems: "flex-start",
    minHeight: 120,
    paddingVertical: 14,
  },
  multilineInput: {
    minHeight: 100,
    paddingVertical: 0,
  },
});
