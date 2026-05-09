'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseVersionedFetchOptions {
  endpoint: string;
  enabled?: boolean;
  pollInterval?: number; // How often to check version (default: 30 seconds)
}

interface UseVersionedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: number | null;
}

/**
 * Smart data fetching that only polls for version changes
 * Instead of constantly fetching data, it checks a lightweight version endpoint
 * and only fetches full data when the version changes
 */
export function useVersionedFetch<T = any>({
  endpoint,
  enabled = true,
  pollInterval = 30000 // Check every 30 seconds (very lightweight)
}: UseVersionedFetchOptions): UseVersionedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const lastVersionRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch the actual data
  const fetchData = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (mountedRef.current) {
        setData(result);
        setLastUpdate(Date.now());
      }
    } catch (err: any) {
      if (mountedRef.current) {
        console.error(`Error fetching ${endpoint}:`, err);
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, enabled]);

  // Check for version changes
  const checkVersion = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    try {
      const response = await fetch('/api/updates/version', {
        cache: 'no-store'
      });

      if (response.ok) {
        const { version } = await response.json();

        // If version changed, fetch new data
        if (lastVersionRef.current !== null && version !== lastVersionRef.current) {
          console.log('Content version changed, fetching updates...');
          await fetchData();
        }

        lastVersionRef.current = version;
      }
    } catch (err) {
      console.error('Error checking version:', err);
    }
  }, [enabled, fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled]);

  // Poll for version changes (very lightweight)
  useEffect(() => {
    if (!enabled) return;

    // Initial version check after data loads
    const initialCheck = setTimeout(() => {
      checkVersion();
    }, 1000);

    // Set up polling interval
    const interval = setInterval(() => {
      checkVersion();
    }, pollInterval);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [enabled, checkVersion, pollInterval]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdate
  };
}

/**
 * Hook that frontend pages can use to listen for content updates
 */
export function useContentUpdates(page: string, section?: string) {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const checkForUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/updates/version');
      if (response.ok) {
        const { version } = await response.json();
        const storedVersion = localStorage.getItem(`version-${page}-${section || 'default'}`);

        if (storedVersion && storedVersion !== String(version)) {
          setNeedsUpdate(true);
          return true;
        }

        // Update stored version
        localStorage.setItem(`version-${page}-${section || 'default'}`, String(version));
        setNeedsUpdate(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
    }
    return false;
  }, [page, section]);

  const acknowledgeUpdate = useCallback(() => {
    setNeedsUpdate(false);
  }, []);

  return {
    needsUpdate,
    checkForUpdates,
    acknowledgeUpdate
  };
}
