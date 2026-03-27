import React, { useCallback, useState } from "react";
import Animated, { FadeInDown, Easing } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";

export function AnimatedCard({
  index = 0,
  delay = 80,
  duration = 400,
  children,
  style,
}) {
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusKey((prev) => prev + 1);
    }, [])
  );

  return (
    <Animated.View
      key={focusKey}
      entering={FadeInDown.delay(index * delay)
        .duration(duration)
        .easing(Easing.out(Easing.cubic))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
