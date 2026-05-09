import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler, ErrorType, createErrorResponse } from '@/src/lib/error-handler';
import { createClient } from '@supabase/supabase-js';
import {
  generateAvailabilityForDateRange,
  removeBookedSlots,
  generateTimeSlots
} from '@/src/lib/custom-booking';
import { DEFAULT_AVAILABILITY } from '@/src/lib/availability-manager';



// Simple Supabase client for server-side use
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Support both single date and date range queries
    if (!date && !startDate) {
      throw ErrorHandler.createError(
        'Date parameter (date or start_date/end_date) is required',
        ErrorType.VALIDATION,
        400,
        { providedParams: Array.from(searchParams.keys()) }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const queryDate = date || startDate;
    if (!dateRegex.test(queryDate)) {
      throw ErrorHandler.createError(
        'Invalid date format. Use YYYY-MM-DD',
        ErrorType.VALIDATION,
        400,
        { providedDate: queryDate }
      );
    }

    // Calculate start and end date with proper ISO formatting
    const start = date || startDate;
    const end = date || endDate;

    // Generate availability using custom booking system
    let customAvailability: Record<string, string[]> = {};

    try {
      // Generate base availability from settings
      const startDate = new Date(start);
      const endDate = new Date(end || start);

      customAvailability = generateAvailabilityForDateRange(
        startDate,
        endDate,
        DEFAULT_AVAILABILITY
      );

      // Fetch bookings from Supabase to remove booked slots
      const { data: bookings, error } = await getSupabaseClient()
        .from('bookings')
        .select('consultation_date, consultation_time, status')
        .gte('consultation_date', start)
        .lte('consultation_date', end);

      if (error) {
        throw ErrorHandler.createError(
          'Failed to fetch availability',
          ErrorType.INTERNAL,
          500,
          { originalError: error.message }
        );
      }

      // Remove booked slots from availability
      const validBookings = (bookings || []).map(b => ({
        id: b.consultation_date + b.consultation_time,
        consultation_date: b.consultation_date,
        consultation_time: b.consultation_time,
        status: b.status || 'confirmed',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        created_at: ''
      }));

      customAvailability = removeBookedSlots(customAvailability, validBookings);

    } catch (availabilityError) {
      console.error('Custom availability generation failed, using fallback:', availabilityError);

      // Fallback to simple time slot generation
      const allTimes = generateTimeSlots();
      const currentDate = new Date(start);
      const finalDate = new Date(end || start);

      while (currentDate <= finalDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        customAvailability[dateStr] = allTimes;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Generate all possible time slots for comparison
    const allTimeSlots = generateTimeSlots();

    // If single date query, transform to match frontend expectations
    if (date) {
      const availableTimes = customAvailability[date] || [];
      const bookedTimes = allTimeSlots.filter(time => !availableTimes.includes(time));

      const availableSlots = allTimeSlots.map(time => ({
        time,
        available: availableTimes.includes(time),
        date
      }));

      const httpResponse = NextResponse.json({
        date,
        bookedTimes,
        available: availableTimes.length > 0,
        totalSlots: allTimeSlots.length,
        bookedSlots: bookedTimes.length,
        allSlots: availableSlots,
      });

      httpResponse.headers.set('Cache-Control', 'no-store, max-age=0');
      httpResponse.headers.set('CDN-Cache-Control', 'no-store, max-age=0');

      return httpResponse;
    }

    // For date range queries, generate availability for each date
    const availableSlots: Record<string, Array<{ time: string; available: boolean; date: string }>> = {};

    // Generate date range
    const currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const availableTimes = customAvailability[dateStr] || [];

      availableSlots[dateStr] = allTimeSlots.map(time => ({
        time,
        available: availableTimes.includes(time),
        date: dateStr
      }));

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const httpResponse = NextResponse.json({
      start_date: startDate,
      end_date: endDate,
      available_slots: availableSlots
    });

    httpResponse.headers.set('Cache-Control', 'no-store, max-age=0');
    httpResponse.headers.set('CDN-Cache-Control', 'no-store, max-age=0');

    return httpResponse;

  } catch (error) {
    const appError = error instanceof Error ? error : ErrorHandler.createError(
      'Failed to check availability',
      ErrorType.INTERNAL,
      500
    );
    ErrorHandler.logError(appError, { operation: 'check_availability' });
    return createErrorResponse(appError);
  }
}
