import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishUpdate } from '@/src/lib/update-bus';

// Admin API - Manage booking availability and configurations

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET - Fetch availability statistics and bookings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    // Fetch all bookings within date range
    const { data: bookings, error } = await getSupabaseClient()
      .from('bookings')
      .select('*')
      .gte('consultation_date', start)
      .lte('consultation_date', end)
      .order('consultation_date', { ascending: true })
      .order('consultation_time', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: bookings?.length || 0,
      pending: bookings?.filter(b => b.status === 'pending').length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      completed: bookings?.filter(b => b.status === 'completed').length || 0,
    };

    // Group bookings by date
    const bookingsByDate: Record<string, any[]> = {};
    bookings?.forEach(booking => {
      if (!bookingsByDate[booking.consultation_date]) {
        bookingsByDate[booking.consultation_date] = [];
      }
      bookingsByDate[booking.consultation_date].push(booking);
    });

    return NextResponse.json({
      start_date: start,
      end_date: end,
      stats,
      bookings: bookings || [],
      bookings_by_date: bookingsByDate,
    });

  } catch (error: any) {
    console.error('Error fetching admin availability:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, status } = body;

    if (!booking_id || !status) {
      return NextResponse.json(
        { error: 'booking_id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update booking status
    const { data, error } = await getSupabaseClient()
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', booking_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    publishUpdate({
      version: Date.now(),
      type: 'booking_update',
      action: 'update',
      resource: 'bookings',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      booking: data,
      message: `Booking status updated to ${status}`
    });

  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete a booking
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'booking_id is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to cancelled
    const { data, error } = await getSupabaseClient()
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling booking:', error);
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    publishUpdate({
      version: Date.now(),
      type: 'booking_update',
      action: 'delete',
      resource: 'bookings',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      booking: data,
      message: 'Booking cancelled successfully'
    });

  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
