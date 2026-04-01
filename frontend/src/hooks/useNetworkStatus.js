import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { API_BASE_URL } from '../config';

const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 5_000;

/**
 * Lightweight network-status hook that pings the API gateway.
 * No external dependencies required -- uses a simple HEAD request.
 *
 * @returns {{ isOnline: boolean, isChecking: boolean }}
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const intervalRef = useRef(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

      // Use a lightweight request to the gateway health endpoint.
      // Fall back to the base URL if no dedicated health path exists.
      const response = await fetch(`${API_BASE_URL}/api/auth/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      setIsOnline(response.ok || response.status < 500);
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    intervalRef.current = setInterval(checkConnection, PING_INTERVAL_MS);

    // Re-check when app returns to foreground
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkConnection();
      }
    });

    return () => {
      clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [checkConnection]);

  return { isOnline, isChecking };
}
