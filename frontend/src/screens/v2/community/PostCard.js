/**
 * Single anonymous post card. Memoized for FlashList performance.
 */

import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import { format } from 'date-fns';
import { DotsThree } from 'phosphor-react-native';
import { REACTION_TYPES } from '../../../constants/communityGuidelines';
import { useV2Theme } from '../../../theme/v2';
import { Card, Text, useHaptic } from '../../../ui/v2';

function PostCardImpl({ item, onMenu, onReaction }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  return (
    <Card padding={4} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: v2.palette.bg.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            variant="body"
            style={{ color: v2.palette.primary, fontFamily: 'DMSans_700Bold' }}
          >
            {(item.anonymousName || 'A')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
            {item.anonymousName || 'Anonymous'}
          </Text>
          <Text variant="caption" color="tertiary">
            {format(new Date(item.createdAt), 'MMM d, h:mm a')}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            fireHaptic('tap');
            onMenu(item.id);
          }}
          accessibilityRole="button"
          accessibilityLabel="Post options"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <DotsThree size={20} color={v2.palette.text.tertiary} weight="bold" />
        </Pressable>
      </View>

      <Text variant="body" style={{ marginTop: 10, lineHeight: 22 }}>
        {item.content}
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {REACTION_TYPES.map((r) => {
          const count = item.reactions?.[r.key] || 0;
          const userReacted = item.userReactions?.includes(r.key);
          return (
            <Pressable
              key={r.key}
              accessibilityRole="button"
              accessibilityLabel={`React ${r.key}`}
              accessibilityState={{ selected: !!userReacted }}
              onPress={() => {
                fireHaptic('tap');
                onReaction(item.id, r.key, userReacted);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: userReacted ? v2.palette.bg.surfaceHigh : v2.palette.bg.surface,
                borderWidth: 1,
                borderColor: userReacted ? v2.palette.primary : v2.palette.border.subtle,
              }}
            >
              <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
              {count > 0 ? (
                <Text variant="caption" color="secondary">
                  {count}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {item.replyCount > 0 ? (
        <Text
          variant="caption"
          style={{ color: v2.palette.primary, marginTop: 8, fontFamily: 'DMSans_600SemiBold' }}
        >
          {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
        </Text>
      ) : null}
    </Card>
  );
}

export const PostCard = memo(PostCardImpl, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.content === next.item.content &&
    prev.item.replyCount === next.item.replyCount &&
    JSON.stringify(prev.item.reactions) === JSON.stringify(next.item.reactions) &&
    JSON.stringify(prev.item.userReactions) === JSON.stringify(next.item.userReactions)
  );
});

export default PostCard;
