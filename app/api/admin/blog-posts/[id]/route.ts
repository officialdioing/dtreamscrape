import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/src/lib/cached-posts';
import { protectAdminRoute } from '@/src/lib/server-auth';
import { triggerContentWebhook } from '@/src/lib/content-webhook';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

/**
 * GET /api/admin/blog-posts/[id]
 * Get a single blog post by ID or slug from the Go backend
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const key = (id || '').trim().replace(/\s+/g, '');

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/blog-posts/${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }
      const error = await response.json();
      console.error('Backend blog posts fetch error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to fetch blog post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ item: data.item ?? data });
  } catch (err) {
    console.error('Blog posts unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/blog-posts/[id]
 * Update a blog post via the Go backend
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const key = (id || '').trim().replace(/\s+/g, '');
  const body = await request.json();

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/blog-posts/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend blog posts update error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to update blog post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const item = data.item ?? data;

    // Revalidate cache after update
    // TODO: Fix revalidateTag for Next.js 16
    // revalidateTag(CACHE_TAGS.BLOG_LIST);
    // revalidateTag(CACHE_TAGS.PORTFOLIO_LIST);
    // if (item?.slug) {
    //   revalidateTag(CACHE_TAGS.BLOG_POST(item.slug));
    //   revalidateTag(CACHE_TAGS.PORTFOLIO_ITEM(item.slug));
    // }
    // if (item?.id) {
    //   revalidateTag(CACHE_TAGS.BLOG_POST(item.id));
    //   revalidateTag(CACHE_TAGS.PORTFOLIO_ITEM(item.id));
    // }

    void triggerContentWebhook('update', 'blog', {
      id: item?.id,
      slug: item?.slug,
    });

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Blog posts update unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blog-posts/[id]
 * Delete a blog post via the Go backend
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const key = (id || '').trim().replace(/\s+/g, '');

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/blog-posts/${key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend blog posts delete error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to delete blog post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const item = data.item ?? data;

    // Revalidate cache after delete
    // TODO: Fix revalidateTag for Next.js 16
    // revalidateTag(CACHE_TAGS.BLOG_LIST);
    // revalidateTag(CACHE_TAGS.PORTFOLIO_LIST);
    // if (item?.slug) {
    //   revalidateTag(CACHE_TAGS.BLOG_POST(item.slug));
    //   revalidateTag(CACHE_TAGS.PORTFOLIO_ITEM(item.slug));
    // }
    // if (item?.id) {
    //   revalidateTag(CACHE_TAGS.BLOG_POST(item.id));
    //   revalidateTag(CACHE_TAGS.PORTFOLIO_ITEM(item.id));
    // }

    void triggerContentWebhook('delete', 'blog', {
      id: item?.id,
      slug: item?.slug,
    });

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Blog posts delete unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}
