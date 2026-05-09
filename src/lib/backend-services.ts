import 'server-only';
import { unstable_cache } from 'next/cache';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

export interface BackendService {
  id: string;
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  list_items: string[];
  cta_text: string;
  cta_link: string;
  status: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

async function fetchFromBackend(path: string): Promise<any> {
  const url = `${BACKEND_URL}/api${path}`;

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

export const SERVICES_CACHE_TAGS = {
  LIST: 'services',
  ITEM: (key: string) => `service:${key}`,
} as const;

export const getPublishedServicesCached = unstable_cache(
  async () => {
    try {
      const items = await fetchFromBackend('/services');
      const validItems = Array.isArray(items) ? items : [];
      return validItems.filter((service: BackendService) => service.status === 'published');
    } catch (error) {
      console.error('Failed to fetch services from backend:', error);
      return [];
    }
  },
  ['published-services'],
  { revalidate: 300 }
);

export async function getServiceCached(key: string) {
  const normalized = (key || '').trim();

  const cached = unstable_cache(
    async (lookup: string) => {
      try {
        // Try by slug first
        let items = await fetchFromBackend(`/services/slug/${lookup}`);
        if (Array.isArray(items) && items.length > 0) {
          return items[0];
        }

        // If not found, try by ID (if it's a UUID)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lookup)) {
          items = await fetchFromBackend(`/services/${lookup}`);
          if (Array.isArray(items) && items.length > 0) {
            return items[0];
          }
        }

        return null;
      } catch (error) {
        console.error(`Failed to fetch service ${lookup}:`, error);
        return null;
      }
    },
    ['service', normalized],
    { revalidate: 300 }
  );

  return cached(normalized);
}
