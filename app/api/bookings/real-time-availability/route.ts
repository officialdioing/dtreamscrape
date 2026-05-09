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

// Cache availability for 5 minutes to reduce database queries
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const availabilityCache = new Map<string, { data: any; timestamp: number }>();

function normalizeBookingDate(value: string) {
  return String(value).split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${startDate}-${endDate}`;
    const cached = availabilityCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch bookings from Supabase for the date range
    const { data: bookings, error } = await getSupabaseClient()
      .from('bookings')
      .select('consultation_date, consultation_time, status')
      .gte('consultation_date', startDate)
      .lte('consultation_date', endDate);

    if (error) {
      console.error('Availability check error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Transform Supabase response to match expected format
    const bookedDates: Array<{ date: string; bookedTimes: string[] }> = [];

    // Group bookings by date
    const bookingsByDate: Record<string, string[]> = {};

    for (const booking of (bookings || []).filter((row: any) => row?.status !== 'cancelled')) {
      const date = normalizeBookingDate(booking.consultation_date);
      const time = booking.consultation_time;

      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(time);
    }

    // Convert to expected format
    for (const [date, times] of Object.entries(bookingsByDate)) {
      if (times.length > 0) {
        bookedDates.push({ date, bookedTimes: times });
      }
    }

    const availability = {
      startDate,
      endDate,
      bookedDates,
      generatedAt: new Date().toISOString()
    };

    // Cache the result
    availabilityCache.set(cacheKey, {
      data: availability,
      timestamp: Date.now()
    });

    return NextResponse.json(availability);

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if a specific date/time is available
export async function checkSlotAvailability(date: string, time: string): Promise<boolean> {
  try {
    const { data: bookings, error } = await getSupabaseClient()
      .from('bookings')
      .select('id, status')
      .eq('consultation_date', date)
      .eq('consultation_time', time)
      .maybeSingle();

    if (error) return false;
    return !bookings || bookings.status === 'cancelled';
  } catch {
    return false;
  }
}
