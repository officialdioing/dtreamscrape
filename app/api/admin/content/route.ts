import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { revalidateTag } from 'next/cache';
import { SITE_CONTENT_CACHE_TAGS } from '@/src/lib/backend-content';
import { triggerContentWebhook } from '@/src/lib/content-webhook';

// GET /api/admin/content?page=home - List all content for a page (or all if no page)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');

    let query = supabaseAdmin()
      .from('site_content')
      .select('*')
      .order('page', { ascending: true })
      .order('section', { ascending: true })
      .order('display_order', { ascending: true });

    if (page) {
      query = query.eq('page', page);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/content - Create new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      page,
      section,
      content_key,
      content_type,
      content,
      content_json,
      content_number,
      display_order = 0,
      is_active = true
    } = body;

    if (!page || !section || !content_key || !content_type) {
      return NextResponse.json(
        { error: 'Missing required fields: page, section, content_key, content_type' },
        { status: 400 }
      );
    }

    const insertData: any = {
      page,
      section,
      content_key,
      content_type,
      display_order,
      is_active,
    };

    if (content_type === 'json') {
      insertData.content_json = content_json;
    } else if (content_type === 'number') {
      insertData.content_number = content_number;
    } else {
      insertData.content = content;
    }

    const { data, error } = await supabaseAdmin()
      .from('site_content')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error creating content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");
    if (data?.page) revalidateTag(SITE_CONTENT_CACHE_TAGS.PAGE(String(data.page, "max")));
    if (data?.page && data?.section) revalidateTag(SITE_CONTENT_CACHE_TAGS.SECTION(String(data.page, "max"), String(data.section)));

    void triggerContentWebhook('create', 'site_content', {
      page: data?.page,
      section: data?.section,
      content_key: data?.content_key,
    });

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
