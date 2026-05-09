/**
 * Standardized data fetching utilities with consistent error handling,
 * loading states, and caching.
 *
 * This module provides reusable patterns for fetching data from APIs,
 * Supabase, and other sources with proper TypeScript typing.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Fetch state for loading indicators
 */
export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * Fetch options with caching and revalidation
 */
export interface FetchOptions extends RequestInit {
  /**
   * Cache revalidation time in seconds
   * @default 60 (1 minute)
   */
  revalidate?: number;

  /**
   * Cache tags for Next.js incremental static regeneration
   */
  tags?: string[];

  /**
   * Whether to retry failed requests
   * @default false
   */
  retry?: boolean;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  retryCount?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a standard API response object
 *
 * @param success - Whether the operation succeeded
 * @param data - Response data (optional)
 * @param error - Error message (optional)
 * @param message - Additional message (optional)
 * @returns Formatted API response
 *
 * @example
 * ```ts
 * return createResponse(true, { id: 1, name: 'John' }, undefined, 'User created');
 * ```
 */
export function createResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create an error response
 *
 * @param error - Error message
 * @param statusCode - HTTP status code (optional)
 * @returns Formatted error response
 *
 * @example
 * ```ts
 * return createErrorResponse('User not found', 404);
 * ```
 */
export function createErrorResponse(
  error: string,
  statusCode?: number
): ApiResponse {
  return createResponse(false, undefined, error);
}

/**
 * Delay execution (useful for retries)
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry on failure
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryCount - Current retry attempt
 * @returns Fetch response
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit & { retryCount?: number; retryDelay?: number },
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Don't retry on client errors (4xx)
    if (!response.ok && response.status >= 400 && response.status < 500) {
      return response;
    }

    // Retry on server errors (5xx) or network issues
    if (!response.ok && retryCount < (options.retryCount || 3)) {
      await delay(options.retryDelay || 1000);
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    // Retry on network errors
    if (retryCount < (options.retryCount || 3)) {
      await delay(options.retryDelay || 1000);
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
}

// ============================================================================
// Server-Side Fetching (API Routes & Server Components)
// ============================================================================

/**
 * Server-side fetch with caching and error handling
 *
 * Use in API routes or server components for consistent data fetching
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Typed API response
 *
 * @example
 * ```ts
 * // In API route or server component
 * const response = await serverFetch<User>('/api/users/123', {
 *   tags: ['users', 'user-123'],
 *   revalidate: 3600 // 1 hour
 * });
 *
 * if (response.success) {
 *   console.log(response.data);
 * }
 * ```
 */
export async function serverFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const fetchFn = options.retry ? fetchWithRetry : fetch;
    const response = await fetchFn(url, {
      ...options,
      next: {
        revalidate: options.revalidate || 60,
        tags: options.tags,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return createErrorResponse(
        `HTTP ${response.status}: ${errorText}`,
        response.status
      );
    }

    const data = await response.json();
    return createResponse(true, data);
  } catch (error) {
    console.error('Fetch error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Fetch multiple URLs in parallel
 *
 * @param urls - Array of URLs to fetch
 * @param options - Fetch options (applied to all requests)
 * @returns Array of API responses
 *
 * @example
 * ```ts
 * const responses = await fetchAll<User>(
 *   ['/api/users/1', '/api/users/2', '/api/users/3'],
 *   { revalidate: 3600 }
 * );
 * ```
 */
export async function fetchAll<T>(
  urls: string[],
  options: FetchOptions = {}
): Promise<ApiResponse<T>[]> {
  const responses = await Promise.all(
    urls.map(url => serverFetch<T>(url, options))
  );
  return responses;
}

// ============================================================================
// Client-Side Fetching (Browser Components)
// ============================================================================

/**
 * Client-side fetch hook options
 */
export interface UseFetchOptions<T> extends FetchOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback called on successful fetch
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback called on failed fetch
   */
  onError?: (error: string) => void;

  /**
   * Transform response data before setting state
   */
  transform?: (data: T) => T;
}

/**
 * Custom hook for client-side data fetching
 *
 * Provides loading states, error handling, and automatic refetching
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch state and refetch function
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, isLoading, error, refetch } = useFetch<User>(
 *     `/api/users/${userId}`,
 *     {
 *       enabled: !!userId,
 *       onSuccess: (data) => console.log('Loaded:', data)
 *     }
 *   );
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   return <div>{data.name}</div>;
 * }
 * ```
 */
export function useFetch<T>(
  url: string,
  options: UseFetchOptions<T> = {}
): FetchState<T> & { refetch: () => Promise<void> } {
  const {
    enabled = true,
    onSuccess,
    onError,
    transform,
    retry = false,
    ...fetchOptions
  } = options;

  const [state, setState] = React.useState<FetchState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
    isError: false,
    isSuccess: false,
  });

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const fetchFn = retry ? fetchWithRetry : fetch;
      const response = await fetchFn(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let data = await response.json();
      if (transform) {
        data = transform(data);
      }

      setState({
        data,
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      });

      onSuccess?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        isError: true,
        isSuccess: false,
      });
      onError?.(errorMessage);
    }
  }, [url, enabled, retry, fetchOptions, onSuccess, onError, transform]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// ============================================================================
// Supabase Fetching
// ============================================================================

/**
 * Supabase query options
 */
export interface SupabaseFetchOptions {
  /**
   * Select columns (default: '*')
   */
  select?: string;

  /**
   * Filter by column
   */
  eq?: { column: string; value: unknown };

  /**
   * Order by column
   */
  order?: { column: string; ascending?: boolean };

  /**
   * Limit results
   */
  limit?: number;

  /**
   * Single result
   */
  single?: boolean;
}

/**
 * Fetch from Supabase with error handling
 *
 * @param table - Table name
 * @param options - Query options
 * @param supabase - Supabase client instance
 * @returns Typed API response
 *
 * @example
 * ```ts
 * import { supabaseAdmin } from '@/src/lib/supabase-admin';
 *
 * const response = await supabaseFetch<User>(
 *   'users',
 *   { eq: { column: 'id', value: '123' }, single: true },
 *   supabaseAdmin()
 * );
 * ```
 */
export async function supabaseFetch<T>(
  table: string,
  options: SupabaseFetchOptions = {},
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
): Promise<ApiResponse<T | T[]>> {
  try {
    let query = supabase
      .from(table)
      .select(options.select || '*');

    if (options.eq) {
      query = query.eq(options.eq.column, options.eq.value);
    }

    if (options.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.single) {
      query = query.single();
    }

    const { data, error } = await query;

    if (error) {
      return createErrorResponse(error.message);
    }

    return createResponse(true, data as T | T[]);
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle API errors consistently
 *
 * @param error - Error object or message
 * @returns Formatted error message
 */
export function handleApiError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unexpected error occurred';
}

/**
 * Wrap async function with error handling
 *
 * @param fn - Async function to wrap
 * @returns Response with error handling
 *
 * @example
 * ```ts
 * const safeOperation = withErrorHandling(async () => {
 *   return await riskyOperation();
 * });
 * ```
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return createResponse(true, data);
  } catch (error) {
    return createErrorResponse(handleApiError(error));
  }
}

// ============================================================================
// TypeScript Types (for React import)
// ============================================================================

import React from 'react';
