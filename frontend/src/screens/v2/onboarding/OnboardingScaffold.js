/**
 * Shared scaffold for all 4 step-based onboarding screens.
 * Renders progress dots + ambient aurora + back button + footer slot.
 *
 * Welcome and FirstValue use ScreenScaffold directly (no progress dots).
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import {
  ScreenScaffold,
  ScreenHeader,
  Text,
} from '../../../ui/v2';

function ProgressDots({ step, total }) {
  const v2 = useV2Theme();
  return (
    <View style={{ flexDirection: 'row', gap: v2.spacing[2], alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 <= step;
        return (
          <View
            key={i}
            style={{
              width: i + 1 === step ? 24 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: active ? v2.palette.primary : v2.palette.border.subtle,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * @param {{
 *   step: number,
 *   total: number,
 *   onBack?: () => void,
 *   title: string,
 *   subtitle?: string,
 *   children: React.ReactNode,
 *   footer: React.ReactNode,
 * }} props
 */
export function OnboardingScaffold({ step, total, onBack, title, subtitle, children, footer }) {
  const v2 = useV2Theme();
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6}>
      <ScreenHeader
        onBack={onBack}
        right={<ProgressDots step={step} total={total} />}
      />
      <View style={{ marginTop: v2.spacing[4], marginBottom: v2.spacing[6] }}>
        <Text variant="display-lg">{title}</Text>
        {subtitle ? (
          <Text
            variant="body"
            color="secondary"
            style={{ marginTop: v2.spacing[2], maxWidth: 360 }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      <View style={{ marginTop: v2.spacing[5] }}>{footer}</View>
    </ScreenScaffold>
  );
}

export default OnboardingScaffold;
