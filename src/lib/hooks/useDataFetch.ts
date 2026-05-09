'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDataFetchOptions<T> {
  endpoint: string;
  enabled?: boolean;
  refetchOnFocus?: boolean;
  refetchOnVisibilityChange?: boolean;
  transform?: (data: any) => T;
}

interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: number | null;
}

export function useDataFetch<T = any>({
  endpoint,
  enabled = true,
  refetchOnFocus = true,
  refetchOnVisibilityChange = true,
  transform
}: UseDataFetchOptions<T>): UseDataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const mountedRef = useRef(true);
  const lastFetchTimeRef = useRef(0);
  const MIN_REFETCH_INTERVAL = 1000; // Prevent refetch within 1 second

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled) return;

    // Prevent rapid refetches
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_REFETCH_INTERVAL) {
      return;
    }
    lastFetchTimeRef.current = now;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Add cache-busting timestamp
      const cacheBuster = Date.now();
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${cacheBuster}`;

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const rawData = await response.json();
      const transformedData = transform ? transform(rawData) : rawData;

      if (mountedRef.current) {
        setData(transformedData);
        setLastFetched(now);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        console.error(`Error fetching ${endpoint}:`, err);
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [endpoint, enabled, transform]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const handleFocus = () => {
      if (lastFetched && Date.now() - lastFetched > MIN_REFETCH_INTERVAL) {
        fetchData(false); // Silent refresh
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, enabled, lastFetched, fetchData]);

  // Refetch on visibility change
  useEffect(() => {
    if (!refetchOnVisibilityChange || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastFetched) {
        if (Date.now() - lastFetched > MIN_REFETCH_INTERVAL) {
          fetchData(false); // Silent refresh
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchOnVisibilityChange, enabled, lastFetched, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastFetched
  };
}

// Hook for fetching site content with auto-refresh
export function useSiteContent(page: string, section?: string) {
  return useDataFetch({
    endpoint: `/api/site-content?page=${page}${section ? `&section=${section}` : ''}`,
    enabled: !!page,
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });
}

// Hook for fetching blog posts with auto-refresh
export function useBlogPosts() {
  return useDataFetch({
    endpoint: '/api/blog/posts',
    transform: (data) => data.posts || [],
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });
}

// Hook for fetching services with auto-refresh
export function useServices() {
  return useDataFetch({
    endpoint: '/api/services',
    transform: (data) => data.services || [],
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });
}

// Hook for fetching events with auto-refresh
export function useEvents() {
  return useDataFetch({
    endpoint: '/api/events',
    transform: (data) => data.events || [],
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });
}
