import React from 'react';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';

export function AnimatedCard({ index = 0, delay = 80, duration = 400, children, style }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * delay)
        .duration(duration)
        .easing(Easing.out(Easing.cubic))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
