/**
 * LoadingState — centered Blob + caption. Replaces system spinners across the app.
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { Text } from './Text';
import { Blob } from './Blob';

/**
 * @param {{
 *   caption?: string,
 *   size?: number,
 *   style?: any,
 * }} props
 */
export function LoadingState({ caption, size = 48, style }) {
  const v2 = useV2Theme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={caption || 'Loading'}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: v2.spacing[10],
        },
        style,
      ]}
    >
      <Blob size={size} />
      {caption ? (
        <Text
          variant="body-sm"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[3] }}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export default LoadingState;
