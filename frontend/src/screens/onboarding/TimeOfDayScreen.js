import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../../components/Button";
import { ProgressBar } from "../../components/ProgressBar";

const OPTIONS = [
  { id: "morning", label: "Morning", icon: "sunny-outline" },
  { id: "afternoon", label: "Afternoon", icon: "partly-sunny-outline" },
  { id: "evening", label: "Evening", icon: "moon-outline" },
  { id: "none", label: "No preference", icon: "time-outline" },
];

export function TimeOfDayScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    navigation.navigate("FirstValue", {
      ...route.params,
      preferredTime: selected || "",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProgressBar step={3} total={3} style={styles.progress} />

      <View style={styles.body}>
        <Text style={[fonts.heading2, { color: colors.text }]}>
          When do you feel most reflective?
        </Text>
        <Text
          style={[
            fonts.body,
            { color: colors.textSecondary, marginTop: 8, marginBottom: 28 },
          ]}
        >
          We'll tailor your experience to this time
        </Text>

        <View style={styles.grid}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.card,
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
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: isSelected
                        ? `${colors.primary}20`
                        : `${colors.textLight}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={28}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    fonts.body,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? "600" : "400",
                      marginTop: 10,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    alignItems: "center",
    paddingTop: 12,
  },
});
