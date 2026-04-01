import React, { createContext, useContext, useMemo } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkContext = createContext(null);

/**
 * Provides network connectivity state to the entire app.
 * Place inside ThemeProvider so child components can use both theme and network.
 */
export function NetworkProvider({ children }) {
  const { isOnline, isChecking } = useNetworkStatus();

  const value = useMemo(() => ({ isOnline, isChecking }), [isOnline, isChecking]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

/**
 * @returns {{ isOnline: boolean, isChecking: boolean }}
 */
export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
}
