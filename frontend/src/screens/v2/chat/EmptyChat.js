/**
 * Hero state for an empty/new conversation.
 * Breathing aurora orb + display headline + 4 suggestion chips.
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import { Text, BreathingPulse, Chip, SakinaLogo } from '../../../ui/v2';

const SUGGESTIONS = [
  'How am I doing this week?',
  'Help me relax',
  'Give me a journal prompt',
  'I’m feeling stressed',
];

/**
 * @param {{
 *   userName?: string,
 *   onSuggestion: (text: string) => void,
 * }} props
 */
export function EmptyChat({ userName, onSuggestion }) {
  const v2 = useV2Theme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: v2.spacing[6] }}>
      <BreathingPulse pace="slow">
        <SakinaLogo size={88} />
      </BreathingPulse>
      <Text
        variant="display-lg"
        align="center"
        style={{ marginTop: v2.spacing[6] }}
      >
        Hi{userName ? ` ${userName}` : ''}.
      </Text>
      <Text
        variant="body-lg"
        color="secondary"
        align="center"
        style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
      >
        I’m Sakina. Ask me anything about your wellness journey.
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: v2.spacing[2],
          marginTop: v2.spacing[8],
        }}
      >
        {SUGGESTIONS.map((s) => (
          <Chip key={s} selected={false} onPress={() => onSuggestion(s)}>
            {s}
          </Chip>
        ))}
      </View>
    </View>
  );
}

export default EmptyChat;
