import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { revalidateTag } from 'next/cache';
import { SERVICES_CACHE_TAGS } from '@/src/lib/cached-services';
import { triggerContentWebhook } from '@/src/lib/content-webhook';
import { publishUpdate } from '@/src/lib/update-bus';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function safeRevalidate(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch (error) {
    console.warn(`Failed to revalidate tag "${tag}":`, error);
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const column = isUuid(id) ? 'id' : 'slug';
  const { data, error } = await supabaseAdmin()
    .from('services')
    .select('*')
    .eq(column, id)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const update = {
    slug: body.slug,
    category: body.category ?? null,
    title: body.title,
    subtitle: body.subtitle ?? null,
    description: body.description ?? '',
    image: body.image ?? null,
    list_items: body.list_items ?? [],
    cta_text: body.cta_text ?? null,
    cta_link: body.cta_link ?? null,
    status: body.status ?? 'draft',
    display_order: body.display_order ?? 0,
  };

  const column = isUuid(id) ? 'id' : 'slug';
  const { data, error } = await supabaseAdmin()
    .from('services')
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
      .from('services')
      // @ts-ignore - Supabase type inference issue with upsert
      .upsert(upsertPayload as any, { onConflict: 'slug' })
      .select('*')
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }

    safeRevalidate(SERVICES_CACHE_TAGS.LIST);
    if (id) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(id)));
    if (upserted?.id) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(upserted.id)));
    if (upserted?.slug) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(upserted.slug)));
    void triggerContentWebhook('create', 'service', {
      id: upserted?.id,
      slug: upserted?.slug,
    });
    return NextResponse.json({ item: upserted }, { status: 201 });
  }
  safeRevalidate(SERVICES_CACHE_TAGS.LIST);
  if (id) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(id)));
  if ((item as any)?.id) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String((item as any).id)));
  if ((item as any)?.slug) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String((item as any).slug)));

  // Publish real-time update
  publishUpdate({
    version: Date.now(),
    type: 'content_update',
    resource: 'service',
    action: 'update',
    id: (item as any)?.id || id,
    timestamp: new Date().toISOString(),
  });

  void triggerContentWebhook('update', 'service', {
    id: (item as any)?.id || id,
    slug: (item as any)?.slug,
  });
  return NextResponse.json({ item });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const column = isUuid(id) ? 'id' : 'slug';
  const { error } = await supabaseAdmin()
    .from('services')
    .delete()
    .eq(column, id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  safeRevalidate(SERVICES_CACHE_TAGS.LIST);
  if (id) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(id)));

  // Publish real-time update
  publishUpdate({
    version: Date.now(),
    type: 'content_update',
    resource: 'service',
    action: 'delete',
    id: id,
    timestamp: new Date().toISOString(),
  });

  void triggerContentWebhook('delete', 'service', { id });
  return NextResponse.json({ success: true });
}
