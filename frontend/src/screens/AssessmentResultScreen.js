import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";
import { ScoreGauge } from "../components/ScoreGauge";
import { ASSESSMENTS, CLINICAL_DISCLAIMER } from "../constants/assessments";

/**
 * Displays the result of a completed assessment with score gauge,
 * severity interpretation, and clinical disclaimer.
 *
 * Route params:
 *   - assessmentType: "PHQ9" | "GAD7"
 *   - result: AssessmentDetailResponse from the API
 */
export function AssessmentResultScreen({ navigation, route }) {
  const { assessmentType, result } = route.params;
  const assessment = ASSESSMENTS[assessmentType];
  const { colors, fonts } = useTheme();

  const interpretations = {
    minimal: "Your responses suggest minimal symptoms. Keep up the self-care practices that are working for you.",
    mild: "Your responses suggest mild symptoms. Consider continuing to monitor how you feel and practicing wellness techniques.",
    moderate: "Your responses suggest moderate symptoms. It may be helpful to talk to a healthcare professional about how you're feeling.",
    moderately_severe: "Your responses suggest moderately severe symptoms. We recommend discussing these results with a healthcare professional.",
    severe: "Your responses suggest severe symptoms. Please consider reaching out to a healthcare professional for support. If you are in crisis, use the crisis resources button.",
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.resultCard}>
        <Text style={[fonts.heading2, { color: colors.text, textAlign: "center" }]}>
          {assessment.name} Results
        </Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, textAlign: "center", marginTop: 4 }]}>
          {assessment.fullName}
        </Text>

        <View style={styles.gaugeContainer}>
          <ScoreGauge score={result.totalScore} assessment={assessment} />
        </View>

        <View style={[styles.severityBadge, { backgroundColor: `${colors.primary}12` }]}>
          <Text style={[fonts.heading3, { color: colors.text }]}>
            {result.severityLabel}
          </Text>
        </View>
      </Card>

      <Card style={styles.interpretationCard}>
        <View style={styles.interpretationHeader}>
          <Ionicons name="information-circle" size={22} color={colors.accent} />
          <Text style={[fonts.heading3, { color: colors.text }]}>
            What This Means
          </Text>
        </View>
        <Text style={[fonts.body, { color: colors.textSecondary, lineHeight: 22, marginTop: 8 }]}>
          {interpretations[result.severity] || interpretations.minimal}
        </Text>
      </Card>

      <Banner
        type="warning"
        message={CLINICAL_DISCLAIMER}
        icon="medical-outline"
      />

      <View style={styles.actions}>
        <Button
          title="View History"
          variant="outline"
          onPress={() => navigation.navigate("AssessmentHistory", { assessmentType })}
          icon={<Ionicons name="time-outline" size={16} color={colors.primary} />}
        />
        <Button
          title="Done"
          onPress={() => navigation.popToTop()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  resultCard: { alignItems: "center", paddingVertical: 24, marginBottom: 16 },
  gaugeContainer: { width: "100%", marginTop: 20, paddingHorizontal: 16 },
  severityBadge: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interpretationCard: { marginBottom: 16 },
  interpretationHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { marginTop: 16, gap: 12 },
});
