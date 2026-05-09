'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  refreshFn: () => void | Promise<void>;
  enabled?: boolean;
  refetchOnFocus?: boolean;
  refetchOnVisibilityChange?: boolean;
  minInterval?: number; // Minimum milliseconds between refreshes
}

/**
 * Hook that adds auto-refresh functionality to any data fetcher
 * Automatically refetches when window regains focus or tab becomes visible
 */
export function useAutoRefresh({
  refreshFn,
  enabled = true,
  refetchOnFocus = true,
  refetchOnVisibilityChange = true,
  minInterval = 1000
}: UseAutoRefreshOptions) {
  const lastRefreshTime = useRef<number>(Date.now());
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    const now = Date.now();
    if (now - lastRefreshTime.current < minInterval) {
      return; // Prevent too frequent refreshes
    }

    lastRefreshTime.current = now;
    try {
      await refreshFn();
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, [enabled, refreshFn, minInterval]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const handleFocus = () => {
      refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, enabled, refresh]);

  // Refetch on visibility change
  useEffect(() => {
    if (!refetchOnVisibilityChange || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchOnVisibilityChange, enabled, refresh]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { refresh };
}
