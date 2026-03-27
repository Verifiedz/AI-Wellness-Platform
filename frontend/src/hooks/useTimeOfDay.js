import { useEffect, useMemo, useState } from "react";
import { getTimePeriod, TIME_OF_DAY_OVERRIDES } from "../theme/timeOfDay";

const CHECK_INTERVAL_MS = 60_000; // 1 minute

/**
 * Hook that returns the current time period and its color overrides.
 * Re-evaluates every minute so the UI transitions smoothly.
 *
 * @returns {{ period: string, overrides: { light: object, dark: object } }}
 */
export function useTimeOfDay() {
  const [period, setPeriod] = useState(() => getTimePeriod());

  useEffect(() => {
    const id = setInterval(() => {
      const next = getTimePeriod();
      setPeriod((prev) => (prev !== next ? next : prev));
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  const overrides = useMemo(
    () => TIME_OF_DAY_OVERRIDES[period] || { light: {}, dark: {} },
    [period]
  );

  return { period, overrides };
}
