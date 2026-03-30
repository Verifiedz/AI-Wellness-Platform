import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Banner } from '../components/Banner';
import { ASSESSMENTS, RESPONSE_OPTIONS, CLINICAL_DISCLAIMER } from '../constants/assessments';
import { assessmentApi } from '../services/assessmentApi';

/**
 * Step-through assessment questionnaire.
 *
 * Route params:
 *   - assessmentType: "PHQ9" | "GAD7" (default: "PHQ9")
 */
export function AssessmentScreen({ navigation, route }) {
  const assessmentType = route.params?.assessmentType || 'PHQ9';
  const assessment = ASSESSMENTS[assessmentType];

  const { colors, fonts } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = assessment.questions.length;
  const progress = (currentIndex + 1) / totalQuestions;
  const currentAnswer = answers[currentIndex];

  const canGoBack = currentIndex > 0;
  const canGoForward = currentAnswer !== undefined;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const selectAnswer = useCallback(
    (value) => {
      setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    },
    [currentIndex]
  );

  const goNext = useCallback(() => {
    if (isLastQuestion) return;
    setCurrentIndex((prev) => prev + 1);
  }, [isLastQuestion]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    setCurrentIndex((prev) => prev - 1);
  }, [canGoBack]);

  const handleSubmit = useCallback(async () => {
    const allAnswered = Object.keys(answers).length === totalQuestions;
    if (!allAnswered) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const responses = Array.from({ length: totalQuestions }, (_, i) => ({
        questionIndex: i,
        score: answers[i],
      }));

      const result = await assessmentApi.submit({
        assessmentType,
        responses,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      navigation.replace('AssessmentResult', {
        assessmentType,
        result: result.data,
      });
    } catch {
      Alert.alert('Error', 'Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, totalQuestions, assessmentType, navigation]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Banner type="info" message={CLINICAL_DISCLAIMER} icon="information-circle-outline" />

      <View style={styles.header}>
        <Text style={[fonts.heading2, { color: colors.text }]}>{assessment.name}</Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
          {assessment.timeframe}, how often have you been bothered by:
        </Text>
      </View>

      <ProgressBar progress={progress} />
      <Text
        style={[
          fonts.caption,
          { color: colors.textSecondary, textAlign: 'center', marginVertical: 8 },
        ]}
      >
        Question {currentIndex + 1} of {totalQuestions}
      </Text>

      <Card style={styles.questionCard}>
        <Text style={[fonts.body, { color: colors.text, lineHeight: 24, fontWeight: '600' }]}>
          {assessment.questions[currentIndex]}
        </Text>

        <View style={styles.options}>
          {RESPONSE_OPTIONS.map((option) => {
            const isSelected = currentAnswer === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionRow,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? `${colors.primary}10` : colors.surface,
                  },
                ]}
                onPress={() => selectAnswer(option.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? colors.primary : colors.textLight,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[fonts.body, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[fonts.caption, { color: colors.textSecondary }]}>
                    {option.value} point{option.value !== 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <View style={styles.navRow}>
        {canGoBack && (
          <Button
            title="Back"
            variant="outline"
            onPress={goBack}
            icon={<Ionicons name="arrow-back" size={16} color={colors.primary} />}
          />
        )}
        <View style={{ flex: 1 }} />
        {isLastQuestion ? (
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            disabled={!canGoForward || isSubmitting}
          />
        ) : (
          <Button
            title="Next"
            onPress={goNext}
            disabled={!canGoForward}
            icon={<Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginVertical: 16 },
  questionCard: { marginVertical: 12 },
  options: { marginTop: 20, gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
});
