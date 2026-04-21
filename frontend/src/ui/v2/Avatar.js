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
  // Ring geometry: outer ring stroke is RING_STROKE px, gap between ring and
  // avatar is RING_GAP px. Total outer diameter = dim + 2*(stroke+gap).
  const RING_STROKE = 2;
  const RING_GAP = 3;

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
  // Outer container draws the ring; the inner avatar is centered with flex,
  // not padding — that way borderWidth cannot push the avatar off-center.
  const outer = dim + 2 * (RING_STROKE + RING_GAP);
  return (
    <View
      style={[
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderWidth: RING_STROKE,
          borderColor: v2.palette.accent,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {inner}
    </View>
  );
}

export default Avatar;
