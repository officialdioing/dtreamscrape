'use client';

import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  retryCount?: number;
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsync<T = any>(options: UseAsyncOptions = {}) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options.retryCount || 3;

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>): Promise<T | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await asyncFunction();
        setState({ data: result, error: null, isLoading: false });
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setState({ data: null, error: errorMessage, isLoading: false });

        if (options.onError) {
          options.onError(errorMessage);
        }

        console.error('Async operation failed:', error);
        return null;
      }
    },
    [options]
  );

  const retry = useCallback(
    async (asyncFunction: () => Promise<T>) => {
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        return await execute(asyncFunction);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Maximum retry attempts reached',
        }));
        return null;
      }
    },
    [execute, retryCount, maxRetries]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
    setRetryCount(0);
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    retryCount,
    canRetry: retryCount < maxRetries,
  };
}

/**
 * Hook for API calls with automatic error handling
 */
export function useApi<T = any>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const fetch = useCallback(
    async (
      url: string,
      options?: RequestInit,
      onSuccess?: (data: T) => void
    ): Promise<T | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        setState({ data, error: null, isLoading: false });

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while making the request';

        setState({ data: null, error: errorMessage, isLoading: false });
        console.error('API request failed:', error);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    fetch,
    reset,
  };
}
