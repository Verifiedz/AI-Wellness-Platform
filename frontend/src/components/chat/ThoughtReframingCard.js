import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const DISTORTIONS = [
  "All-or-Nothing",
  "Catastrophizing",
  "Mind Reading",
  "Fortune Telling",
  "Emotional Reasoning",
  "Should Statements",
  "Labeling",
  "Overgeneralizing",
];

const STEP_LABELS = [
  "What's the automatic thought?",
  "What distortion might this be?",
  "What's a more balanced thought?",
];

export function ThoughtReframingCard({ onComplete }) {
  const { colors, fonts } = useTheme();
  const [step, setStep] = useState(0);
  const [automaticThought, setAutomaticThought] = useState("");
  const [selectedDistortion, setSelectedDistortion] = useState(null);
  const [balancedThought, setBalancedThought] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const canAdvance = () => {
    if (step === 0) return automaticThought.trim().length > 0;
    if (step === 1) return selectedDistortion != null;
    if (step === 2) return balancedThought.trim().length > 0;
    return false;
  };

  const handleNext = () => {
    if (step < 2) {
      setStep((prev) => prev + 1);
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
          Thought reframed
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: `${colors.primary}08` }]}>
          <View style={styles.summaryRow}>
            <Text style={[fonts.caption, { color: colors.textSecondary }]}>Original:</Text>
            <Text style={[fonts.bodySmall, { color: colors.text }]}>{automaticThought}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[fonts.caption, { color: colors.textSecondary }]}>Distortion:</Text>
            <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: "600" }]}>
              {selectedDistortion}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[fonts.caption, { color: colors.textSecondary }]}>Balanced:</Text>
            <Text style={[fonts.bodySmall, { color: colors.success }]}>{balancedThought}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[fonts.body, { color: colors.text, fontWeight: "600" }]}>
          Thought Reframing
        </Text>
        <Text style={[fonts.caption, { color: colors.textSecondary }]}>
          Step {step + 1} of 3
        </Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i <= step ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>

      {/* Step label */}
      <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 10 }]}>
        {STEP_LABELS[step]}
      </Text>

      {/* Step 0: Automatic thought input */}
      {step === 0 && (
        <TextInput
          style={[
            styles.textInput,
            fonts.body,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
          placeholder="e.g. I always mess things up..."
          placeholderTextColor={colors.textLight}
          value={automaticThought}
          onChangeText={setAutomaticThought}
          multiline
        />
      )}

      {/* Step 1: Distortion selector */}
      {step === 1 && (
        <View style={styles.chipWrap}>
          {DISTORTIONS.map((d) => {
            const isSelected = selectedDistortion === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedDistortion(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    fonts.caption,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? "600" : "400",
                    },
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Step 2: Balanced thought input */}
      {step === 2 && (
        <TextInput
          style={[
            styles.textInput,
            fonts.body,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
          placeholder="e.g. I make mistakes sometimes, but I also do many things well..."
          placeholderTextColor={colors.textLight}
          value={balancedThought}
          onChangeText={setBalancedThought}
          multiline
        />
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => setStep((prev) => prev - 1)}
          >
            <Text style={[fonts.caption, { color: colors.textSecondary, fontWeight: "600" }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: canAdvance() ? colors.primary : colors.disabled,
              flex: step > 0 ? 1 : undefined,
            },
          ]}
          onPress={handleNext}
          disabled={!canAdvance()}
          activeOpacity={0.8}
        >
          <Text style={[fonts.button, { color: "#fff" }]}>
            {step < 2 ? "Next" : "Finish"}
          </Text>
        </TouchableOpacity>
      </View>
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
  textInput: {
    minHeight: 60,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
  },
  completeWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryCard: {
    width: "100%",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  summaryRow: {
    gap: 2,
  },
  summaryDivider: {
    height: 1,
  },
});
