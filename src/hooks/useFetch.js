import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching data
 */
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return { data, loading, error, refetch };
};
