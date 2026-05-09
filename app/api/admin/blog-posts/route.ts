import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/src/lib/backend-url';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/src/lib/cached-posts';
import { protectAdminRoute } from '@/src/lib/server-auth';
import { triggerContentWebhook } from '@/src/lib/content-webhook';

/**
 * GET /api/admin/blog-posts
 * List all blog posts from the Go backend
 */
export async function GET() {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;

  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/blog-posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend blog posts list error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to load blog posts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ items: data.data ?? data.items ?? [] });
  } catch (err) {
    console.error('Blog posts list unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blog-posts
 * Create a new blog post via the Go backend
 */
export async function POST(request: NextRequest) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    const response = await fetch(`${getBackendUrl()}/api/admin/blog-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend blog posts create error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to create blog post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const item = data.item ?? data;

    // Revalidate cache after create
    revalidateTag(CACHE_TAGS.BLOG_LIST);
    revalidateTag(CACHE_TAGS.PORTFOLIO_LIST);
    if (item?.slug) {
      revalidateTag(CACHE_TAGS.BLOG_POST(item.slug));
      revalidateTag(CACHE_TAGS.PORTFOLIO_ITEM(item.slug));
    }
    if (item?.id) {
      revalidateTag(CACHE_TAGS.BLOG_POST(item.id));
      revalidateTag(CACHE_TAGS.PORTFOLIO_ITEM(item.id));
    }

    void triggerContentWebhook('create', 'blog', {
      id: item?.id,
      slug: item?.slug,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error('Blog posts create unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}
