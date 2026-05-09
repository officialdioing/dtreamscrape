import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase-admin';

export async function GET() {
  try {
    console.log('Testing bookings table...');
    const client = supabaseAdmin();
    
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Bookings error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      data: data
    });
  } catch (err) {
    console.error('Connection error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error',
      type: err instanceof Error ? err.constructor.name : typeof err
    }, { status: 500 });
  }
}
