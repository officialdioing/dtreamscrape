import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { revalidateTag } from 'next/cache';
import { SERVICES_CACHE_TAGS } from '@/src/lib/cached-services';
import { triggerContentWebhook } from '@/src/lib/content-webhook';

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

function safeRevalidate(tag: string) {
  try {
    revalidateTag(tag, "max");
  } catch (error) {
    console.warn(`Failed to revalidate tag "${tag}":`, error);
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (isDatabaseUnavailableError(error)) {
        return NextResponse.json(
          { items: [], error: 'Database temporarily unavailable' },
          { status: 503 }
        );
      }
      return NextResponse.json({ items: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { items: [], error: 'Database temporarily unavailable' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { items: [], error: error instanceof Error ? error.message : 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const insert = {
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

  const { data, error } = await supabaseAdmin()
    .from('services')
    .insert([insert] as any)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  safeRevalidate(SERVICES_CACHE_TAGS.LIST);
  if (data?.id) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(data.id)));
  if (data?.slug) safeRevalidate(SERVICES_CACHE_TAGS.ITEM(String(data.slug)));
  void triggerContentWebhook('create', 'service', {
    id: data?.id,
    slug: data?.slug,
  });
  return NextResponse.json({ item: data }, { status: 201 });
}
