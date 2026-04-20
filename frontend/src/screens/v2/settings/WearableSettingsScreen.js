/**
 * WearableSettingsScreen v2 — Coming Soon health-data toggle.
 *
 * Behavior preserved: useWearableData hook, requestPermissions flow with
 * Linking.openSettings() fallback, disabled when !isAvailable.
 */

import React, { useCallback, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import {
  Heartbeat,
  ShieldCheck,
  Warning,
  Footprints,
  Heart,
  Moon,
  XCircle,
} from 'phosphor-react-native';
import { useWearableData } from '../../../hooks/useWearableData';
import { requestPermissions } from '../../../services/wearableService';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';
import { SettingsRow, SettingsSection, SettingsSwitch } from './SettingsRow';

export function WearableSettingsScreen({ navigation }) {
  const v2 = useV2Theme();
  const { isAvailable, isEnabled, setEnabled, data } = useWearableData();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleToggle = useCallback(
    async (enabled) => {
      if (enabled) {
        setIsConnecting(true);
        try {
          const granted = await requestPermissions();
          if (!granted) {
            Alert.alert(
              'Permission required',
              'Please grant health data access in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open settings', onPress: () => Linking.openSettings() },
              ]
            );
            return;
          }
          await setEnabled(true);
        } catch {
          Alert.alert('Error', 'Failed to connect to health data.');
        } finally {
          setIsConnecting(false);
        }
      } else {
        await setEnabled(false);
      }
    },
    [setEnabled]
  );

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Health data" onBack={() => navigation.goBack()} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[2],
          marginBottom: v2.spacing[2],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <Warning size={20} color={v2.palette.warning} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Coming soon — wearable integration requires a native Expo build with health modules
          installed. Not available in Expo Go or on web.
        </Text>
      </Surface>

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Health data stays on your device and is never sent to our servers. You can disconnect at
          any time.
        </Text>
      </Surface>

      <SettingsSection>
        <SettingsRow
          leadingIcon={Heartbeat}
          title="Health data"
          sublabel={isEnabled ? 'Connected' : 'Not connected'}
          right={
            <SettingsSwitch
              value={isEnabled}
              onChange={handleToggle}
              accessibilityLabel="Health data"
            />
          }
        />
      </SettingsSection>

      {isEnabled ? (
        <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
          <Text variant="h3" style={{ marginBottom: v2.spacing[3] }}>
            Data sources
          </Text>
          {[
            { Icon: Footprints, label: 'Steps', value: data.steps?.toLocaleString() || 'No data' },
            { Icon: Heart, label: 'Heart rate', value: data.heartRate ? `${data.heartRate} bpm` : 'No data' },
            { Icon: Moon, label: 'Sleep', value: data.sleepHours ? `${data.sleepHours}h` : 'No data' },
          ].map((it, idx, arr) => (
            <View
              key={it.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderBottomColor: v2.palette.border.subtle,
              }}
            >
              <it.Icon size={20} color={v2.palette.primary} weight="duotone" />
              <Text variant="body" style={{ flex: 1 }}>
                {it.label}
              </Text>
              <Text variant="body-sm" color="secondary">
                {it.value}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {isEnabled ? (
        <Button
          variant="ghost"
          size="md"
          fullWidth
          leadingIcon={XCircle}
          onPress={() => handleToggle(false)}
          haptic="warn"
        >
          Disconnect
        </Button>
      ) : null}
    </ScreenScaffold>
  );
}

export default WearableSettingsScreen;
