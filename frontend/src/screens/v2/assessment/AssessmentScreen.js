/**
 * AssessmentScreen v2 — one question per screen with slow Moti transitions.
 *
 * Behavior preserved end-to-end:
 *   - ASSESSMENTS / RESPONSE_OPTIONS / CLINICAL_DISCLAIMER from constants
 *   - assessmentApi.submit({ assessmentType, responses }) contract identical
 *   - On success: navigation.replace('AssessmentResult', { assessmentType, result })
 *   - All-questions-answered guard before submit
 *   - Back/Next/Submit flow identical
 *
 * Visual rewrite:
 *   - Themed ProgressRing as the question counter (premium tactile)
 *   - Fade/slide transition between questions (Moti AnimatePresence)
 *   - Radio rows use v2 palette tokens, no hardcoded greens/reds
 */

import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { Check, ArrowLeft, ArrowRight, Info } from 'phosphor-react-native';
import { ASSESSMENTS, RESPONSE_OPTIONS, CLINICAL_DISCLAIMER } from '../../../constants/assessments';
import { assessmentApi } from '../../../services/assessmentApi';
import { useToast } from '../../../context/ToastContext';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
  ProgressRing,
  useHaptic,
} from '../../../ui/v2';

export function AssessmentScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const { showToast } = useToast();
  const assessmentType = route?.params?.assessmentType || 'PHQ9';
  const assessment = ASSESSMENTS[assessmentType];

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
      fireHaptic('soft');
      setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    },
    [currentIndex, fireHaptic]
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
      showToast({ message: 'Please answer all questions before submitting.', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const responses = Array.from({ length: totalQuestions }, (_, i) => ({
        questionIndex: i,
        score: answers[i],
      }));

      const result = await assessmentApi.submit({ assessmentType, responses });

      if (result.error) {
        showToast({ message: result.error, variant: 'error' });
        return;
      }
      navigation.replace('AssessmentResult', { assessmentType, result: result.data });
    } catch {
      showToast({ message: 'Failed to submit assessment. Please try again.', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, totalQuestions, assessmentType, navigation, showToast]);

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6}>
      <ScreenHeader
        onBack={() => navigation.goBack()}
        right={
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ProgressRing progress={progress} size={40} strokeWidth={2}>
              <View />
            </ProgressRing>
          </View>
        }
      />

      <View style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[6] }}>
        <Text variant="display-lg">{assessment.name}</Text>
        <Text
          variant="body"
          color="secondary"
          style={{ marginTop: v2.spacing[2], maxWidth: 360 }}
        >
          {assessment.timeframe}, how often have you been bothered by:
        </Text>
        <Text variant="caption" color="tertiary" style={{ marginTop: v2.spacing[3] }}>
          QUESTION {currentIndex + 1} OF {totalQuestions}
        </Text>
      </View>

      <AnimatePresence exitBeforeEnter>
        <MotiView
          key={`q-${currentIndex}`}
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -12 }}
          transition={{ type: 'timing', duration: 280 }}
        >
          <Card padding={5}>
            <Text variant="h2">{assessment.questions[currentIndex]}</Text>
            <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[5] }}>
              {RESPONSE_OPTIONS.map((option) => {
                const isSelected = currentAnswer === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => selectAnswer(option.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: v2.spacing[3],
                      padding: v2.spacing[4],
                      borderRadius: v2.radius.lg,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? v2.palette.primary
                        : v2.palette.border.subtle,
                      backgroundColor: isSelected
                        ? v2.palette.bg.surfaceHigh
                        : v2.palette.bg.surface,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected
                          ? v2.palette.primary
                          : v2.palette.border.strong,
                        backgroundColor: isSelected ? v2.palette.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected ? (
                        <Check size={14} color={v2.palette.text.onPrimary} weight="bold" />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="body"
                        style={{
                          color: isSelected ? v2.palette.primary : v2.palette.text.primary,
                          fontFamily: isSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                        }}
                      >
                        {option.label}
                      </Text>
                      <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
                        {option.value} {option.value === 1 ? 'point' : 'points'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </MotiView>
      </AnimatePresence>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: v2.spacing[2],
          marginTop: v2.spacing[6],
        }}
      >
        {canGoBack ? (
          <Button variant="secondary" leadingIcon={ArrowLeft} onPress={goBack}>
            Back
          </Button>
        ) : null}
        <View style={{ flex: 1 }} />
        {isLastQuestion ? (
          <Button
            variant="primary"
            disabled={!canGoForward}
            loading={isSubmitting}
            onPress={handleSubmit}
            haptic="firm"
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="primary"
            trailingIcon={ArrowRight}
            disabled={!canGoForward}
            onPress={goNext}
            haptic="firm"
          >
            Next
          </Button>
        )}
      </View>

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[6],
          flexDirection: 'row',
          gap: v2.spacing[2],
          alignItems: 'flex-start',
        }}
      >
        <Info size={18} color={v2.palette.text.tertiary} weight="duotone" />
        <Text variant="body-sm" color="tertiary" style={{ flex: 1 }}>
          {CLINICAL_DISCLAIMER}
        </Text>
      </Surface>
    </ScreenScaffold>
  );
}

export default AssessmentScreen;
