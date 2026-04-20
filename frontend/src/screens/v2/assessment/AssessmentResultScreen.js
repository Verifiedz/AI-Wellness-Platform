/**
 * AssessmentResultScreen v2 — score gauge + severity interpretation.
 *
 * Behavior preserved:
 *   - route.params.{ assessmentType, result } contract identical
 *   - View History → AssessmentHistory
 *   - Done → navigation.popToTop()
 *
 * Visual rewrite:
 *   - ProgressRing replaces the legacy ScoreGauge with a hairline arc
 *     showing score / maxScore
 *   - Severity color comes from v2 palette tokens via severity.js
 *   - Calm tone — no red even on severe; uses palette.error which is a
 *     desaturated coral, not #FF0000
 */

import React from 'react';
import { View } from 'react-native';
import { Info, ClockClockwise, CheckCircle } from 'phosphor-react-native';
import { ASSESSMENTS, CLINICAL_DISCLAIMER } from '../../../constants/assessments';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  ProgressRing,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';
import { severityColor } from './severity';

const INTERPRETATIONS = {
  minimal:
    'Your responses suggest minimal symptoms. Keep up the self-care practices that are working for you.',
  mild: 'Your responses suggest mild symptoms. Consider continuing to monitor how you feel and practicing wellness techniques.',
  moderate:
    'Your responses suggest moderate symptoms. It may be helpful to talk to a healthcare professional about how you’re feeling.',
  moderately_severe:
    'Your responses suggest moderately severe symptoms. We recommend discussing these results with a healthcare professional.',
  severe:
    'Your responses suggest severe symptoms. Please consider reaching out to a healthcare professional for support. If you are in crisis, use the crisis resources button.',
};

export function AssessmentResultScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const { assessmentType, result } = route.params;
  const assessment = ASSESSMENTS[assessmentType];

  const totalScore = result?.totalScore ?? 0;
  const maxScore = assessment?.maxScore ?? 1;
  const progress = Math.max(0, Math.min(1, totalScore / maxScore));
  const color = severityColor(v2.palette, result?.severity);
  const interpretation = INTERPRETATIONS[result?.severity] || INTERPRETATIONS.minimal;

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6}>
      <Card padding={5} style={{ marginTop: v2.spacing[2], alignItems: 'center' }}>
        <Text variant="display-lg" align="center">
          {assessment.name} results
        </Text>
        <Text
          variant="body-sm"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[1] }}
        >
          {assessment.fullName}
        </Text>

        <View
          style={{
            width: 200,
            height: 200,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: v2.spacing[6],
          }}
        >
          <ProgressRing progress={progress} size={200} strokeWidth={3} color={color} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text variant="display-lg" style={{ color }}>
              {totalScore}
            </Text>
            <Text variant="caption" color="tertiary">
              of {maxScore}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: v2.spacing[5],
            paddingHorizontal: v2.spacing[5],
            paddingVertical: v2.spacing[2],
            borderRadius: v2.radius.full,
            backgroundColor: v2.palette.bg.surfaceHigh,
            borderWidth: 1,
            borderColor: color,
            flexDirection: 'row',
            alignItems: 'center',
            gap: v2.spacing[2],
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
          <Text variant="h3" style={{ color }}>
            {result?.severityLabel ?? 'Result'}
          </Text>
        </View>
      </Card>

      <Card padding={4} style={{ marginTop: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Info size={20} color={v2.palette.accent} weight="duotone" />
          <Text variant="h3">What this means</Text>
        </View>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2] }}>
          {interpretation}
        </Text>
      </Card>

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[3],
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

      <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[5] }}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          leadingIcon={ClockClockwise}
          onPress={() => navigation.navigate('AssessmentHistory', { assessmentType })}
        >
          View history
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leadingIcon={CheckCircle}
          onPress={() => navigation.popToTop()}
        >
          Done
        </Button>
      </View>
    </ScreenScaffold>
  );
}

export default AssessmentResultScreen;
