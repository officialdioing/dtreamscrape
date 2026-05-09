import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';
import { ErrorHandler, ErrorType, createErrorResponse } from '@/src/lib/error-handler';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('services')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw ErrorHandler.handleDatabaseError(error, {
        operation: 'fetch_services',
        table: 'services',
      });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const appError = error instanceof Error
      ? error
      : ErrorHandler.createError('Failed to fetch services', ErrorType.DATABASE, 500);
    ErrorHandler.logError(appError, { operation: 'fetch_services' });
    return createErrorResponse(appError);
  }
}
