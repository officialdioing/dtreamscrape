import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(request: NextRequest) {
  try {
    // Fetch admin settings
    const { data: settingsData } = await getSupabaseClient()
      .from('availability_settings')
      .select('settings')
      .eq('id', 'default')
      .single();

    const settings = settingsData?.settings;

    return NextResponse.json({
      message: 'Debug endpoint to check admin settings',
      adminSettings: {
        sunday: settings?.weekly?.sunday,
        saturday: settings?.weekly?.saturday,
        monday: settings?.weekly?.monday
      },
      interpretation: {
        sunday_should_be_available: settings?.weekly?.sunday?.enabled || false,
        saturday_should_be_available: settings?.weekly?.saturday?.enabled || false,
        monday_should_be_available: settings?.weekly?.monday?.enabled || false
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message
    });
  }
}