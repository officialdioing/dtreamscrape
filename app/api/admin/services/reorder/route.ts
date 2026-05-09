import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { revalidateTag } from 'next/cache';
import { SERVICES_CACHE_TAGS } from '@/src/lib/cached-services';

function safeRevalidate(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch (error) {
    console.warn(`Failed to revalidate tag "${tag}":`, error);
  }
}

// PATCH /api/admin/services/reorder
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array of {id, display_order}' }, { status: 400 });
  }

  const results = [];
  for (const item of order) {
    const { id, display_order } = item;
    const { error } = await supabaseAdmin()
      .from('services')
      // @ts-ignore - Supabase type inference issue with dynamic updates
      .update({ display_order })
      .eq('id', id);

    if (error) {
      results.push({ id, error: error.message });
    } else {
      results.push({ id, success: true });
    }
  }

  safeRevalidate(SERVICES_CACHE_TAGS.LIST);
  return NextResponse.json({ results });
}
