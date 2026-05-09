/**
 * Caching Configuration for Dreamscape Website
 *
 * Cache Strategy:
 * - Static content: 1 hour revalidation
 * - Portfolio/Events: 15 minutes revalidation
 * - Blog posts: 30 minutes revalidation
 * - Site content: 1 hour revalidation
 * - Bookings/Availability: 5 minutes revalidation (real-time data)
 */

export const CACHE_DURATION = {
  // Static content that rarely changes
  STATIC: 3600, // 1 hour in seconds

  // Portfolio items and events
  PORTFOLIO: 900, // 15 minutes

  // Blog posts and articles
  BLOG: 1800, // 30 minutes

  // Site content (home, about, services, etc.)
  SITE_CONTENT: 3600, // 1 hour

  // Real-time data like availability
  AVAILABILITY: 300, // 5 minutes

  // Media library
  MEDIA: 7200, // 2 hours
} as const;

/**
 * Generate cache headers for API responses
 */
export function generateCacheHeaders(maxAge: number, staleWhileRevalidate?: number) {
  const headers: Record<string, string> = {
    'Cache-Control': `public, max-age=${maxAge}${staleWhileRevalidate ? `, stale-while-revalidate=${staleWhileRevalidate}` : ''}`,
  };

  if (staleWhileRevalidate) {
    headers['CDN-Cache-Control'] = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  return headers;
}

/**
 * Wrap fetch with caching options
 */
export function cachedFetch(
  url: string,
  options: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {}
) {
  return fetch(url, {
    ...options,
    // Default revalidation time can be overridden
    next: {
      revalidate: CACHE_DURATION.STATIC,
      ...options.next,
    },
  });
}

/**
 * Cache tags for Next.js incremental static regeneration
 */
export const CACHE_TAGS = {
  PORTFOLIO: 'portfolio',
  PORTFOLIO_ITEM: (id: string) => `portfolio-${id}`,
  BLOG: 'blog',
  BLOG_POST: (slug: string) => `blog-${slug}`,
  SITE_CONTENT: 'site-content',
  SITE_CONTENT_PAGE: (page: string) => `content-${page}`,
  AVAILABILITY: 'availability',
  MEDIA: 'media',
  SERVICES: 'services',
  EVENTS: 'events',
} as const;
