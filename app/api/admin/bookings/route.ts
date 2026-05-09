import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler, ErrorType, createErrorResponse } from '@/src/lib/error-handler';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET() {
  try {
    const { data: items, error } = await getSupabaseClient()
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

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    const appError = error instanceof Error
      ? error
      : ErrorHandler.createError('Failed to fetch bookings', ErrorType.INTERNAL, 500);
    ErrorHandler.logError(appError, { operation: 'fetch_admin_bookings' });
    return createErrorResponse(appError);
  }
}
