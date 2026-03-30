import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

let DEFAULT_LOGO = null;
try {
  DEFAULT_LOGO = require('../../assets/logo-sakina.png');
} catch {
  DEFAULT_LOGO = null;
}

const SIZES = {
  small: { icon: 20, text: 18, container: 32 },
  medium: { icon: 36, text: 28, container: 64 },
  large: { icon: 52, text: 36, container: 96 },
};

export function Logo({ size = 'medium', showText = true, source }) {
  const { colors, fonts } = useTheme();
  const dim = SIZES[size] || SIZES.medium;
  const logoSource = source || DEFAULT_LOGO;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          {
            width: dim.container,
            height: dim.container,
            borderRadius: dim.container / 2,
            backgroundColor: colors.primary,
          },
        ]}
      >
        {logoSource ? (
          <Image
            source={logoSource}
            style={{
              width: dim.icon * 1.2,
              height: dim.icon * 1.2,
              resizeMode: 'contain',
            }}
          />
        ) : (
          <Ionicons name="leaf" size={dim.icon} color="#fff" />
        )}
      </View>
      {showText && (
        <Text
          style={[
            fonts.heading1,
            {
              fontSize: dim.text,
              color: colors.text,
              marginTop: size === 'small' ? 0 : 12,
            },
          ]}
        >
          Sakina
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  circle: { justifyContent: 'center', alignItems: 'center' },
});
