/**
 * Today's Insight — three states:
 *  - currentTip present (from notification): title + body + category chip + dismiss
 *  - quickPrompt fallback (from API): the prompt, "Journal this" + "New insight"
 *  - neither: gentle empty hint with bulb icon
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Lightbulb, Sparkle } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic } from '../../../ui/v2';
import { Card, Text, Surface } from '../../../ui/v2';

/**
 * @param {{
 *   tip?: { title: string, body: string, category?: string|null } | null,
 *   prompt?: { content: string } | null,
 *   onJournal: () => void,
 *   onNewInsight: () => void,
 *   onDismissTip: () => void,
 * }} props
 */
export function InsightCard({ tip, prompt, onJournal, onNewInsight, onDismissTip }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  return (
    <Card padding={4}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
        <Lightbulb size={20} color={v2.palette.warning} weight="duotone" />
        <Text variant="h3">Today’s insight</Text>
      </View>

      {tip ? (
        <View>
          <Text variant="body-lg" style={{ marginTop: v2.spacing[3] }}>
            {tip.title}
          </Text>
          <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2] }}>
            {tip.body}
          </Text>
          {tip.category ? (
            <View style={{ marginTop: v2.spacing[3] }}>
              <Surface
                elevation="high"
                padding={2}
                radius="full"
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                }}
              >
                <Text variant="caption" style={{ color: v2.palette.primary }}>
                  {tip.category}
                </Text>
              </Surface>
            </View>
          ) : null}
          <Pressable
            onPress={() => {
              fireHaptic('tap');
              onDismissTip();
            }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss insight"
            style={{ alignSelf: 'flex-end', marginTop: v2.spacing[3] }}
          >
            <Text variant="body-sm" color="tertiary">
              Dismiss
            </Text>
          </Pressable>
        </View>
      ) : prompt ? (
        <View>
          <Text
            variant="body-lg"
            color="secondary"
            style={{ marginTop: v2.spacing[3], fontStyle: 'italic' }}
          >
            “{prompt.content}”
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: v2.spacing[5],
              marginTop: v2.spacing[4],
            }}
          >
            <Pressable
              onPress={() => {
                fireHaptic('tap');
                onJournal();
              }}
              accessibilityRole="button"
              accessibilityLabel="Journal this prompt"
            >
              <Text variant="body-sm" style={{ color: v2.palette.primary, fontFamily: 'DMSans_600SemiBold' }}>
                Journal this
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                fireHaptic('tap');
                onNewInsight();
              }}
              accessibilityRole="button"
              accessibilityLabel="Show a new insight"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Sparkle size={14} color={v2.palette.primary} weight="duotone" />
                <Text variant="body-sm" style={{ color: v2.palette.primary, fontFamily: 'DMSans_600SemiBold' }}>
                  New insight
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: v2.spacing[5] }}>
          <Lightbulb size={32} color={v2.palette.text.tertiary} weight="duotone" />
          <Text
            variant="body-sm"
            color="tertiary"
            align="center"
            style={{ marginTop: v2.spacing[2], maxWidth: 240 }}
          >
            Enable daily tips in settings to receive wellness insights.
          </Text>
        </View>
      )}
    </Card>
  );
}

export default InsightCard;
