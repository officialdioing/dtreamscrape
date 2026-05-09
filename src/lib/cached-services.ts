import 'server-only';

import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export const SERVICES_CACHE_TAGS = {
  LIST: 'services',
  ITEM: (key: string) => `service:${key}`,
} as const;

export const getPublishedServicesCached = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin()
      .from('services')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
  ['published-services'],
  { tags: [SERVICES_CACHE_TAGS.LIST], revalidate: 60 * 60 }
);

export async function getServiceCached(key: string) {
  const normalized = (key || '').trim().replace(/\s+/g, '');

  const cached = unstable_cache(
    async (lookup: string) => {
      const column = isUuid(lookup) ? 'id' : 'slug';
      const { data, error } = await supabaseAdmin()
        .from('services')
        .select('*')
        .eq(column, lookup)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    ['service', normalized],
    { tags: [SERVICES_CACHE_TAGS.LIST, SERVICES_CACHE_TAGS.ITEM(normalized)], revalidate: 60 * 60 }
  );

  return cached(normalized);
}

