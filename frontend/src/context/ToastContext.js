import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const queueRef = useRef([]);
  const isShowingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }
    isShowingRef.current = true;
    const next = queueRef.current.shift();
    setCurrent(next);
  }, []);

  const showToast = useCallback(({ message, variant = 'info', duration = 3000 }) => {
    toastIdCounter += 1;
    const toast = {
      id: toastIdCounter,
      message,
      variant,
      duration,
      visible: true,
    };

    if (isShowingRef.current) {
      queueRef.current = [...queueRef.current, toast];
    } else {
      isShowingRef.current = true;
      setCurrent(toast);
    }
  }, []);

  const dismissCurrent = useCallback(() => {
    setCurrent(null);
    // Small delay so exit animation can complete before showing next
    setTimeout(() => {
      showNext();
    }, 200);
  }, [showNext]);

  const value = useMemo(
    () => ({ showToast, current, dismissCurrent }),
    [showToast, current, dismissCurrent]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
