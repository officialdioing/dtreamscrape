import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { protectAdminRoute } from '@/src/lib/server-auth';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const column = isUuid(id) ? 'id' : 'slug';
  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('*')
    .eq(column, id)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const body = await request.json();

  const update = {
    slug: body.slug,
    title: body.title,
    client_name: body.client_name ?? null,
    event_date: body.event_date ?? null,
    event_type: body.event_type,
    location: body.location ?? null,
    description: body.description ?? '',
    images: body.images ?? [],
    featured_image: body.featured_image ?? '',
    gallery_images: body.gallery_images ?? [],
    budget: body.budget ?? null,
    guest_count: body.guest_count ?? null,
    vendors: body.vendors ?? [],
    testimonial: body.testimonial ?? null,
    meta_title: body.meta_title ?? null,
    meta_description: body.meta_description ?? null,
    status: body.status ?? 'draft',
    display_order: body.display_order ?? 0,
  };

  const column = isUuid(id) ? 'id' : 'slug';
  const { data, error } = await supabaseAdmin()
    .from('events')
    // @ts-ignore - Supabase type inference issue with dynamic updates
    .update(update)
    .eq(column, id)
    .select('*')
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const item = Array.isArray(data) ? data[0] : data;
  if (!item) {
    const upsertPayload = {
      ...update,
      slug: update.slug || id,
    };
    const { data: upserted, error: upsertError } = await supabaseAdmin()
      .from('events')
      // @ts-ignore - Supabase type inference issue with upsert
      .upsert(upsertPayload as any, { onConflict: 'slug' })
      .select('*')
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }

    return NextResponse.json({ item: upserted }, { status: 201 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;
  const { id } = await params;
  const column = isUuid(id) ? 'id' : 'slug';
  const { error } = await supabaseAdmin()
    .from('events')
    .delete()
    .eq(column, id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
