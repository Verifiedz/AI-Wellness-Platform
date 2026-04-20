/**
 * Daily check-in card.
 *  - If user has not journaled today: 5 mood chips (Phosphor icons), tapping any
 *    one navigates to Journal with preselectedMood + a fresh _ts timestamp.
 *  - If user has checked in: success row with "Edit" affordance.
 *
 * Behavior preserved from the legacy MoodSelector → goToJournal flow.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { CheckCircle, PencilSimple } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic } from '../../../ui/v2';
import { Card, Text } from '../../../ui/v2';
import { MOOD_TOKENS } from './moodTokens';

/**
 * @param {{
 *   hasCheckedIn: boolean,
 *   onSelectMood: (id: string) => void,
 *   onEdit: () => void,
 * }} props
 */
export function DailyCheckIn({ hasCheckedIn, onSelectMood, onEdit }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  if (hasCheckedIn) {
    return (
      <Card padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
          <CheckCircle size={24} color={v2.palette.success} weight="fill" />
          <Text variant="body-lg" style={{ flex: 1 }}>
            You’ve checked in today.
          </Text>
          <Pressable
            onPress={() => {
              fireHaptic('tap');
              onEdit();
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit today's journal"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: v2.spacing[1],
              paddingVertical: 4,
              paddingHorizontal: 8,
            }}
          >
            <PencilSimple size={16} color={v2.palette.primary} weight="duotone" />
            <Text variant="body-sm" style={{ color: v2.palette.primary, fontFamily: 'DMSans_600SemiBold' }}>
              Edit
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  return (
    <Card padding={4}>
      <Text variant="h3">How are you feeling?</Text>
      <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
        Tap your mood to start today’s journal.
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: v2.spacing[4],
          gap: v2.spacing[2],
        }}
      >
        {MOOD_TOKENS.map(({ id, label, Icon, colorOf }) => {
          const color = colorOf(v2.palette);
          return (
            <Pressable
              key={id}
              onPress={() => {
                fireHaptic('soft');
                onSelectMood(id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Mood: ${label}`}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: v2.spacing[3],
                borderRadius: v2.radius.lg,
                backgroundColor: v2.palette.bg.surfaceHigh,
                borderWidth: 1,
                borderColor: v2.palette.border.subtle,
              }}
            >
              <Icon size={24} color={color} weight="duotone" />
              <Text variant="caption" color="secondary" style={{ marginTop: 6 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export default DailyCheckIn;
