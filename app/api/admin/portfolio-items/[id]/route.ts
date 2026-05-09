import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/src/lib/backend-url';
import { protectAdminRoute } from '@/src/lib/server-auth';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/src/lib/cached-posts';
import { triggerContentWebhook } from '@/src/lib/content-webhook';

/**
 * GET /api/admin/portfolio-items/[id]
 * Get a single portfolio item by ID or slug from the Go backend
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
    const response = await fetch(`${getBackendUrl()}/api/admin/portfolio-items/${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
      }
      const error = await response.json();
      console.error('Backend portfolio items fetch error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to fetch portfolio item' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ item: data.item ?? data });
  } catch (err) {
    console.error('Portfolio items unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/portfolio-items/[id]
 * Update a portfolio item via the Go backend
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
    const response = await fetch(`${getBackendUrl()}/api/admin/portfolio-items/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend portfolio items update error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to update portfolio item' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const item = data.item ?? data;

    // Revalidate cache after update
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

    void triggerContentWebhook('update', 'portfolio', {
      id: item?.id,
      slug: item?.slug,
    });

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Portfolio items update unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/portfolio-items/[id]
 * Delete a portfolio item via the Go backend
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
    const response = await fetch(`${getBackendUrl()}/api/admin/portfolio-items/${key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend portfolio items delete error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to delete portfolio item' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const item = data.item ?? data;

    // Revalidate cache after delete
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

    void triggerContentWebhook('delete', 'portfolio', {
      id: item?.id,
      slug: item?.slug,
    });

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Portfolio items delete unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}
