import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { MOODS } from "../constants/journal";

export function MoodSelector({ selected, onSelect, style }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={[styles.row, style]}>
      {MOODS.map((mood) => (
        <MoodButton
          key={mood.id}
          mood={mood}
          isSelected={selected === mood.id}
          onPress={() => onSelect(mood.id)}
          colors={colors}
          fonts={fonts}
        />
      ))}
    </View>
  );
}

function MoodButton({ mood, isSelected, onPress, colors, fonts }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, speed: 40 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.moodBtn,
          isSelected
            ? { backgroundColor: mood.color }
            : { borderColor: mood.color, borderWidth: 1.5, backgroundColor: colors.surface },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={mood.icon}
          size={24}
          color={isSelected ? "#fff" : mood.color}
        />
        <Text
          style={[
            fonts.caption,
            {
              color: isSelected ? "#fff" : mood.color,
              fontWeight: "600",
              marginTop: 4,
            },
          ]}
        >
          {mood.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    minWidth: 58,
  },
});
