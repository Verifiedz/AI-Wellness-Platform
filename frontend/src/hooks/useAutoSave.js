import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";

/**
 * Auto-save hook that debounces a value and persists it when it changes.
 *
 * Features:
 * - Skips initial mount (does not save on first render)
 * - Tracks last-saved value to avoid redundant saves
 * - Ref-based lock prevents concurrent saves; queues the next one
 * - Graceful error handling (sets error state, does not throw)
 * - Accepts `enabled` flag to disable (e.g. for view-only mode)
 *
 * @param {{ value: *, delay?: number, onSave: (value: *) => Promise<*>, enabled?: boolean }} opts
 * @returns {{ isSaving: boolean, lastSavedAt: Date|null, error: string|null, forceSave: () => Promise<void> }}
 */
export function useAutoSave({ value, delay = 2000, onSave, enabled = true }) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const debouncedValue = useDebounce(value, delay);

  const lastSavedRef = useRef(undefined);
  const isInitialRef = useRef(true);
  const savingRef = useRef(false);
  const pendingRef = useRef(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const serialize = useCallback((val) => {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }, []);

  const executeSave = useCallback(
    async (val) => {
      if (savingRef.current) {
        // Queue the latest value; only one pending save at a time
        pendingRef.current = val;
        return;
      }

      const serialized = serialize(val);
      if (serialized === lastSavedRef.current) return;

      savingRef.current = true;
      setIsSaving(true);
      setError(null);

      try {
        const result = await onSaveRef.current(val);
        lastSavedRef.current = serialized;
        setLastSavedAt(new Date());
        return result;
      } catch (err) {
        setError(err?.message || "Auto-save failed");
      } finally {
        savingRef.current = false;
        setIsSaving(false);

        // Process queued save if one was pending
        const queued = pendingRef.current;
        if (queued !== null) {
          pendingRef.current = null;
          executeSave(queued);
        }
      }
    },
    [serialize],
  );

  // Auto-save when debounced value changes
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    if (!enabled) return;
    executeSave(debouncedValue);
  }, [debouncedValue, enabled, executeSave]);

  // Force-save for manual triggers (e.g. the Save button resets the timer)
  const forceSave = useCallback(async () => {
    if (!enabled) return;
    return executeSave(value);
  }, [enabled, value, executeSave]);

  return { isSaving, lastSavedAt, error, forceSave };
}
