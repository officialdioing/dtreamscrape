import 'server-only';
import { unstable_cache } from 'next/cache';

import { getBackendUrl } from '@/src/lib/backend-url';

export const SITE_CONTENT_CACHE_TAGS = {
  ALL: 'site-content',
  PAGE: (page: string) => `site-content:${page}`,
  SECTION: (page: string, section: string) => `site-content:${page}:${section}`,
} as const;

export interface BackendSiteContent {
  id: string;
  page: string;
  section: string;
  content_key: string;
  content_type: 'text' | 'json' | 'number' | 'boolean';
  content: string | null;
  content_json: Record<string, unknown> | null;
  content_number: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchFromBackend(path: string): Promise<any> {
  const url = `${getBackendUrl()}/api${path}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 } // Cache for 5 minutes
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

function normalizeValue(item: BackendSiteContent) {
  if (item.content_type === 'json') {
    const value = item.content_json;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (item.content_type === 'number') return item.content_number;
  if (item.content_type === 'boolean') return item.content_json;
  return item.content;
}

function groupItems(items: BackendSiteContent[]) {
  const grouped: Record<string, any> = {};
  for (const item of items) {
    const key = `${item.page}_${item.section}`;
    if (!grouped[key]) grouped[key] = {};
    grouped[key][item.content_key] = {
      value: normalizeValue(item),
      type: item.content_type,
      id: item.id,
      display_order: item.display_order,
    };
  }
  return grouped;
}

export const getSiteContentPageCached = (page: string) =>
  unstable_cache(
    async (p: string) => {
      try {
        const items = await fetchFromBackend(`/content?page=${encodeURIComponent(p)}`);
        const validItems = Array.isArray(items) ? items : [];
        return { items: validItems, grouped: groupItems(validItems) };
      } catch (error) {
        console.error(`Failed to fetch site content for page ${p}:`, error);
        return { items: [], grouped: {} };
      }
    },
    ['site-content-page', page],
    { revalidate: 300 }
  )(page);

export const getSiteContentSectionCached = (page: string, section: string) =>
  unstable_cache(
    async (p: string, s: string) => {
      try {
        const items = await fetchFromBackend(
          `/content?page=${encodeURIComponent(p)}&section=${encodeURIComponent(s)}`
        );
        const validItems = Array.isArray(items) ? items : [];
        return { items: validItems, grouped: groupItems(validItems) };
      } catch (error) {
        console.error(`Failed to fetch site content for ${p}/${s}:`, error);
        return { items: [], grouped: {} };
      }
    },
    ['site-content-section', page, section],
    { revalidate: 300 }
  )(page, section);
