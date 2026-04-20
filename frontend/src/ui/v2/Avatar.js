/**
 * Avatar — expo-image with blurhash placeholder; initials fallback on accent gradient.
 */

import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useV2Theme } from '../../theme/v2';
import { Text } from './Text';

const SIZES = { xs: 24, sm: 32, md: 48, lg: 64, xl: 96 };

/**
 * @param {{
 *   uri?: string,
 *   initials?: string,
 *   size?: 'xs'|'sm'|'md'|'lg'|'xl',
 *   ring?: boolean,
 *   blurhash?: string,
 *   style?: any,
 * }} props
 */
export function Avatar({ uri, initials, size = 'md', ring = false, blurhash, style }) {
  const v2 = useV2Theme();
  const dim = SIZES[size] ?? SIZES.md;
  const ringPad = ring ? 3 : 0;

  const inner = uri ? (
    <Image
      source={{ uri }}
      placeholder={blurhash ? { blurhash } : undefined}
      contentFit="cover"
      transition={200}
      style={{ width: dim, height: dim, borderRadius: dim / 2 }}
    />
  ) : (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: v2.palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant={size === 'xs' || size === 'sm' ? 'caption' : 'body'}
        style={{ color: v2.palette.text.onPrimary, fontFamily: 'DMSans_600SemiBold' }}
      >
        {(initials || '?').slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );

  if (!ring) {
    return <View style={style}>{inner}</View>;
  }
  return (
    <View
      style={[
        {
          width: dim + ringPad * 2,
          height: dim + ringPad * 2,
          borderRadius: (dim + ringPad * 2) / 2,
          padding: ringPad,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: v2.palette.accent,
        },
        style,
      ]}
    >
      {inner}
    </View>
  );
}

export default Avatar;
