/**
 * Single chat session row inside the drawer. Memoized to keep the FlashList
 * fast on long histories.
 *
 * Layout: title + relative date · pencil + bookmark icons. Swipe-right reveals
 * a delete action via ReanimatedSwipeable. Tapping anywhere else opens the
 * conversation.
 */

import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import { PencilSimple, BookmarkSimple } from 'phosphor-react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { Trash } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic, Text } from '../../../ui/v2';

function RightDeleteAction({ drag, onPress, palette }) {
  const animatedStyle = useAnimatedStyle(() => {
    const dragVal = typeof drag.value === 'number' ? drag.value : 0;
    const scale = Math.min(1, Math.max(0.5, -dragVal / 80));
    return { transform: [{ scale }] };
  });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Delete conversation"
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: 8,
        marginLeft: 4,
        borderRadius: 16,
        backgroundColor: palette.error,
      }}
    >
      <Reanimated.View style={[{ alignItems: 'center' }, animatedStyle]}>
        <Trash size={22} color={palette.text.onPrimary} weight="duotone" />
        <Text
          variant="caption"
          style={{
            color: palette.text.onPrimary,
            fontFamily: 'DMSans_600SemiBold',
            marginTop: 2,
          }}
        >
          Delete
        </Text>
      </Reanimated.View>
    </Pressable>
  );
}

function SessionItemImpl({
  item,
  title,
  isOpenSwipeable,
  onOpen,
  onRename,
  onToggleBookmark,
  onDelete,
  onSwipeOpen,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  let swipeRef = null;

  return (
    <ReanimatedSwipeable
      ref={(ref) => {
        swipeRef = ref;
      }}
      renderRightActions={(_progress, drag) => (
        <RightDeleteAction
          drag={drag}
          palette={v2.palette}
          onPress={() => {
            fireHaptic('warn');
            onDelete(item, swipeRef);
          }}
        />
      )}
      overshootRight={false}
      friction={2}
      rightThreshold={30}
      dragOffsetFromRightEdge={1}
      onSwipeableOpen={() => onSwipeOpen(swipeRef)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open conversation: ${title}`}
        onPress={() => {
          fireHaptic('tap');
          if (isOpenSwipeable) {
            isOpenSwipeable.close?.();
          }
          onOpen(item);
        }}
        style={{
          backgroundColor: v2.palette.bg.surface,
          borderColor: v2.palette.border.subtle,
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            variant="body"
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text variant="caption" color="tertiary" style={{ marginTop: 4 }} numberOfLines={1}>
            {new Date(item.createdDate).toLocaleString()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => {
              fireHaptic('tap');
              onRename(item);
            }}
            accessibilityRole="button"
            accessibilityLabel="Rename"
            hitSlop={8}
          >
            <PencilSimple size={18} color={v2.palette.text.tertiary} weight="duotone" />
          </Pressable>
          <Pressable
            onPress={() => {
              fireHaptic('tap');
              onToggleBookmark(item);
            }}
            accessibilityRole="button"
            accessibilityLabel={item.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            hitSlop={8}
          >
            <BookmarkSimple
              size={18}
              color={item.isBookmarked ? v2.palette.warning : v2.palette.text.tertiary}
              weight={item.isBookmarked ? 'fill' : 'duotone'}
            />
          </Pressable>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export const SessionItem = memo(SessionItemImpl, (prev, next) => {
  return (
    prev.item.sessionId === next.item.sessionId &&
    prev.item.isBookmarked === next.item.isBookmarked &&
    prev.item.createdDate === next.item.createdDate &&
    prev.title === next.title
  );
});

export default SessionItem;
