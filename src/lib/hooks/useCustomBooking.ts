'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveUpdates } from './useLiveUpdates';
import { normalizeAvailabilitySettings, type AvailabilitySettings } from '@/src/lib/availability-manager';
import { generateAvailableSlots } from '@/src/lib/availability-manager';

interface BookingSlot {
  date: string;
  time: string;
  available: boolean;
}

interface AvailabilityData {
  date: string;
  available: string[];
  booked: string[];
  all: string[];
}

interface CustomBookingHookResult {
  // State
  availability: Record<string, AvailabilityData>;
  settings: AvailabilitySettings | null;
  loading: boolean;
  error: string | null;

  // Functions
  fetchAvailability: (startDate: string, endDate: string) => Promise<void>;
  refetchAvailability: () => Promise<void>;
  isSlotAvailable: (date: string, time: string) => boolean;
  getAvailableSlots: (date: string) => string[];
  isDateBookable: (date: string) => boolean;
  isDateFullyBooked: (date: string) => boolean;
  getBookedSlots: (date: string) => string[];

  // Admin functions
  updateBookingStatus: (bookingId: string, status: string) => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
}

export function useCustomBooking(): CustomBookingHookResult {
  const [availability, setAvailability] = useState<Record<string, AvailabilityData>>({});
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the last fetched date range for refetching
  const [lastDateRange, setLastDateRange] = useState<{ start: string; end: string } | null>(null);

  // Fetch availability for a date range
  const fetchAvailability = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);

    try {
      // Add cache-busting timestamp
      const cacheBuster = Date.now();
      const response = await fetch(
        `/api/bookings/availability?start_date=${startDate}&end_date=${endDate}&_t=${cacheBuster}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch availability');
      }

      const data = await response.json();
      const normalizedSettings = normalizeAvailabilitySettings(data.settings);

      // Transform the response data
      const availabilityMap: Record<string, AvailabilityData> = {};
      Object.entries(data.available_slots || {}).forEach(([date, slots]: [string, any]) => {
        const allTimes = Array.isArray(slots)
          ? slots.map((slot: any) => slot.time).filter(Boolean)
          : [];
        const availableTimes = Array.isArray(slots)
          ? slots.filter((slot: any) => slot.available).map((slot: any) => slot.time)
          : [];
        availabilityMap[date] = {
          date,
          available: availableTimes,
          booked: allTimes.filter((time) => !availableTimes.includes(time)),
          all: allTimes,
        };
      });

      setAvailability(availabilityMap);
      setSettings(normalizedSettings);
      setLastDateRange({ start: startDate, end: endDate });

    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setError(err.message || 'Failed to fetch availability');
      // Set empty availability on error to prevent undefined errors
      setAvailability({});
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch availability (useful for refreshing after admin changes)
  const refetchAvailability = useCallback(async () => {
    if (lastDateRange) {
      await fetchAvailability(lastDateRange.start, lastDateRange.end);
    }
  }, [lastDateRange, fetchAvailability]);

  useLiveUpdates({
    enabled: true,
    onUpdate: (event) => {
      if (!lastDateRange) return;
      if (event.type === 'booking_update' || event.type === 'availability_update' || event.type === 'content_update') {
        void refetchAvailability();
      }
    },
  });

  // Check if a specific slot is available
  const isSlotAvailable = useCallback((date: string, time: string): boolean => {
    const dayAvailability = availability[date];
    if (!dayAvailability) return false; // Unknown dates are considered unavailable
    return dayAvailability.available.includes(time);
  }, [availability]);

  // Get all available slots for a date
  const getAvailableSlots = useCallback((date: string): string[] => {
    const dayAvailability = availability[date];
    if (!dayAvailability) return [];
    return dayAvailability.available;
  }, [availability]);

  // Get all visible slots for a date
  const getAllSlots = useCallback((date: string): string[] => {
    const dayAvailability = availability[date];
    if (!dayAvailability) return [];
    return dayAvailability.all;
  }, [availability]);

  // Determine whether a date is bookable using the loaded admin settings
  const isDateBookable = useCallback((date: string): boolean => {
    if (!settings) return false;
    return generateAvailableSlots(new Date(`${date}T00:00:00`), settings).length > 0;
  }, [settings]);

  // Check if a date is fully booked
  const isDateFullyBooked = useCallback((date: string): boolean => {
    const dayAvailability = availability[date];
    if (!dayAvailability) return true; // Unknown dates are treated as unavailable until fetched
    return dayAvailability.available.length === 0;
  }, [availability]);

  // Get booked slots for a date
  const getBookedSlots = useCallback((date: string): string[] => {
    const dayAvailability = availability[date];
    if (!dayAvailability) return [];
    return dayAvailability.booked;
  }, [availability]);

  // Admin: Update booking status
  const updateBookingStatus = useCallback(async (bookingId: string, status: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/bookings-availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      // Refresh availability after status update
      const dates = Object.keys(availability);
      if (dates.length > 0) {
        await fetchAvailability(dates[0], dates[dates.length - 1]);
      }

      return true;

    } catch (err: any) {
      console.error('Error updating booking status:', err);
      return false;
    }
  }, [availability, fetchAvailability]);

  // Admin: Cancel booking
  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/bookings-availability?booking_id=${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      // Refresh availability after cancellation
      const dates = Object.keys(availability);
      if (dates.length > 0) {
        await fetchAvailability(dates[0], dates[dates.length - 1]);
      }

      return true;

    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      return false;
    }
  }, [availability, fetchAvailability]);

  return {
    availability,
    settings,
    loading,
    error,
    fetchAvailability,
    refetchAvailability,
    isSlotAvailable,
    getAvailableSlots,
    getAllSlots,
    isDateBookable,
    isDateFullyBooked,
    getBookedSlots,
    updateBookingStatus,
    cancelBooking
  };
}
