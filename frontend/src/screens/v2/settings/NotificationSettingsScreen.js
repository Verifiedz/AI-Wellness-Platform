/**
 * NotificationSettingsScreen v2 — daily-tip toggle + time stepper + tz display.
 *
 * Behavior preserved: notificationApi.getPreferences/savePreferences contracts,
 * timezone auto-detect, time options every 30min, useToast on success.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Bell, CaretUp, CaretDown, Globe, CheckCircle } from 'phosphor-react-native';
import { notificationApi } from '../../../services/notificationApi';
import {
  getDeviceTimezone,
  localTimeToUtc,
  utcToLocalTime,
  formatTimeForDisplay,
} from '../../../utils/time';
import { useToast } from '../../../context/ToastContext';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  IconButton,
  LoadingState,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';
import { SettingsRow, SettingsSection, SettingsSwitch } from './SettingsRow';

export function NotificationSettingsScreen({ navigation }) {
  const v2 = useV2Theme();
  const { showToast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [timezone, setTimezone] = useState(getDeviceTimezone());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const timeOptions = useMemo(() => {
    const out = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return out;
  }, []);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await notificationApi.getPreferences();
      if (result.status === 404) {
        setHasExisting(false);
        setIsEnabled(false);
        setPreferredTime('09:00');
        setTimezone(getDeviceTimezone());
      } else if (result.error) {
        showToast({ message: result.error, variant: 'error' });
      } else if (result.data) {
        setHasExisting(true);
        setIsEnabled(result.data.isEnabled);
        const deviceTz = getDeviceTimezone();
        setTimezone(deviceTz);
        if (result.data.preferredTimeUtc) {
          setPreferredTime(utcToLocalTime(result.data.preferredTimeUtc, deviceTz));
        }
      }
    } catch {
      showToast({ message: 'Failed to load notification preferences.', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferredTimeUtc = localTimeToUtc(preferredTime, timezone);
      const result = await notificationApi.savePreferences({
        isEnabled,
        preferredTimeUtc,
        timezone,
      });
      if (result.error) {
        showToast({ message: result.error, variant: 'error' });
      } else {
        setHasExisting(true);
        showToast({ message: 'Preferences saved', variant: 'success' });
      }
    } catch {
      showToast({ message: 'Failed to save preferences.', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const cycleTime = (direction) => {
    const idx = timeOptions.indexOf(preferredTime);
    const cur = idx === -1 ? 18 : idx;
    const next =
      direction === 'up'
        ? (cur + 1) % timeOptions.length
        : (cur - 1 + timeOptions.length) % timeOptions.length;
    setPreferredTime(timeOptions[next]);
  };

  if (isLoading) {
    return (
      <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
        <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
        <LoadingState caption="Loading preferences" />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />

      {!hasExisting ? (
        <Surface
          elevation="raised"
          padding={3}
          style={{
            marginTop: v2.spacing[2],
            marginBottom: v2.spacing[3],
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: v2.spacing[2],
          }}
        >
          <Bell size={18} color={v2.palette.primary} weight="duotone" />
          <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
            No notification preferences set yet. Configure your daily tips below.
          </Text>
        </Surface>
      ) : null}

      <SettingsSection>
        <SettingsRow
          leadingIcon={Bell}
          title="Daily wellness tips"
          sublabel="Receive a daily wellness tip at your preferred time"
          right={
            <SettingsSwitch
              value={isEnabled}
              onChange={setIsEnabled}
              accessibilityLabel="Daily wellness tips"
            />
          }
        />
      </SettingsSection>

      <Card padding={5} style={{ marginBottom: v2.spacing[3], opacity: isEnabled ? 1 : 0.5 }}>
        <Text variant="h3">Preferred time</Text>
        <Text variant="body-sm" color="secondary" style={{ marginTop: 4, marginBottom: v2.spacing[5] }}>
          Choose when you would like to receive your daily tip.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: v2.spacing[6] }}>
          <IconButton
            icon={CaretDown}
            accessibilityLabel="Earlier"
            variant="solid"
            disabled={!isEnabled}
            onPress={() => cycleTime('down')}
          />
          <View style={{ alignItems: 'center', minWidth: 120 }}>
            <Text variant="display-lg">{formatTimeForDisplay(preferredTime)}</Text>
            <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>
              {preferredTime}
            </Text>
          </View>
          <IconButton
            icon={CaretUp}
            accessibilityLabel="Later"
            variant="solid"
            disabled={!isEnabled}
            onPress={() => cycleTime('up')}
          />
        </View>
      </Card>

      <Card padding={4} style={{ marginBottom: v2.spacing[3], opacity: isEnabled ? 1 : 0.5 }}>
        <Text variant="h3">Timezone</Text>
        <View
          style={{
            marginTop: v2.spacing[3],
            flexDirection: 'row',
            alignItems: 'center',
            gap: v2.spacing[2],
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: v2.radius.lg,
            backgroundColor: v2.palette.bg.surfaceHigh,
          }}
        >
          <Globe size={20} color={v2.palette.primary} weight="duotone" />
          <Text variant="body" style={{ fontFamily: 'DMSans_500Medium' }}>
            {timezone}
          </Text>
        </View>
        <Text variant="caption" color="tertiary" style={{ marginTop: v2.spacing[2] }}>
          Automatically detected from your device.
        </Text>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={isSaving}
        leadingIcon={CheckCircle}
        onPress={handleSave}
      >
        Save preferences
      </Button>
    </ScreenScaffold>
  );
}

export default NotificationSettingsScreen;
