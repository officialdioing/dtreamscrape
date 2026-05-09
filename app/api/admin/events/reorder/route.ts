import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { protectAdminRoute } from '@/src/lib/server-auth';

export async function PATCH(request: NextRequest) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  const body = await request.json();
  const { order } = body;

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array of {id, display_order}' }, { status: 400 });
  }

  const results = [];
  for (const item of order) {
    const { id, display_order } = item;
    const { error } = await supabaseAdmin()
      .from('events')
      // @ts-ignore - Supabase type inference issue with dynamic updates
      .update({ display_order })
      .eq('id', id);
    if (error) {
      results.push({ id, error: error.message });
    } else {
      results.push({ id, success: true });
    }
  }

  return NextResponse.json({ results });
}
