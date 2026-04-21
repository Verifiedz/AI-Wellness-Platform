/**
 * ScreenHeader — flexible header used inside ScreenScaffold.
 *
 * Layout: [back?] [title + subtitle?] [right slot]
 *
 * Heights stay 56pt minimum (touch target). Title is h2 by default, optionally serif.
 */

import React from 'react';
import { View } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Text } from '../Text';
import { IconButton } from '../IconButton';

/**
 * @param {{
 *   title?: string,
 *   subtitle?: string,
 *   serif?: boolean,
 *   onBack?: () => void,
 *   right?: React.ReactNode,
 *   left?: React.ReactNode,        // overrides default back
 *   align?: 'left'|'center',
 *   style?: any,
 * }} props
 */
export function ScreenHeader({
  title,
  subtitle,
  serif = false,
  onBack,
  right,
  left,
  align = 'left',
  style,
}) {
  const v2 = useV2Theme();

  // Only reserve a left spacer when we need symmetric layout (centered title
  // with a right slot on the other side). For left-aligned headers without a
  // back button (Journal, Community, top-level tab screens) we drop the
  // spacer entirely so the title hugs the leading edge — no phantom gap.
  let leftSlot = null;
  if (left !== undefined) {
    leftSlot = left;
  } else if (onBack) {
    leftSlot = (
      <IconButton
        icon={CaretLeft}
        accessibilityLabel="Go back"
        onPress={onBack}
        variant="ghost"
      />
    );
  } else if (align === 'center' && right) {
    leftSlot = <View style={{ width: 48, height: 48 }} />;
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56,
          paddingVertical: v2.spacing[2],
          gap: v2.spacing[2],
        },
        style,
      ]}
    >
      {leftSlot}
      <View style={{ flex: 1, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        {title ? (
          <Text
            variant={serif ? 'display-lg' : 'h2'}
            numberOfLines={1}
            align={align}
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="body-sm" color="secondary" numberOfLines={1} align={align}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? null}
    </View>
  );
}

export default ScreenHeader;
