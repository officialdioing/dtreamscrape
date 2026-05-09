import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple Supabase client for server-side use
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

function normalizeBookingDate(value: string) {
  return String(value).split('T')[0];
}

// Returns { "2026-04-20": ["09:00", "09:30"], ... } for all bookings in a date range
// Uses Supabase data to determine taken slots
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 });
  }

  try {
    // Fetch all bookings within the date range from Supabase
    const { data: bookings, error } = await getSupabaseClient()
      .from('bookings')
      .select('consultation_date, consultation_time, status')
      .gte('consultation_date', startDate)
      .lte('consultation_date', endDate);

    if (error) {
      console.error('Error fetching taken slots:', error);
      return NextResponse.json(
        { taken: {}, error: error.message || 'Failed to fetch taken slots' },
        { status: 500 }
      );
    }

    // Group taken slots by date
    const taken: Record<string, string[]> = {};

    for (const booking of (bookings || []).filter((row: any) => row?.status !== 'cancelled')) {
      const date = normalizeBookingDate(booking.consultation_date);
      const time = booking.consultation_time;

      if (!taken[date]) {
        taken[date] = [];
      }
      taken[date].push(time);
    }

    return NextResponse.json({ taken }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error fetching taken slots:', error);
    return NextResponse.json(
      { taken: {}, error: error.message || 'Failed to fetch taken slots' },
      { status: 500 }
    );
  }
}
