import 'server-only';

import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { supabasePublicServer } from '@/src/lib/supabase-public-server';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export const CACHE_TAGS = {
  BLOG_LIST: 'blog-posts',
  BLOG_POST: (key: string) => `blog-post:${key}`,
  PORTFOLIO_LIST: 'portfolio-items',
  PORTFOLIO_ITEM: (key: string) => `portfolio-item:${key}`,
} as const;

export const getPublishedBlogPostsCached = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin()
      .from('portfolio_items')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
  ['published-blog-posts'],
  { tags: [CACHE_TAGS.BLOG_LIST], revalidate: 60 * 60 }
);

export async function getPublishedBlogPostCached(key: string) {
  const normalized = (key || '').trim().replace(/\s+/g, '');

  const cached = unstable_cache(
    async (lookup: string) => {
      const query = supabaseAdmin().from('portfolio_items').select('*').eq('status', 'published');
      const { data, error } = isUuid(lookup)
        ? await query.eq('id', lookup).maybeSingle()
        : await query.eq('slug', lookup).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    ['published-blog-post', normalized],
    { tags: [CACHE_TAGS.BLOG_LIST, CACHE_TAGS.BLOG_POST(normalized)], revalidate: 60 * 60 }
  );

  return cached(normalized);
}

export const getPublishedPortfolioItemsCached = unstable_cache(
  async () => {
    const { data, error } = await supabasePublicServer()
      .from('portfolio_items')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('event_date', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data ?? [];
  },
  ['published-portfolio-items'],
  { tags: [CACHE_TAGS.PORTFOLIO_LIST], revalidate: 60 * 60 }
);

export async function getPublishedPortfolioItemCached(key: string) {
  const normalized = (key || '').trim().replace(/\s+/g, '');

  const cached = unstable_cache(
    async (lookup: string) => {
      const query = supabasePublicServer().from('portfolio_items').select('*').eq('status', 'published');
      const { data, error } = isUuid(lookup)
        ? await query.eq('id', lookup).maybeSingle()
        : await query.eq('slug', lookup).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    ['published-portfolio-item', normalized],
    { tags: [CACHE_TAGS.PORTFOLIO_LIST, CACHE_TAGS.PORTFOLIO_ITEM(normalized)], revalidate: 60 * 60 }
  );

  return cached(normalized);
}

export const getAllPortfolioItemsCached = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin()
      .from('portfolio_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
  ['all-portfolio-items'],
  { tags: [CACHE_TAGS.PORTFOLIO_LIST], revalidate: 60 * 60 }
);
