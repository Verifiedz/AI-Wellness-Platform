/**
 * Bottom Sheet — wraps @gorhom/bottom-sheet with v2 defaults.
 *
 * Handle pulses 3→48px once on first mount to teach the gesture, then settles.
 * Background uses GlassPanel; backdrop = 50% scrim + blur.
 *
 * Imperative API:
 *   const sheetRef = useRef();
 *   <Sheet ref={sheetRef} snapPoints={['50%', '90%']}>
 *     <View>...</View>
 *   </Sheet>
 *   sheetRef.current?.present();
 *   sheetRef.current?.dismiss();
 */

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useReducedMotion } from './hooks/useReducedMotion';

export const Sheet = forwardRef(function Sheet(
  { snapPoints = ['50%', '90%'], enableDynamicSizing = false, children, onChange, onDismiss },
  ref
) {
  const v2 = useV2Theme();
  const reduced = useReducedMotion();
  const innerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    present: () => innerRef.current?.present(),
    dismiss: () => innerRef.current?.dismiss(),
    snapToIndex: (i) => innerRef.current?.snapToIndex?.(i),
  }), []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.55}
      />
    ),
    []
  );

  const renderHandle = useCallback(
    () => <SheetHandle palette={v2.palette} reduced={reduced} radius={v2.radius['3xl']} />,
    [v2.palette, v2.radius, reduced]
  );

  return (
    <BottomSheetModal
      ref={innerRef}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={{
        backgroundColor: v2.palette.bg.elevated,
        borderTopLeftRadius: v2.radius['3xl'],
        borderTopRightRadius: v2.radius['3xl'],
      }}
      onChange={onChange}
      onDismiss={onDismiss}
    >
      <BottomSheetView style={{ paddingHorizontal: v2.spacing[4], paddingBottom: v2.spacing[8] }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

function SheetHandle({ palette, reduced, radius }) {
  const w = useSharedValue(36);

  useEffect(() => {
    if (reduced) return;
    // Brief teaching pulse: grow then settle.
    w.value = withDelay(
      120,
      withSequence(
        withSpring(48, { stiffness: 220, damping: 18 }),
        withSpring(36, { stiffness: 220, damping: 18 })
      )
    );
  }, [reduced, w]);

  const animStyle = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 12,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
      }}
    >
      <Animated.View
        style={[
          {
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.border.strong,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

export default Sheet;
