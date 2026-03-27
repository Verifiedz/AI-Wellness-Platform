import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";

const OPTIONS = [
  { id: "daily", label: "Every day", recommended: true },
  { id: "few_weekly", label: "A few times a week", recommended: false },
  { id: "weekly", label: "Weekly", recommended: false },
  { id: "later", label: "I'll decide later", recommended: false },
];

export function FrequencyScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    navigation.navigate("TimeOfDay", {
      ...route.params,
      checkInFrequency: selected || "",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProgressBar step={2} total={3} style={styles.progress} />

      <View style={styles.body}>
        <Text style={[fonts.heading2, { color: colors.text }]}>
          How often would you like to check in?
        </Text>
        <Text
          style={[
            fonts.body,
            { color: colors.textSecondary, marginTop: 8, marginBottom: 28 },
          ]}
        >
          We'll send gentle reminders at your pace
        </Text>

        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? `${colors.primary}10`
                    : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelected(opt.id)}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {isSelected && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  fonts.body,
                  {
                    flex: 1,
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {opt.label}
              </Text>
              {opt.recommended && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <Text style={[fonts.caption, { color: colors.primary }]}>
                    Recommended
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selected}
          style={{ width: "100%" }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  progress: {
    marginBottom: 32,
  },
  body: {
    flex: 1,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C5C5C5",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  footer: {
    alignItems: "center",
    paddingTop: 12,
  },
});
