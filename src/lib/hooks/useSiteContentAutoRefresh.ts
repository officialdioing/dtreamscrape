'use client';

import { useCallback } from 'react';
import { useAutoRefresh } from './useAutoRefresh';

/**
 * Hook that fetches site content with automatic refresh on window focus/visibility change
 * Usage: const { data, loading, error, refresh } = useSiteContentAutoRefresh('home');
 */
export function useSiteContentAutoRefresh(page: string, section?: string) {
  const fetchFn = useCallback(async () => {
    const url = `/api/site-content?page=${page}${section ? `&section=${section}` : ''}`;
    const res = await fetch(`${url}&_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${page} content`);
    return await res.json();
  }, [page, section]);

  const { refresh } = useAutoRefresh({
    refreshFn: fetchFn,
    enabled: true,
    refetchOnFocus: true,
    refetchOnVisibilityChange: true
  });

  return {
    refresh,
    fetchContent: fetchFn
  };
}
