/**
 * Reusable settings row.
 *
 * Variants: navigable (right caret), toggle (Switch), readonly (just info).
 * Composable with leadingIcon (Phosphor) + title + sublabel + right slot.
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Switch, Text, useHaptic } from '../../../ui/v2';

/**
 * @param {{
 *   leadingIcon?: React.ComponentType<any>,
 *   title: string,
 *   sublabel?: string,
 *   onPress?: () => void,
 *   right?: React.ReactNode,
 *   showCaret?: boolean,
 *   destructive?: boolean,
 *   accessibilityLabel?: string,
 * }} props
 */
export function SettingsRow({
  leadingIcon: Icon,
  title,
  sublabel,
  onPress,
  right,
  showCaret = false,
  destructive = false,
  accessibilityLabel,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const Wrapper = onPress ? Pressable : View;
  const titleColor = destructive ? v2.palette.error : v2.palette.text.primary;
  const iconBg = destructive ? `${v2.palette.error}1A` : v2.palette.bg.surfaceHigh;
  const iconColor = destructive ? v2.palette.error : v2.palette.primary;

  return (
    <Wrapper
      onPress={onPress ? () => { fireHaptic('tap'); onPress(); } : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: v2.spacing[4],
      }}
    >
      {Icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={iconColor} weight="duotone" />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ color: titleColor, fontFamily: 'DMSans_500Medium' }}>
          {title}
        </Text>
        {sublabel ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right}
      {showCaret ? (
        <CaretRight size={18} color={v2.palette.text.tertiary} weight="duotone" />
      ) : null}
    </Wrapper>
  );
}

/**
 * Wrapper that renders a list of SettingsRow inside a single Card-like container
 * with hairline dividers between rows.
 *
 * @param {{ children: React.ReactNode, title?: string, style?: any }} props
 */
export function SettingsSection({ children, title, style }) {
  const v2 = useV2Theme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ marginBottom: v2.spacing[4] }, style]}>
      {title ? (
        <Text
          variant="label"
          color="secondary"
          style={{
            marginBottom: v2.spacing[2],
            paddingHorizontal: v2.spacing[1],
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: v2.palette.bg.surface,
          borderWidth: 1,
          borderColor: v2.palette.border.subtle,
          borderRadius: v2.radius.xl,
          overflow: 'hidden',
        }}
      >
        {items.map((child, idx) => (
          <View key={idx}>
            {child}
            {idx < items.length - 1 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: v2.palette.border.subtle,
                  marginLeft: v2.spacing[4] + 36 + 12,
                }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Convenience: Switch wrapped to fit the row's right slot. */
export function SettingsSwitch({ value, onChange, accessibilityLabel }) {
  return <Switch value={value} onChange={onChange} accessibilityLabel={accessibilityLabel} />;
}

export default SettingsRow;
