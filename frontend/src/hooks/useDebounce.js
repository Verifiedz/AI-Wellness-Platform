import { useState, useEffect } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after `delay` ms of inactivity.
 *
 * @param {*} value - The value to debounce.
 * @param {number} [delay=1500] - Debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
export function useDebounce(value, delay = 1500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
