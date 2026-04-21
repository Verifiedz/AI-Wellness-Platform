/**
 * Chat composer — multi-line input + voice + send button.
 *
 * Send button uses the v2 IconButton accent variant; pulses to active when
 * input has content. Voice input lives left of the field. Theme-synced
 * keyboard appearance.
 */

import React from 'react';
import { Platform, TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperPlaneTilt } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { IconButton } from '../../../ui/v2';
import { VoiceInputButton } from '../../../components/VoiceInputButton';

/**
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   onSend: () => void,
 *   disabled?: boolean,
 *   voice?: { isAvailable: boolean, isListening: boolean, startListening: () => void, stopListening: () => void },
 * }} props
 */
export function ChatComposer({ value, onChange, onSend, disabled = false, voice }) {
  const v2 = useV2Theme();
  const insets = useSafeAreaInsets();

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <KeyboardStickyView
      // Canonical react-native-keyboard-controller chat pattern:
      //   - The composer reserves its own bottom safe-area padding
      //     (insets.bottom) so it sits above the home indicator when the
      //     keyboard is closed.
      //   - offset.opened = insets.bottom (positive) pulls the composer
      //     DOWN by that same amount when the keyboard opens, collapsing
      //     the now-redundant safe-area padding behind the keyboard and
      //     parking the input row flush against the keyboard top.
      // See: https://kirillzyusko.github.io/react-native-keyboard-controller/docs/recipes/chat-like-screens
      offset={{ closed: 0, opened: insets.bottom }}
      style={{
        paddingTop: v2.spacing[3],
        paddingBottom: v2.spacing[3] + insets.bottom,
        paddingHorizontal: v2.spacing[4],
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: v2.spacing[2],
        borderTopWidth: 1,
        borderTopColor: v2.palette.border.subtle,
        backgroundColor: v2.palette.bg.base,
        marginHorizontal: -v2.spacing[3],
      }}
    >
      {voice?.isAvailable ? (
        <VoiceInputButton
          isListening={voice.isListening}
          onPress={voice.isListening ? voice.stopListening : voice.startListening}
          disabled={disabled}
        />
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={voice?.isListening ? 'Listening…' : 'Type your message…'}
        placeholderTextColor={v2.palette.text.tertiary}
        multiline
        editable={!disabled}
        keyboardAppearance={v2.isDark ? 'dark' : 'light'}
        style={{
          flex: 1,
          minHeight: 48,
          maxHeight: 130,
          borderWidth: 1,
          borderColor: v2.palette.border.subtle,
          backgroundColor: v2.palette.bg.surface,
          borderRadius: 24,
          paddingHorizontal: 18,
          paddingVertical: Platform.OS === 'ios' ? 12 : 8,
          fontFamily: 'DMSans_400Regular',
          fontSize: 15,
          color: v2.palette.text.primary,
        }}
      />

      <IconButton
        icon={PaperPlaneTilt}
        accessibilityLabel="Send message"
        variant="accent"
        weight="fill"
        disabled={!canSend}
        haptic="firm"
        onPress={() => {
          if (!canSend) return;
          // IconButton already fires haptic="firm" on press-down — don't double-buzz.
          onSend();
        }}
      />
    </KeyboardStickyView>
  );
}

export default ChatComposer;
