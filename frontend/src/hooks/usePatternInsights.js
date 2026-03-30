import { useState, useCallback, useRef } from 'react';
import { insightApi } from '../services/insightApi';

/**
 * Fetches and caches pattern insights for the current session.
 * Only re-fetches when `refresh()` is called explicitly.
 */
export function usePatternInsights(days = 30) {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await insightApi.getInsights(days);

    if (result.error) {
      setError(result.error);
      setInsights([]);
    } else {
      setInsights(result.data?.insights ?? []);
    }

    setIsLoading(false);
    hasFetched.current = true;
  }, [days]);

  const load = useCallback(async () => {
    if (!hasFetched.current) {
      await fetchInsights();
    }
  }, [fetchInsights]);

  const refresh = useCallback(async () => {
    hasFetched.current = false;
    await fetchInsights();
  }, [fetchInsights]);

  return { insights, isLoading, error, load, refresh };
}
