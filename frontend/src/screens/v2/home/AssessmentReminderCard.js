/**
 * Assessment reminder card. Same nav contract as legacy: tapping navigates to
 * Assessment with assessmentType param.
 */

import React from 'react';
import { View } from 'react-native';
import { ClipboardText, CaretRight } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Card, Text } from '../../../ui/v2';

/**
 * @param {{
 *   type: string,
 *   daysSince: number,
 *   assessmentName: string,
 *   onPress: () => void,
 * }} props
 */
export function AssessmentReminderCard({ daysSince, assessmentName, onPress }) {
  const v2 = useV2Theme();
  const subtitle =
    daysSince === -1
      ? `Take your first ${assessmentName} assessment`
      : `It\u2019s been ${daysSince} days since your last ${assessmentName}`;
  return (
    <Card padding={4} onPress={onPress} accessibilityLabel="Wellness check-in available">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: v2.palette.bg.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClipboardText size={22} color={v2.palette.accent} weight="duotone" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body-lg" style={{ fontFamily: 'DMSans_600SemiBold' }}>
            Time for a wellness check-in
          </Text>
          <Text variant="body-sm" color="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <CaretRight size={18} color={v2.palette.text.tertiary} />
      </View>
    </Card>
  );
}

export default AssessmentReminderCard;
