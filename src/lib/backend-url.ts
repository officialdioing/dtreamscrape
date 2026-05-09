/**
 * Get the backend API URL from environment variables
 * @throws Error if NEXT_PUBLIC_BACKEND_API_URL is not set
 */
export function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_BACKEND_API_URL is not set. Please configure this environment variable.');
  }
  if (url.includes('localhost') && typeof window !== 'undefined') {
    console.warn('⚠️ Using localhost backend URL. This should only happen in development.');
  }
  return url;
}

/**
 * Cached version of getBackendUrl for server-side use
 * Returns the backend URL once per request lifecycle
 */
export function getBackendUrlCached(): string {
  return getBackendUrl();
}
