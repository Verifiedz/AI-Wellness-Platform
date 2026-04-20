/**
 * Patterns list — renders up to 2 insight cards from usePatternInsights.
 * Each insight maps to a Phosphor icon by insightType.
 */

import React from 'react';
import { View } from 'react-native';
import {
  CalendarBlank,
  TrendUp,
  Fire,
  Heart,
} from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Card, Text } from '../../../ui/v2';

const ICON_BY_TYPE = {
  day_of_week: CalendarBlank,
  energy_trend: TrendUp,
  mood_streak: Fire,
};

/**
 * @param {{ insights: any[] }} props
 */
export function PatternsList({ insights }) {
  const v2 = useV2Theme();
  if (!insights?.length) return null;
  return (
    <View style={{ gap: v2.spacing[3] }}>
      {insights.slice(0, 2).map((insight, idx) => {
        const Icon = ICON_BY_TYPE[insight.insightType] || Heart;
        return (
          <Card key={`${insight.insightType}-${idx}`} padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: v2.spacing[3] }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: v2.palette.bg.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} color={v2.palette.primary} weight="duotone" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body-lg" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                  {insight.title}
                </Text>
                <Text variant="body-sm" color="secondary" style={{ marginTop: 2 }}>
                  {insight.description}
                </Text>
                <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>
                  Based on {insight.dataPoints} {insight.dataPoints === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

export default PatternsList;
