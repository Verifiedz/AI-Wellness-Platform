import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MOODS } from '../../constants/journal';

export function MoodQuickReply({ onMoodSelect, selectedMood, disabled }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[fonts.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
        Tap to share how you're feeling
      </Text>
      <View style={styles.row}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          const isDisabled = disabled || (selectedMood != null && !isSelected);

          return (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodBtn,
                {
                  backgroundColor: isSelected ? `${mood.color}25` : colors.background,
                  borderColor: isSelected ? mood.color : colors.border,
                  opacity: isDisabled && !isSelected ? 0.4 : 1,
                },
              ]}
              onPress={() => onMoodSelect?.(mood.id)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <Ionicons
                name={mood.icon}
                size={20}
                color={isSelected ? mood.color : colors.textSecondary}
              />
              <Text
                style={[
                  fonts.caption,
                  {
                    color: isSelected ? mood.color : colors.textSecondary,
                    fontWeight: isSelected ? '600' : '400',
                    marginTop: 2,
                  },
                ]}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
});
