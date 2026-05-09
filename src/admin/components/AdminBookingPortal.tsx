'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useLiveUpdates } from '@/src/lib/hooks/useLiveUpdates';

interface Booking {
  id: string;
  consultation_date: string;
  consultation_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

export function AdminBookingPortal() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  useLiveUpdates({
    enabled: true,
    onUpdate: (event) => {
      if (event.type === 'booking_update') {
        void fetchBookings();
      }
    },
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/bookings', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      const list = Array.isArray(data.items) ? data.items : [];
      setBookings(list);
      setStats({
        total: list.length,
        pending: list.filter((booking: Booking) => booking.status === 'pending').length,
        confirmed: list.filter((booking: Booking) => booking.status === 'confirmed').length,
        cancelled: list.filter((booking: Booking) => booking.status === 'cancelled').length,
        completed: list.filter((booking: Booking) => booking.status === 'completed').length,
      });

    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/bookings-availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      // Refresh bookings after update
      await fetchBookings();

    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`/api/admin/bookings-availability?booking_id=${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh bookings after cancellation
      await fetchBookings();

    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(String(dateString).split('T')[0]);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <div className="border-b border-border/70 px-6 py-6">
            <div className="flex items-center gap-3">
              <Spinner className="size-5 text-primary" />
              <div>
                <div className="text-lg font-semibold text-gray-900">Booking Management</div>
                <div className="text-sm text-gray-600">Loading bookings and availability settings…</div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-b border-border/70 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="border-b border-border/70 p-6 md:border-b-0 md:border-r last:border-r-0">
                <div className="h-8 w-16 rounded-full bg-gray-100 animate-pulse" />
                <div className="mt-3 h-4 w-24 rounded-full bg-gray-100/80 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="h-7 w-44 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 w-20 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-10 w-24 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-10 w-28 rounded-xl bg-gray-100 animate-pulse" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_10px_30px_rgba(64,21,63,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-56 rounded-full bg-gray-100 animate-pulse" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-4 w-full rounded-full bg-gray-100/80 animate-pulse" />
                        <div className="h-4 w-full rounded-full bg-gray-100/80 animate-pulse" />
                        <div className="h-4 w-full rounded-full bg-gray-100/80 animate-pulse" />
                        <div className="h-4 w-full rounded-full bg-gray-100/80 animate-pulse" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="h-9 w-24 rounded-xl bg-gray-100 animate-pulse" />
                      <div className="h-9 w-24 rounded-xl bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600 mt-1">Pending</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-600 mt-1">Confirmed</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-sm text-gray-600 mt-1">Completed</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-600 mt-1">Cancelled</div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchBookings}
          >
            Refresh
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-500">No bookings found</div>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.first_name} {booking.last_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Date:</span> {formatDate(booking.consultation_date)}
                    </div>
                    <div>
                      <span className="font-medium">Time:</span> {formatTime(booking.consultation_time)}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {booking.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {booking.phone}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {booking.status === 'cancelled' && (
                    <div className="text-sm text-gray-500">Cancelled</div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminBookingPortal;
