import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { ErrorHandler, ErrorType, createErrorResponse } from '@/src/lib/error-handler';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('event_date', { ascending: false, nullsFirst: false });

    if (error) {
      throw ErrorHandler.handleDatabaseError(error, {
        operation: 'fetch_events',
        table: 'events',
      });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const appError = error instanceof Error
      ? error
      : ErrorHandler.createError('Failed to fetch events', ErrorType.DATABASE, 500);
    ErrorHandler.logError(appError, { operation: 'fetch_events' });
    return createErrorResponse(appError);
  }
}
