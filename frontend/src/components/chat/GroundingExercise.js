import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const STEPS = [
  { count: 5, sense: "see", icon: "eye-outline", prompt: "Name 5 things you can see" },
  { count: 4, sense: "touch", icon: "hand-left-outline", prompt: "Name 4 things you can touch" },
  { count: 3, sense: "hear", icon: "ear-outline", prompt: "Name 3 things you can hear" },
  { count: 2, sense: "smell", icon: "flower-outline", prompt: "Name 2 things you can smell" },
  { count: 1, sense: "taste", icon: "restaurant-outline", prompt: "Name 1 thing you can taste" },
];

export function GroundingExercise({ onComplete }) {
  const { colors, fonts } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  };

  if (isComplete) {
    return (
      <View style={styles.completeWrap}>
        <Ionicons name="checkmark-circle" size={32} color={colors.success} />
        <Text style={[fonts.body, { color: colors.text, fontWeight: "600", marginTop: 8 }]}>
          Grounding complete
        </Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, textAlign: "center", marginTop: 4 }]}>
          Take a moment to notice how you feel now.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[fonts.body, { color: colors.text, fontWeight: "600" }]}>
          5-4-3-2-1 Grounding
        </Text>
        <Text style={[fonts.caption, { color: colors.textSecondary }]}>
          Step {currentStep + 1} of {STEPS.length}
        </Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= currentStep ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Current step */}
      <View style={[styles.stepCard, { backgroundColor: `${colors.primary}08` }]}>
        <Ionicons name={step.icon} size={28} color={colors.primary} />
        <Text style={[fonts.heading3, { color: colors.text, marginTop: 8, textAlign: "center" }]}>
          {step.prompt}
        </Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, textAlign: "center", marginTop: 4 }]}>
          Take your time. Look around you.
        </Text>
      </View>

      {/* Next button */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.primary }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={[fonts.button, { color: "#fff" }]}>
          {currentStep < STEPS.length - 1 ? "Next" : "Finish"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  nextBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  completeWrap: {
    alignItems: "center",
    paddingVertical: 16,
  },
});
