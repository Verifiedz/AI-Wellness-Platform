/**
 * Selection chip. Toggleable; haptic on toggle.
 */

import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';
import { Text } from './Text';

/**
 * @param {{
 *   selected: boolean,
 *   onPress: () => void,
 *   leadingIcon?: React.ComponentType<any>,
 *   accessibilityLabel?: string,
 *   children?: any,
 *   style?: any,
 * }} props
 */
export function Chip({
  selected,
  onPress,
  leadingIcon: LeadingIcon,
  accessibilityLabel,
  children,
  style,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  const handlePress = useCallback(() => {
    fireHaptic('tap');
    onPress?.();
  }, [fireHaptic, onPress]);

  const bg = selected ? v2.palette.primary : v2.palette.bg.surface;
  const fg = selected ? v2.palette.text.onPrimary : v2.palette.text.primary;
  const border = selected ? 'transparent' : v2.palette.border.subtle;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          minHeight: 40,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: v2.radius.full,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {LeadingIcon ? (
        <View style={{ marginRight: 6 }}>
          <LeadingIcon size={16} color={fg} weight={selected ? 'fill' : 'duotone'} />
        </View>
      ) : null}
      <Text variant="body-sm" style={{ color: fg, fontFamily: 'DMSans_500Medium' }}>
        {children}
      </Text>
    </Pressable>
  );
}

export default Chip;
