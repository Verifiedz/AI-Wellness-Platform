/**
 * Hairline tonal divider. Horizontal default; use `vertical` for inline.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useV2Theme } from '../../theme/v2';

/**
 * @param {{
 *   vertical?: boolean,
 *   strong?: boolean,
 *   inset?: number,
 *   style?: any,
 * }} props
 */
export function Divider({ vertical = false, strong = false, inset = 0, style }) {
  const { palette } = useV2Theme();
  const color = strong ? palette.border.strong : palette.border.subtle;

  if (vertical) {
    return (
      <View
        style={[
          {
            width: StyleSheet.hairlineWidth,
            alignSelf: 'stretch',
            backgroundColor: color,
            marginVertical: inset,
          },
          style,
        ]}
      />
    );
  }
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          alignSelf: 'stretch',
          backgroundColor: color,
          marginHorizontal: inset,
        },
        style,
      ]}
    />
  );
}

export default Divider;
