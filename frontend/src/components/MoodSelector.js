import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { MOODS } from '../constants/journal';
import { useHaptic } from '../hooks/useHaptic';

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
  const scale = useSharedValue(1);
  const haptic = useHaptic();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    haptic.triggerSelection();
    scale.value = withSpring(1.15, { damping: 15, stiffness: 150 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });
    onPress();
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.moodBtn,
          isSelected
            ? { backgroundColor: mood.color }
            : { borderColor: mood.color, borderWidth: 1.5, backgroundColor: colors.surface },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Mood: ${mood.label}`}
        accessibilityState={{ selected: isSelected }}
      >
        <Ionicons name={mood.icon} size={24} color={isSelected ? '#fff' : mood.color} />
        <Text
          style={[
            fonts.caption,
            {
              color: isSelected ? '#fff' : mood.color,
              fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    minWidth: 58,
  },
});
