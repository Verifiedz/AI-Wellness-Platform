/**
 * Single chat message bubble — distinct visual identity for user vs assistant.
 *
 * Assistant bubbles get an aurora wash (subtle Skia gradient) on the surface
 * + the existing ChatMessageRenderer for markdown / mood-pickers / breathing /
 * escalation actions. User bubbles are filled with the accent palette.
 */

import React, { memo, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { ChatMessageRenderer } from '../../../components/chat/ChatMessageRenderer';
import { useV2Theme } from '../../../theme/v2';
import { Text, Blob } from '../../../ui/v2';

function formatTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * @param {{
 *   item: any,
 *   isNew: boolean,
 *   onRetry: (item: any) => void,
 *   onMoodSelect: (id: string) => void,
 *   selectedMood: string | null,
 *   onStartBreathing: () => void,
 *   onEscalationAction: (kind: string) => void,
 * }} props
 */
function MessageBubbleImpl({
  item,
  isNew,
  onRetry,
  onMoodSelect,
  selectedMood,
  onStartBreathing,
  onEscalationAction,
}) {
  const v2 = useV2Theme();
  const isUser = item.role === 'user';

  const bubbleStyle = useMemo(() => {
    if (isUser) {
      return {
        backgroundColor: v2.palette.primary,
        borderBottomRightRadius: 6,
        maxWidth: '82%',
        alignSelf: 'flex-end',
      };
    }
    return {
      backgroundColor: v2.palette.bg.surfaceHigh,
      borderBottomLeftRadius: 6,
      maxWidth: '88%',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: v2.palette.border.subtle,
    };
  }, [isUser, v2.palette]);

  const markdownStyles = useMemo(
    () => ({
      body: { color: v2.palette.text.primary, fontFamily: 'DMSans_400Regular', fontSize: 15, lineHeight: 22 },
      heading1: { color: v2.palette.text.primary, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, lineHeight: 34, marginVertical: 6 },
      heading2: { color: v2.palette.text.primary, fontFamily: 'DMSans_700Bold', fontSize: 22, marginVertical: 5 },
      heading3: { color: v2.palette.text.primary, fontFamily: 'DMSans_600SemiBold', fontSize: 18, marginVertical: 4 },
      strong: { fontFamily: 'DMSans_700Bold' },
      em: { fontStyle: 'italic' },
      bullet_list: { marginVertical: 4 },
      ordered_list: { marginVertical: 4 },
      list_item: { marginVertical: 2, color: v2.palette.text.primary },
      code_inline: {
        backgroundColor: v2.palette.bg.surface,
        color: v2.palette.primary,
        paddingHorizontal: 4,
        borderRadius: 4,
        fontFamily: 'JetBrainsMono_400Regular',
        fontSize: 13,
      },
      fence: {
        backgroundColor: v2.palette.bg.surface,
        borderColor: v2.palette.border.subtle,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginVertical: 6,
      },
      code_block: {
        fontFamily: 'JetBrainsMono_400Regular',
        fontSize: 13,
        color: v2.palette.text.primary,
      },
      link: { color: v2.palette.primary, textDecorationLine: 'underline' },
      paragraph: { marginTop: 0, marginBottom: 6, color: v2.palette.text.primary },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: v2.palette.primary,
        paddingLeft: 10,
        marginVertical: 6,
        backgroundColor: v2.palette.bg.surface,
        borderRadius: 4,
      },
    }),
    [v2.palette]
  );

  const Wrapper = isNew ? Animated.View : View;
  const enteringProp = isNew
    ? isUser
      ? FadeInRight.duration(280)
      : FadeInLeft.duration(280)
    : undefined;

  return (
    <Wrapper
      entering={enteringProp}
      style={{
        flexDirection: 'row',
        marginBottom: 8,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={[
          {
            borderRadius: 22,
            paddingVertical: 12,
            paddingHorizontal: 16,
          },
          bubbleStyle,
        ]}
      >
        {isUser ? (
          <Text
            variant="body"
            style={{ color: v2.palette.text.onPrimary }}
          >
            {item.message}
          </Text>
        ) : (
          <ChatMessageRenderer
            message={item.message}
            markdownStyles={markdownStyles}
            onMoodSelect={onMoodSelect}
            selectedMood={selectedMood}
            moodDisabled={selectedMood != null}
            onStartBreathing={onStartBreathing}
            onEscalationAction={onEscalationAction}
          />
        )}
        <View
          style={{
            marginTop: 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text
            variant="caption"
            style={{
              color: isUser
                ? 'rgba(255,255,255,0.75)'
                : v2.palette.text.tertiary,
            }}
          >
            {formatTime(item.createdAt)}
          </Text>
          {item.isPending ? (
            <Blob size={14} color={isUser ? v2.palette.text.onPrimary : v2.palette.primary} />
          ) : item.failed ? (
            <Pressable
              onPress={() => onRetry(item)}
              accessibilityRole="button"
              accessibilityLabel="Retry sending"
              hitSlop={8}
            >
              <Text
                variant="caption"
                style={{ color: v2.palette.error, fontFamily: 'DMSans_600SemiBold' }}
              >
                Retry
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Wrapper>
  );
}

export const MessageBubble = memo(MessageBubbleImpl, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.message === next.item.message &&
    prev.item.isPending === next.item.isPending &&
    prev.item.failed === next.item.failed &&
    prev.selectedMood === next.selectedMood
  );
});

export default MessageBubble;
