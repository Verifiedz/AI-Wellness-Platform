import React from "react";
import { StyleSheet, Pressable, View, DeviceEventEmitter } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export function CrisisButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      style={styles.btn}
      onPress={() => DeviceEventEmitter.emit("crisis:open")}
      hitSlop={8}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: `${colors.error}14`,
            borderColor: `${colors.error}30`,
          },
        ]}
      >
        <Ionicons name="heart-circle" size={24} color={colors.error} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginRight: 4,
  },
  inner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
