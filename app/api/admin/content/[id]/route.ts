import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { revalidateTag } from 'next/cache';
import { SITE_CONTENT_CACHE_TAGS } from '@/src/lib/backend-content';
import { triggerContentWebhook } from '@/src/lib/content-webhook';

// GET /api/admin/content/[id] - Get single content item
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin()
      .from('site_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/content/[id] - Update content item
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      section,
      content_key,
      content_type,
      content,
      content_json,
      content_number,
      display_order,
      is_active
    } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (section !== undefined) updateData.section = section;
    if (content_key !== undefined) updateData.content_key = content_key;
    if (content_type !== undefined) updateData.content_type = content_type;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Handle content based on type
    if (content_type === 'json') {
      updateData.content_json = content_json;
      updateData.content = null;
      updateData.content_number = null;
    } else if (content_type === 'number') {
      updateData.content_number = content;
      updateData.content = null;
      updateData.content_json = null;
    } else {
      updateData.content = content;
      updateData.content_json = null;
      updateData.content_number = null;
    }

    const { data, error } = await supabaseAdmin()
      .from('site_content')
      // @ts-ignore - Supabase type inference issue with dynamic updates
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single() as any;

    if (error) {
      console.error('❌ Error updating content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate site content cache
    revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");
    if (data?.page) {
      revalidateTag(SITE_CONTENT_CACHE_TAGS.PAGE(String(data.page, "max")));
      if (data?.section) revalidateTag(SITE_CONTENT_CACHE_TAGS.SECTION(String(data.page, "max"), String(data.section)));
    }

    void triggerContentWebhook('update', 'site_content', {
      id,
      page: data?.page,
      section: data?.section,
      content_key: data?.content_key,
    });

    return NextResponse.json({ item: data });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/content/[id] - Delete content item
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin()
      .from('site_content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate site content cache
    revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");

    void triggerContentWebhook('delete', 'site_content', { id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
