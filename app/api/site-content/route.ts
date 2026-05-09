import { NextRequest, NextResponse } from 'next/server';
import { CACHE_DURATION } from '@/src/lib/cache';
import { revalidateTag } from 'next/cache';
import { SITE_CONTENT_CACHE_TAGS } from '@/src/lib/backend-content';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

function isDatabaseUnavailableError(error: any) {
  const message = String(error?.message || '');
  const details = String(error?.details || '');
  return (
    message.includes('fetch failed') ||
    message.includes('ETIMEDOUT') ||
    details.includes('ETIMEDOUT') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND')
  );
}

function revalidateSiteContent(page?: string | null, section?: string | null) {
  revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL);
  if (page) {
    revalidateTag(SITE_CONTENT_CACHE_TAGS.PAGE(page));
    if (section) {
      revalidateTag(SITE_CONTENT_CACHE_TAGS.SECTION(page, section));
    }
  }
}

// GET /api/site-content?page=home&section=hero
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const section = searchParams.get('section');

    // Build backend URL with query parameters
    const backendParams = new URLSearchParams();
    if (page) backendParams.set('page', page);
    if (section) backendParams.set('section', section);

    const backendUrl = `${BACKEND_URL}/api/content${backendParams.toString() ? `?${backendParams.toString()}` : ''}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different response formats from backend
    const items = data.items || data.data || data;
    const validItems = Array.isArray(items) ? items : [];

    // Group content by section for easier consumption (same logic as before)
    const groupedContent: Record<string, any> = {};
    validItems.forEach((item: any) => {
      const key = `${item.page}_${item.section}`;
      if (!groupedContent[key]) {
        groupedContent[key] = {};
      }

      // Use the appropriate content field based on content_type
      let value;
      if (item.content_type === 'json') {
        value = item.content_json;
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch {
            // keep as string if invalid JSON
          }
        }
      } else if (item.content_type === 'number') {
        value = item.content_number;
	    } else {
        value = item.content;
      }

      groupedContent[key][item.content_key] = {
        value,
        type: item.content_type,
        id: item.id,
        display_order: item.display_order
      };
    });

    const httpResponse = NextResponse.json({
      items: validItems,
      grouped: groupedContent
    });

    // Add cache headers for site content
    httpResponse.headers.set('Cache-Control', `public, max-age=${CACHE_DURATION.SITE_CONTENT}, stale-while-revalidate=${CACHE_DURATION.SITE_CONTENT * 2}`);
    httpResponse.headers.set('CDN-Cache-Control', `public, max-age=${CACHE_DURATION.SITE_CONTENT}, stale-while-revalidate=${CACHE_DURATION.SITE_CONTENT * 2}`);

    return httpResponse;
  } catch (error: any) {
    console.error('❌ Error fetching site content:', error);
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { items: [], grouped: {}, error: 'Database temporarily unavailable' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { items: [], grouped: {}, error: error.message || 'Failed to fetch site content' },
      { status: 500 }
    );
  }
}

// POST /api/site-content - Create or update content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body?.updates)) {
      const results = [];
      const pages = new Set<string>();
      const pageSections = new Set<string>();
      for (const update of body.updates) {
        const {
          page,
          section,
          content_key,
          content_type,
          content,
          content_json,
          content_number,
          display_order = 0
        } = update;

        if (!page || !section || !content_key || !content_type) {
          results.push({ error: 'Missing required fields', update });
          continue;
        }
        pages.add(page);
        pageSections.add(`${page}:${section}`);

        let updateData: any = {
          page,
          section,
          content_key,
          content_type,
          display_order,
          updated_at: new Date().toISOString()
        };

        if (content_type === 'json') {
          let parsed = content_json;
          if (typeof content_json === 'string') {
            try {
              parsed = JSON.parse(content_json);
            } catch {
              parsed = content_json;
            }
          }
          updateData.content_json = parsed;
          updateData.content = null;
          updateData.content_number = null;
        } else if (content_type === 'number') {
          updateData.content_number = content_number;
          updateData.content = null;
          updateData.content_json = null;
        } else {
          updateData.content = content;
          updateData.content_json = null;
          updateData.content_number = null;
        }

        const { data: existing } = await supabaseAdmin()
          .from('site_content')
          .select('id')
          .eq('page', page)
          .eq('section', section)
          .eq('content_key', content_key)
          .single() as any;

        if (existing) {
          const { data, error } = await supabaseAdmin()
            .from('site_content')
            // @ts-ignore - Supabase type inference issue with dynamic updates
            .update(updateData)
            .eq('id', existing.id)
            .select('*')
            .single();

          if (error) {
            results.push({ id: existing.id, error: error.message });
          } else {
            results.push({ id: existing.id, success: true, data });
          }
        } else {
          const { data, error } = await supabaseAdmin()
            .from('site_content')
            // @ts-ignore - Supabase type inference issue with insert
            .insert({ ...updateData, is_active: true })
            .select('*')
            .single() as any;

          if (error) {
            results.push({ error: error.message, update });
          } else {
            results.push({ id: data.id, success: true, data });
          }
        }
      }

      revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");
      for (const p of pages) revalidateTag(SITE_CONTENT_CACHE_TAGS.PAGE(p, "max"));
      for (const ps of pageSections) {
        const [p, s] = ps.split(':');
        if (p && s) revalidateTag(SITE_CONTENT_CACHE_TAGS.SECTION(p, s, "max"));
      }
      return NextResponse.json({ results }, { status: 200 });
    }

    const {
      page,
      section,
      content_key,
      content_type,
      content,
      content_json,
      content_number,
      display_order = 0
    } = body;

    if (!page || !section || !content_key || !content_type) {
      return NextResponse.json(
        { error: 'Missing required fields: page, section, content_key, content_type' },
        { status: 400 }
      );
    }

    // Determine which content field to use based on content_type
    let updateData: any = {
      page,
      section,
      content_key,
      content_type,
      display_order,
      updated_at: new Date().toISOString()
    };

        if (content_type === 'json') {
          let parsed = content_json;
          if (typeof content_json === 'string') {
            try {
              parsed = JSON.parse(content_json);
            } catch {
              parsed = content_json;
            }
          }
          updateData.content_json = parsed;
          updateData.content = null;
          updateData.content_number = null;
    } else if (content_type === 'number') {
      updateData.content_number = content_number;
      updateData.content = null;
      updateData.content_json = null;
    } else {
      updateData.content = content;
      updateData.content_json = null;
      updateData.content_number = null;
    }

    // Check if content already exists
    const { data: existing } = await supabaseAdmin()
      .from('site_content')
      .select('id')
      .eq('page', page)
      .eq('section', section)
      .eq('content_key', content_key)
      .single() as any;

    let result;
    if (existing) {
      // Update existing content
      const { data, error } = await supabaseAdmin()
        .from('site_content')
        // @ts-ignore - Supabase type inference issue with dynamic updates
        .update(updateData)
        .eq('id', existing.id)
        .select('*')
        .single() as any;

      if (error) throw error;
      result = data;
    } else {
      // Create new content
      const { data, error } = await supabaseAdmin()
        .from('site_content')
        // @ts-ignore - Supabase type inference issue with insert
        .insert({ ...updateData, is_active: true })
        .select('*')
        .single() as any;

      if (error) throw error;
      result = data;
	    }

	    revalidateSiteContent(page, section);
	    return NextResponse.json({ item: result }, { status: existing ? 200 : 201 });
	  } catch (error: any) {
	    console.error('❌ Error saving site content:', error);
	    return NextResponse.json({ error: error.message || 'Failed to save content' }, { status: 500 });
	  }
}

// PUT /api/site-content - Bulk update content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body; // Array of content items to update

	    if (!Array.isArray(updates)) {
	      return NextResponse.json({ error: 'updates must be an array' }, { status: 400 });
	    }

	    const results = [];
	    const pages = new Set<string>();
	    const pageSections = new Set<string>();

	    for (const update of updates) {
	      const { id, page, section, content_key, content_type, content, content_json, display_order } = update;
	      if (page) pages.add(page);
	      if (page && section) pageSections.add(`${page}:${section}`);

	      let updateData: any = { updated_at: new Date().toISOString() };

      if (content_type === 'json') {
        updateData.content_json = content_json;
        if (display_order !== undefined) updateData.display_order = display_order;
      } else if (content_type === 'number') {
        updateData.content_number = content;
        if (display_order !== undefined) updateData.display_order = display_order;
      } else {
        updateData.content = content;
        if (display_order !== undefined) updateData.display_order = display_order;
      }

      const { data, error } = await supabaseAdmin()
        .from('site_content')
        // @ts-ignore - Supabase type inference issue with dynamic updates
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single() as any;

      if (error) {
        console.error(`❌ Error updating content ${id}:`, error);
        results.push({ id, error: error.message });
      } else {
        results.push({ id, success: true, data });
      }
	    }

	    revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");
	    for (const p of pages) revalidateTag(SITE_CONTENT_CACHE_TAGS.PAGE(p, "max"));
	    for (const ps of pageSections) {
	      const [p, s] = ps.split(':');
	      if (p && s) revalidateTag(SITE_CONTENT_CACHE_TAGS.SECTION(p, s, "max"));
	    }
	    return NextResponse.json({ results });
	  } catch (error: any) {
	    console.error('❌ Error bulk updating site content:', error);
	    return NextResponse.json({ error: error.message || 'Failed to update content' }, { status: 500 });
	  }
}

// DELETE /api/site-content?id=xxx or DELETE /api/site-content with body { ids: [...] }
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

	    if (id) {
	      // Delete single item by id
	      const { error } = await supabaseAdmin()
	        .from('site_content')
	        // @ts-ignore - Supabase type inference issue with dynamic updates
	        .update({ is_active: false })
	        .eq('id', id);

	      if (error) throw error;

	      revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");
	      return NextResponse.json({ success: true, id });
	    }

    // Otherwise, check for bulk delete in body
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { data, error } = await supabaseAdmin()
      .from('site_content')
      // @ts-ignore - Supabase type inference issue with dynamic updates
      .update({ is_active: false })
      .in('id', ids)
      .select('*') as any;

	    if (error) throw error;

	    revalidateTag(SITE_CONTENT_CACHE_TAGS.ALL, "max");
	    return NextResponse.json({ success: true, deleted: data });
	  } catch (error: any) {
	    console.error('❌ Error deleting site content:', error);
	    return NextResponse.json({ error: error.message || 'Failed to delete content' }, { status: 500 });
	  }
}
