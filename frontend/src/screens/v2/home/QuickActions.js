/**
 * Bento 2x2 quick actions grid: Journal · Sakina · Breathe · Check-in.
 * Each action is a v2 Card with a Phosphor icon orbit.
 */

import React from 'react';
import { View } from 'react-native';
import { Notebook, ChatsCircle, Wind, ClipboardText } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Card, Text } from '../../../ui/v2';

const ACTIONS = [
  { id: 'journal',  Icon: Notebook,      title: 'Journal',  caption: 'Write your thoughts' },
  { id: 'chat',     Icon: ChatsCircle,   title: 'Sakina',   caption: 'Talk to your AI' },
  { id: 'breathe',  Icon: Wind,          title: 'Breathe',  caption: 'Guided breathing' },
  { id: 'checkin',  Icon: ClipboardText, title: 'Check-in', caption: 'Wellbeing score' },
];

/**
 * @param {{ onPress: (id: string) => void }} props
 */
export function QuickActions({ onPress }) {
  const v2 = useV2Theme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[3] }}>
      {ACTIONS.map(({ id, Icon, title, caption }) => (
        <View key={id} style={{ width: '47.5%' }}>
          <Card
            padding={4}
            onPress={() => onPress(id)}
            accessibilityLabel={title}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: v2.palette.bg.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={24} color={v2.palette.primary} weight="duotone" />
            </View>
            <Text variant="h3" style={{ marginTop: v2.spacing[3] }}>
              {title}
            </Text>
            <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>
              {caption}
            </Text>
          </Card>
        </View>
      ))}
    </View>
  );
}

export default QuickActions;
