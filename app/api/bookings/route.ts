import { NextRequest, NextResponse } from 'next/server';
import { bookingSchema, sanitizeInput } from '@/src/lib/validation';
import { rateLimitMiddleware } from '@/src/lib/rate-limit';
import { ErrorHandler, ErrorType, createErrorResponse } from '@/src/lib/error-handler';
import { createClient } from '@supabase/supabase-js';
import { sendCustomerConfirmationEmail, sendBusinessNotificationEmail } from '@/src/lib/email-service';
import { publishUpdate } from '@/src/lib/update-bus';

const isDuplicateSlotError = (error: any) => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return code === '23505' || message.includes('duplicate key value violates unique constraint');
};

// Simple Supabase client for server-side use
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * POST /api/bookings - Create new consultation booking
 * Uses Supabase directly (frontend implementation)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitMiddleware(request);
    if (!rateLimitResult.success) return rateLimitResult.response;

    const body = await request.json();

    // Validate request body
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      throw ErrorHandler.createError(
        'Validation failed',
        ErrorType.VALIDATION,
        400,
        { errors }
      );
    }

    const data = validationResult.data;

    // Check for existing booking in Supabase (final validation)
    const supabase = getSupabaseClient();
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('consultation_date', data.consultation_date)
      .eq('consultation_time', data.consultation_time)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (checkError) {
      throw ErrorHandler.createError(
        'Failed to check availability',
        ErrorType.INTERNAL,
        500,
        { originalError: checkError.message }
      );
    }

    if (existingBooking) {
      throw ErrorHandler.createError(
        'This time slot is already booked',
        ErrorType.CONFLICT,
        409
      );
    }

    // Prepare booking data for Supabase
    const bookingData = {
      first_name: sanitizeInput(data.first_name),
      last_name: sanitizeInput(data.last_name),
      email: sanitizeInput(data.email),
      phone: data.phone ? sanitizeInput(data.phone) : '',
      event_date: data.event_date || null,
      event_location: data.event_location ? sanitizeInput(data.event_location) : null,
      event_types: data.event_types || [],
      budget: data.budget || null,
      guests: data.guests || null,
      how_did_you_hear: data.how_did_you_hear ? sanitizeInput(data.how_did_you_hear) : null,
      additional_details: data.additional_details ? sanitizeInput(data.additional_details) : null,
      consultation_date: data.consultation_date,
      consultation_time: data.consultation_time,
      file_urls: data.file_urls || [],
      file_names: data.file_names || [],
      status: 'pending',
    };

    // Insert booking directly into Supabase
    const { data: newBooking, error: insertError } = await getSupabaseClient()
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (insertError) {
      if (isDuplicateSlotError(insertError)) {
        throw ErrorHandler.createError(
          'This time slot is already booked',
          ErrorType.CONFLICT,
          409
        );
      }
      throw ErrorHandler.createError(
        'Failed to create booking',
        ErrorType.INTERNAL,
        500,
        { originalError: insertError.message }
      );
    }

    // Send confirmation emails
    try {
      // Send confirmation email to customer
      const customerEmailResult = await sendCustomerConfirmationEmail({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        consultation_date: data.consultation_date,
        consultation_time: data.consultation_time,
        event_date: data.event_date,
        event_location: data.event_location,
        event_types: data.event_types,
        budget: data.budget,
        guests: data.guests,
        how_did_you_hear: data.how_did_you_hear,
        additional_details: data.additional_details,
      });

      // Send notification email to business
      const businessEmailResult = await sendBusinessNotificationEmail({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        consultation_date: data.consultation_date,
        consultation_time: data.consultation_time,
        event_date: data.event_date,
        event_location: data.event_location,
        event_types: data.event_types,
        budget: data.budget,
        guests: data.guests,
        how_did_you_hear: data.how_did_you_hear,
        additional_details: data.additional_details,
      });

      if (customerEmailResult.success) {
        console.log('✅ Customer confirmation email sent');
      } else {
        console.warn('⚠️ Failed to send customer email');
      }

      if (businessEmailResult.success) {
        console.log('✅ Business notification email sent');
      } else {
        console.warn('⚠️ Failed to send business notification email');
      }

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Continue even if emails fail - booking is still saved
    }

    publishUpdate({
      version: Date.now(),
      type: 'booking_update',
      action: 'create',
      resource: 'bookings',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      booking: newBooking,
      message: 'Booking created successfully! Check your email for confirmation.'
    }, { status: 201 });

  } catch (error) {
    const appError = error instanceof Error ? error : ErrorHandler.createError(
      'Failed to create booking',
      ErrorType.INTERNAL,
      500
    );
    ErrorHandler.logError(appError, { operation: 'create_booking' });
    return createErrorResponse(appError);
  }
}

/**
 * GET /api/bookings - Get all bookings
 * Uses Supabase directly (frontend implementation)
 */
export async function GET(request: NextRequest) {
  try {
    const { data: bookings, error } = await getSupabaseClient()
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw ErrorHandler.createError(
        'Failed to fetch bookings',
        ErrorType.INTERNAL,
        500,
        { originalError: error.message }
      );
    }

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings?.length || 0
    });

  } catch (error) {
    const appError = error instanceof Error ? error : ErrorHandler.createError(
      'Failed to fetch bookings',
      ErrorType.INTERNAL,
      500
    );
    ErrorHandler.logError(appError, { operation: 'get_bookings' });
    return createErrorResponse(appError);
  }
}
