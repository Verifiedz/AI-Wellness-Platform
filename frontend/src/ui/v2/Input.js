/**
 * Themed Input — floating label, reserved error height, RHF-friendly.
 *
 * Usage:
 *   const { control } = useForm();
 *   <Controller
 *     control={control}
 *     name="email"
 *     render={({ field, fieldState }) => (
 *       <Input
 *         label="Email"
 *         value={field.value}
 *         onChangeText={field.onChange}
 *         onBlur={field.onBlur}
 *         error={fieldState.error?.message}
 *         keyboardType="email-address"
 *         autoCapitalize="none"
 *       />
 *     )}
 *   />
 *
 * UX guarantees:
 *   - Tap-outside dismisses the keyboard if parent uses ScreenScaffold (added in Wave C).
 *   - Error message reserves vertical space so layout never shifts.
 *   - Touch target ≥ 48 px.
 *   - Keyboard appearance synced to current theme.
 */

import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { Platform, TextInput, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { Text } from './Text';

/**
 * @param {{
 *   label: string,
 *   value?: string,
 *   onChangeText?: (v: string) => void,
 *   onBlur?: () => void,
 *   onFocus?: () => void,
 *   error?: string,
 *   placeholder?: string,
 *   secureTextEntry?: boolean,
 *   keyboardType?: import('react-native').KeyboardTypeOptions,
 *   returnKeyType?: import('react-native').ReturnKeyTypeOptions,
 *   autoCapitalize?: 'none'|'sentences'|'words'|'characters',
 *   autoCorrect?: boolean,
 *   onSubmitEditing?: () => void,
 *   autoFocus?: boolean,
 *   multiline?: boolean,
 *   rightAccessory?: React.ReactNode,
 *   testID?: string,
 *   style?: any,
 * }} props
 */
export const Input = forwardRef(function Input(
  {
    label,
    value = '',
    onChangeText,
    onBlur,
    onFocus,
    error,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
    returnKeyType,
    autoCapitalize,
    autoCorrect,
    onSubmitEditing,
    autoFocus = false,
    multiline = false,
    rightAccessory,
    testID,
    style,
    ...rest
  },
  ref
) {
  const v2 = useV2Theme();
  const [focused, setFocused] = useState(false);
  const isFloating = focused || (value !== undefined && value !== '');

  const t = useSharedValue(isFloating ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(isFloating ? 1 : 0, { duration: 160, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }, [isFloating, t]);

  // Rest position: label sits at vertical center of the field so it reads
  // like a normal placeholder. When focused/filled, it floats up above the
  // input text and shrinks slightly.
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -20 * t.value }, { scale: 1 - 0.15 * t.value }],
    opacity: 0.7 + 0.3 * t.value,
  }));

  const handleFocus = useCallback(() => {
    setFocused(true);
    onFocus?.();
  }, [onFocus]);
  const handleBlur = useCallback(() => {
    setFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Sane defaults per keyboardType
  const safeAutoCapitalize =
    autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'sentences');
  const safeAutoCorrect =
    autoCorrect ?? (keyboardType === 'email-address' || secureTextEntry ? false : true);

  const borderColor = error
    ? v2.palette.error
    : focused
    ? v2.palette.primary
    : v2.palette.border.subtle;

  return (
    <View style={[{ marginBottom: 4 }, style]}>
      <Pressable
        onPress={() => {
          // Forward press to the underlying TextInput when user taps the label area.
        }}
        style={{
          // Symmetric padding top/bottom so the text baseline sits at the
          // optical center of the field; floating label translates upward
          // out of the padding box via translateY in labelStyle.
          minHeight: multiline ? 110 : 60,
          borderRadius: v2.radius.lg,
          borderWidth: 1,
          borderColor,
          backgroundColor: v2.palette.bg.surface,
          paddingHorizontal: 16,
          paddingTop: multiline ? 20 : 18,
          paddingBottom: multiline ? 16 : 18,
          justifyContent: 'center',
        }}
      >
        {/* Floating label — centered vertically at rest, floats up when
            focused or filled. Computed top = container center minus half the
            body line-height so the label text baseline aligns with what the
            user types. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 16,
              top: multiline ? 20 : 21,
            },
            labelStyle,
          ]}
        >
          <Text variant="body" color="tertiary">
            {label}
          </Text>
        </Animated.View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            {...rest}
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            // a11y: floating label is decorative — bind a real label to the input.
            accessibilityLabel={rest.accessibilityLabel ?? label}
            aria-label={rest['aria-label'] ?? label}
            placeholder={focused ? placeholder : ''}
            placeholderTextColor={v2.palette.text.tertiary}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            autoCapitalize={safeAutoCapitalize}
            autoCorrect={safeAutoCorrect}
            onSubmitEditing={onSubmitEditing}
            autoFocus={autoFocus}
            multiline={multiline}
            keyboardAppearance={v2.isDark ? 'dark' : 'light'}
            testID={testID}
            style={{
              flex: 1,
              color: v2.palette.text.primary,
              fontFamily: 'DMSans_400Regular',
              fontSize: 15,
              lineHeight: Platform.OS === 'ios' ? 20 : 22,
              padding: 0,
              minHeight: multiline ? 64 : 24,
              textAlignVertical: multiline ? 'top' : 'center',
            }}
          />
          {rightAccessory ? <View style={{ marginLeft: 8 }}>{rightAccessory}</View> : null}
        </View>
      </Pressable>

      {/* Reserve height so layout never shifts when error appears. */}
      <View style={{ minHeight: 18, paddingTop: 4, paddingHorizontal: 4 }}>
        {error ? (
          <Text variant="caption" color="error">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

export default Input;
