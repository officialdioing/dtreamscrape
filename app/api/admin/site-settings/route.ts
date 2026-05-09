import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

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

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('site_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (error) {
      if (isDatabaseUnavailableError(error)) {
        return NextResponse.json(
          { settings: null, error: 'Database temporarily unavailable' },
          { status: 503 }
        );
      }
      return NextResponse.json({ settings: null, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ settings: data ?? null });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        { settings: null, error: 'Database temporarily unavailable' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { settings: null, error: error instanceof Error ? error.message : 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const update = {
    site_name: body.site_name,
    site_description: body.site_description ?? null,
    logo_url: body.logo_url ?? null,
    favicon_url: body.favicon_url ?? null,
    contact_email: body.contact_email,
    contact_phone: body.contact_phone,
    contact_address: body.contact_address ?? null,
    whatsapp_number: body.whatsapp_number,
    social_links: body.social_links ?? {},
    seo_settings: body.seo_settings ?? {},
    business_hours: body.business_hours ?? {},
  };

  const { data, error } = await supabaseAdmin()
    .from('site_settings')
    // @ts-ignore - Supabase type inference issue with dynamic updates
    .update(update as any)
    .eq('id', SETTINGS_ID)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
