import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_AVAILABILITY,
  normalizeAvailabilitySettings,
  type AvailabilitySettings
} from '@/src/lib/availability-manager';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Table name for availability settings
const AVAILABILITY_TABLE = 'availability_settings';
const RETRY_DELAY_MS = 250;

async function saveAvailabilitySettings(settings: AvailabilitySettings): Promise<{ settings: AvailabilitySettings }> {
  const supabase = getSupabaseClient();

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await supabase
      .from(AVAILABILITY_TABLE)
      .upsert({
        id: 'default',
        settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (!error) {
      return data;
    }

    if (attempt === 3) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
  }

  throw new Error('Failed to save availability settings');
}

// GET - Fetch availability settings
export async function GET() {
  try {
    const { data, error } = await getSupabaseClient()
      .from(AVAILABILITY_TABLE)
      .select('settings')
      .eq('id', 'default')
      .single();

    if (error) {
      // If settings don't exist, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json(DEFAULT_AVAILABILITY);
      }
      throw error;
    }

    return NextResponse.json(normalizeAvailabilitySettings(data?.settings as Partial<AvailabilitySettings> | null));

  } catch (error: any) {
    console.error('Error fetching availability settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability settings' },
      { status: 500 }
    );
  }
}

// POST - Save availability settings
export async function POST(request: NextRequest) {
  try {
    const settings: AvailabilitySettings = await request.json();

    // Validate settings
    if (!settings.weekly) {
      return NextResponse.json(
        { error: 'Invalid availability settings' },
        { status: 400 }
      );
    }

    const data = await saveAvailabilitySettings(settings);

    // Trigger webhook to notify frontend, but don't block the save on it
    void triggerAvailabilityWebhook();

    return NextResponse.json({
      success: true,
      settings: data.settings,
      message: 'Availability settings saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving availability settings:', error);
    return NextResponse.json(
      { error: 'Failed to save availability settings', message: error.message },
      { status: 500 }
    );
  }
}

// Trigger webhook after availability settings change
async function triggerAvailabilityWebhook() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/updates/version`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'availability_update',
        timestamp: new Date().toISOString()
      })
    });
  } catch (webhookError) {
    console.error('Failed to trigger availability webhook:', webhookError);
    // Don't fail the request if webhook fails
  }
}

// PATCH - Partially update availability settings
export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();

    // Get current settings
    const { data: current } = await getSupabaseClient()
      .from(AVAILABILITY_TABLE)
      .select('settings')
      .eq('id', 'default')
      .single();

    const currentSettings = normalizeAvailabilitySettings(current?.settings as Partial<AvailabilitySettings> | null);

    // Merge updates
    const updatedSettings = normalizeAvailabilitySettings({
      ...currentSettings,
      ...updates,
      weekly: {
        ...currentSettings.weekly,
        ...(updates.weekly || {})
      }
    });

    const data = await saveAvailabilitySettings(updatedSettings);

    // Trigger webhook to notify frontend, but don't block the save on it
    void triggerAvailabilityWebhook();

    return NextResponse.json({
      success: true,
      settings: data.settings,
      message: 'Availability settings updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating availability settings:', error);
    return NextResponse.json(
      { error: 'Failed to update availability settings' },
      { status: 500 }
    );
  }
}
