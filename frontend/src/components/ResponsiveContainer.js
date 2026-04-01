import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * A drop-in wrapper that centers and constrains content on tablets.
 *
 * On phones this component is a transparent pass-through -- it renders
 * children inside a plain flex-1 View with no extra padding or width cap.
 *
 * On tablets it applies a max-width and centers the content horizontally,
 * preventing layouts from stretching uncomfortably wide.
 *
 * @param {{ children: React.ReactNode, style?: import('react-native').ViewStyle }} props
 */
export function ResponsiveContainer({ children, style }) {
  const { isTablet, contentMaxWidth } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.container,
        isTablet && {
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No default flex -- this component works inside both flex containers
    // (screens) and ScrollViews. Pass flex: 1 via the style prop when needed.
  },
});
