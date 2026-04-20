/**
 * Toast primitive. Slides from top with spring; auto-dismiss 4s; calm palette (never red).
 *
 * Imperative API:
 *   const ref = useRef();
 *   <Toast ref={ref} />
 *   ref.current?.show({ kind: 'success', title: 'Saved', body: 'Your journal entry is safe.' });
 *
 * Or controlled:
 *   <Toast visible={...} kind="info" title="..." onDismiss={...} />
 */

import React, { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';
import { Text } from './Text';

const KIND_TO_COLOR = {
  info: 'primary',
  success: 'success',
  warn: 'warning',
  error: 'error',
};

/**
 * @typedef {{
 *   kind?: 'info'|'success'|'warn'|'error',
 *   title: string,
 *   body?: string,
 *   durationMs?: number,
 * }} ToastPayload
 */

export const Toast = forwardRef(function Toast({ initialPayload }, ref) {
  const [payload, setPayload] = useState(initialPayload ?? null);
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  const show = useCallback(
    (p) => {
      setPayload(p);
      if (p?.kind === 'success') fireHaptic('success');
      else if (p?.kind === 'warn') fireHaptic('warn');
      else if (p?.kind === 'error') fireHaptic('error');
    },
    [fireHaptic]
  );

  useImperativeHandle(ref, () => ({
    show,
    dismiss: () => setPayload(null),
  }), [show]);

  useEffect(() => {
    if (!payload) return undefined;
    const ms = payload.durationMs ?? 4000;
    const timer = setTimeout(() => setPayload(null), ms);
    return () => clearTimeout(timer);
  }, [payload]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {payload ? (
          <MotiView
            key={payload.title + payload.kind}
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            style={{
              alignSelf: 'stretch',
              borderRadius: v2.radius['2xl'],
              backgroundColor: v2.palette.bg.elevated,
              borderWidth: 1,
              borderColor: v2.palette.border.subtle,
              padding: v2.spacing[4],
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <View
              style={{
                width: 4,
                alignSelf: 'stretch',
                borderRadius: 2,
                backgroundColor:
                  v2.palette[KIND_TO_COLOR[payload.kind ?? 'info']] ?? v2.palette.primary,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                {payload.title}
              </Text>
              {payload.body ? (
                <Text variant="body-sm" color="secondary" style={{ marginTop: 2 }}>
                  {payload.body}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => setPayload(null)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={10}
              style={{ marginLeft: 8 }}
            >
              <Text variant="label" color="tertiary">CLOSE</Text>
            </Pressable>
          </MotiView>
        ) : null}
      </AnimatePresence>
    </View>
  );
});

export default Toast;
