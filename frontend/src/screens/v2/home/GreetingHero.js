/**
 * Greeting hero — display-lg greeting + breathing aurora orb + day stamp.
 * Time-of-day icon swaps between Sun / CloudSun / Moon based on the hour.
 */

import React from 'react';
import { View } from 'react-native';
import { Sun, CloudSun, Moon } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Text, BreathingPulse } from '../../../ui/v2';

function timePeriodIcon() {
  const h = new Date().getHours();
  if (h < 12) return Sun;
  if (h < 17) return CloudSun;
  return Moon;
}

/**
 * @param {{
 *   greeting: string,
 *   displayName: string,
 *   dateLabel: string,
 * }} props
 */
export function GreetingHero({ greeting, displayName, dateLabel }) {
  const v2 = useV2Theme();
  const Icon = timePeriodIcon();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[4] }}>
      <BreathingPulse pace="slow">
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: v2.palette.accent,
            opacity: 0.85,
          }}
        />
      </BreathingPulse>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Icon size={18} color={v2.palette.secondary} weight="duotone" />
          <Text variant="caption" color="secondary">
            {dateLabel}
          </Text>
        </View>
        <Text variant="display-lg" numberOfLines={2} style={{ marginTop: v2.spacing[1] }}>
          {greeting},{'\n'}{displayName}
        </Text>
      </View>
    </View>
  );
}

export default GreetingHero;
