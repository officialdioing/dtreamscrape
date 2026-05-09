import 'server-only';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/src/lib/cached-posts';

import { getBackendUrl } from '@/src/lib/backend-url';

export interface BackendPortfolioItem {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  event_date: string;
  event_type: string;
  location: string;
  description: string;
  images: string[];
  featured_image: string;
  gallery_images: string[];
  budget: number;
  guest_count: number;
  vendors: string[];
  testimonial: string;
  meta_title: string;
  meta_description: string;
  status: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchFromBackend(path: string): Promise<any> {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}/api${path}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`Backend fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Handle different response formats from backend
  if (data.items) return data.items;  // { items: [...] }
  if (data.data) return data.data;      // { data: [...] }
  return data;                         // [...] directly
}

export const PORTFOLIO_CACHE_TAGS = {
  LIST: 'portfolio',
  ITEM: (slug: string) => `portfolio:${slug}`,
} as const;

export const getPortfolioItemsCached = unstable_cache(
  async () => {
    try {
      const items = await fetchFromBackend('/portfolio-items');
      const validItems = Array.isArray(items) ? items : [];
      return validItems.filter((item: BackendPortfolioItem) => item.status === 'published');
    } catch (error) {
      console.error('Failed to fetch portfolio items from backend:', error);
      return [];
    }
  },
  ['portfolio-items'],
  { tags: [CACHE_TAGS.PORTFOLIO_LIST], revalidate: 300 }
);

export async function getPortfolioItemBySlugCached(slug: string) {
  const cached = unstable_cache(
    async (lookup: string) => {
      try {
        const items = await fetchFromBackend(`/portfolio-items/${lookup}`);
        if (Array.isArray(items) && items.length > 0) {
          return items[0];
        }
        return null;
      } catch (error) {
        console.error(`Failed to fetch portfolio item ${lookup}:`, error);
        return null;
      }
    },
    ['portfolio-item', slug],
    { tags: [CACHE_TAGS.PORTFOLIO_LIST, CACHE_TAGS.PORTFOLIO_ITEM(slug)], revalidate: 300 }
  );

  return cached(slug);
}
