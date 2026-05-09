import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_AVAILABILITY,
  generateAvailableSlots,
  isDateBookable,
  normalizeAvailabilitySettings,
  type AvailabilitySettings
} from '@/src/lib/availability-manager';

// Simple Supabase client for server-side use
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Fetch availability settings from database - no hardcoded defaults
async function getAvailabilitySettings(): Promise<AvailabilitySettings> {
  const { data, error } = await getSupabaseClient()
    .from('availability_settings')
    .select('settings')
    .eq('id', 'default')
    .single();

  if (error || !data) {
    return DEFAULT_AVAILABILITY;
  }

  return normalizeAvailabilitySettings(data.settings);
}

function normalizeBookingDate(value: string) {
  return String(value).split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Fetch custom availability settings
    const availabilitySettings = await getAvailabilitySettings();

    // Fetch all bookings within the date range from Supabase
    const { data: bookings, error } = await getSupabaseClient()
      .from('bookings')
      .select('consultation_date, consultation_time, status')
      .gte('consultation_date', startDate)
      .lte('consultation_date', endDate);

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Generate availability for each date in range using custom settings
    const availability: Record<string, {
      available: string[];
      booked: string[];
      date: string;
    }> = {};

    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (!isDateBookable(new Date(dateStr), availabilitySettings)) {
        availability[dateStr] = {
          date: dateStr,
          available: [],
          booked: []
        };
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Generate available slots using database settings - no hardcoded restrictions
      const allSlots = generateAvailableSlots(new Date(dateStr), availabilitySettings);

      // Get booked slots for this date
      const bookedSlots = (bookings || [])
        .filter((booking) => booking.status !== 'cancelled')
        .filter(b => normalizeBookingDate(b.consultation_date) === dateStr)
        .map(b => b.consultation_time);

      // Calculate available slots (remove booked ones)
      const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

      availability[dateStr] = {
        date: dateStr,
        available: availableSlots,
        booked: bookedSlots
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add cache headers to prevent caching
    const response = NextResponse.json({
      start_date: startDate,
      end_date: endDate,
      availability,
      settings: availabilitySettings
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('CDN-Cache-Control', 'no-store, max-age=0');

    return response;

  } catch (error: any) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
