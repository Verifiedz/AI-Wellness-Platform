import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isWearableAvailable,
  getSteps,
  getHeartRate,
  getSleepHours,
} from '../services/wearableService';

const WEARABLE_ENABLED_KEY = 'wearable_enabled_v1';

/**
 * Hook to fetch today's wearable metrics.
 * Only fetches when wearable is available and the user has opted in.
 */
export function useWearableData() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable] = useState(() => isWearableAvailable());
  const [data, setData] = useState({ steps: null, heartRate: null, sleepHours: null });
  const [isLoading, setIsLoading] = useState(false);

  const loadEnabled = useCallback(async () => {
    try {
      const val = await AsyncStorage.getItem(WEARABLE_ENABLED_KEY);
      setIsEnabled(val === 'true');
    } catch {
      setIsEnabled(false);
    }
  }, []);

  const setEnabled = useCallback(async (enabled) => {
    setIsEnabled(enabled);
    try {
      await AsyncStorage.setItem(WEARABLE_ENABLED_KEY, String(enabled));
    } catch {
      // Non-critical
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAvailable || !isEnabled) return;

    setIsLoading(true);
    try {
      const [steps, heartRate, sleepHours] = await Promise.all([
        getSteps(),
        getHeartRate(),
        getSleepHours(),
      ]);
      setData({ steps, heartRate, sleepHours });
    } catch {
      // Fetch failed silently
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, isEnabled]);

  useFocusEffect(
    useCallback(() => {
      loadEnabled();
    }, [loadEnabled])
  );

  useFocusEffect(
    useCallback(() => {
      if (isEnabled) fetchData();
    }, [isEnabled, fetchData])
  );

  return { isAvailable, isEnabled, setEnabled, data, isLoading, refresh: fetchData };
}
