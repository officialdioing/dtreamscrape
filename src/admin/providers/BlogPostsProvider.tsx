'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/src/admin/providers/GolangAuthProvider';
import { getAccessToken } from '@/src/lib/golang-auth';

type BlogPost = any;

type StoryBlock = {
  id: string;
  type: 'text' | 'image' | 'heading' | 'quote';
  content: string;
  level?: string;
  caption?: string;
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeBlocks(value: unknown): StoryBlock[] {
  if (!Array.isArray(value)) return [];

  const blocks: StoryBlock[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const rawType = (item as any).type;
    const rawContent = (item as any).content;
    const type = rawType === 'text' || rawType === 'image' || rawType === 'heading' || rawType === 'quote'
      ? rawType
      : null;
    if (!type || typeof rawContent !== 'string') continue;

    const block: StoryBlock = {
      id: safeString((item as any).id) || `b_${blocks.length + 1}`,
      type,
      content: rawContent,
    };

    const level = safeString((item as any).level);
    if (level) block.level = level;

    const caption = safeString((item as any).caption);
    if (caption) block.caption = caption;

    blocks.push(block);
  }

  return blocks;
}

function extractStoryPayload(row: any) {
  const descriptionValue = parseMaybeJson(row?.description);
  const descriptionObject =
    typeof descriptionValue === 'object' && descriptionValue !== null ? (descriptionValue as any) : null;
  const contentValue = parseMaybeJson(row?.content);
  const contentObject =
    typeof contentValue === 'object' && contentValue !== null ? (contentValue as any) : null;
  const legacyImagesValue = parseMaybeJson(row?.images);

  const descriptionBlocks = normalizeBlocks(descriptionObject?.contentBlocks);
  const contentBlocks = descriptionBlocks.length
    ? descriptionBlocks
    : normalizeBlocks(contentObject?.contentBlocks);
  const legacyBlocks = contentBlocks.length ? [] : normalizeBlocks(legacyImagesValue);

  return {
    subtitle: safeString(descriptionObject?.subtitle || contentObject?.subtitle),
    location: safeString(descriptionObject?.location || contentObject?.location || row?.location),
    image: safeString(descriptionObject?.image || contentObject?.image || row?.featured_image),
    contentBlocks: contentBlocks.length ? contentBlocks : legacyBlocks,
  };
}

type BlogPostsContextValue = {
  posts: BlogPost[];
  isLoading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  getPost: (idOrSlug: string) => Promise<BlogPost | null>;
  savePost: (post: BlogPost, mode: 'create' | 'update') => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
};

const BlogPostsContext = createContext<BlogPostsContextValue | null>(null);

export function BlogPostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const mapFromDb = (row: any) => {
    const story = extractStoryPayload(row);
    const descriptionText = safeString(row?.description);
    const paragraphs = descriptionText
      .split(/\n\s*\n/g)
      .map((p) => p.trim())
      .filter(Boolean);
    const gallery = Array.isArray(row?.gallery_images) ? row.gallery_images : [];
    const galleryImages = gallery.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0);

    const contentBlocks = story.contentBlocks.length
      ? story.contentBlocks
      : paragraphs.map((p: string, idx: number) => ({
          id: `t_${row.id}_${idx}`,
          type: 'text' as const,
          content: p,
        })).concat(
          galleryImages.map((url: string, idx: number) => ({
            id: `i_${row.id}_${idx}`,
            type: 'image' as const,
            content: url,
          }))
        );

    return {
      id: row.id,
      title: row.title || '',
      subtitle: story.subtitle,
      author: row.client_name || 'Dreamscape Team',
      date: (row.event_date || row.created_at || new Date().toISOString()).slice(0, 10),
      status: row.status === 'published' ? 'Published' : 'Draft',
      category: row.event_type || '',
      location: story.location || row.location || '',
      excerpt: row.meta_description || '',
      image: story.image || row.featured_image || '',
      contentBlocks,
      __raw: row,
    };
  };

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
      const token = getAccessToken();

      console.log('🔐 Blog Posts Auth:', {
        isAuthenticated,
        hasToken: !!token,
        tokenStart: token?.substring(0, 10),
        tokenLength: token?.length,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('📤 Blog Posts Request:', {
        url: `${backendUrl}/api/admin/portfolio-items`,
        hasAuthHeader: !!headers['Authorization'],
        authHeaderLength: headers['Authorization']?.length,
      });

      const res = await fetch(`${backendUrl}/api/admin/portfolio-items`, {
        cache: 'no-store',
        headers
      });

      console.log('📥 Blog Posts Response Status:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
      });

      const json = await res.json().catch(() => ({} as any));

      console.log('📊 Blog Posts Response:', {
        status: res.status,
        ok: res.ok,
        hasItems: !!json?.items,
        itemCount: json?.items?.length || 0,
        sampleItem: json?.items?.[0],
        fullResponse: json
      });

      if (!res.ok) {
        const message = json?.error || res.statusText || 'Failed to load posts';
        console.error('Failed to load posts:', message);
        setError(message);
        setPosts([]);
        return;
      }
      setError(null);

      const mappedPosts = (json.items || []).map(mapFromDb);
      console.log('✅ Mapped posts:', mappedPosts.length);
      setPosts(mappedPosts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load posts';
      console.error('Failed to load posts:', message);
      setError(message);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated]);

  const getPost: BlogPostsContextValue['getPost'] = async (idOrSlug) => {
    const key = (idOrSlug || '').trim().replace(/\s+/g, '');
    if (!key) return null;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
      const token = getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/api/admin/portfolio-items/${encodeURIComponent(key)}`, {
        cache: 'no-store',
        headers
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(json?.error || res.statusText || 'Failed to load post');
      }
      const mapped = mapFromDb(json.item);
      setPosts((prev) => {
        const exists = prev.some((p: any) => p.id === mapped.id);
        if (exists) return prev.map((p: any) => (p.id === mapped.id ? mapped : p));
        return [mapped, ...prev];
      });
      return mapped;
    } catch (e) {
      console.error('Failed to load post:', e);
      return null;
    }
  };

  const savePost: BlogPostsContextValue['savePost'] = async (post, mode) => {
    const slugBase =
      (post.title || 'story')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'story';
    const slug = post.__raw?.slug || `${slugBase}-${Date.now()}`;

    // Convert editor blocks back to database format
    const blocks = Array.isArray(post.contentBlocks) ? post.contentBlocks : [];
    const contentBlocks = blocks
      .map((b: any) => {
        const block: Record<string, unknown> = {
          id: String(b?.id || ''),
          type: b?.type,
          content: String(b?.content || ''),
        };
        if (b?.type === 'heading' && b?.level) block.level = String(b.level);
        if (b?.caption) block.caption = String(b.caption);
        return block;
      })
      .filter((b: any) => b.id && b.type && b.content);
    const galleryImages = blocks
      .filter((b: any) => b?.type === 'image' && String(b?.content || '').trim())
      .map((b: any) => String(b.content).trim());

    const storyPayload = {
      subtitle: post.subtitle || '',
      location: post.location || '',
      image: post.image || '',
      contentBlocks,
    };

    const payload = {
      slug,
      title: post.title,
      client_name: post.author || null,
      event_date: post.date || null,
      event_type: post.category || 'Wedding',
      location: post.location || null,
      description: JSON.stringify(storyPayload),
      content: storyPayload,
      images: galleryImages,
      featured_image: post.image || '',
      gallery_images: galleryImages,
      meta_description: post.excerpt || null,
      status: post.status === 'Published' ? 'published' : 'draft',
    };

    const routeKey = post?.id || post?.__raw?.id || post?.__raw?.slug || slug;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const endpoint =
      mode === 'create'
        ? `${backendUrl}/api/admin/portfolio-items`
        : `${backendUrl}/api/admin/portfolio-items/${encodeURIComponent(routeKey)}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method,
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to save post');

    const mapped = mapFromDb(json.item);
    setPosts((prev) => {
      if (mode === 'create') return [mapped, ...prev];
      return prev.map((p: any) => (p.id === mapped.id ? mapped : p));
    });
    return mapped;
  };

  const deletePost: BlogPostsContextValue['deletePost'] = async (id) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    const token = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/api/admin/portfolio-items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to delete post');
    setPosts((prev) => prev.filter((p: any) => p.id !== id));
  };

  const value = useMemo<BlogPostsContextValue>(
    () => ({ posts, isLoading, error, refresh, getPost, savePost, deletePost }),
    [posts, isLoading, error, refresh]
  );

  return <BlogPostsContext.Provider value={value}>{children}</BlogPostsContext.Provider>;
}

export function useBlogPosts() {
  const ctx = useContext(BlogPostsContext);
  if (!ctx) throw new Error('useBlogPosts must be used within BlogPostsProvider');
  return ctx;
}
