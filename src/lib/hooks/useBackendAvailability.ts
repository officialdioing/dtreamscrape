'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type AvailabilityMap = Record<string, string[]>;

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns the Monday of the week containing `date`
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ...
  d.setDate(d.getDate() - day); // go back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useBackendAvailability() {
  const [available, setAvailable] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(false);
  const [currentDateTimes, setCurrentDateTimes] = useState<string[]>([]);
  // Track which week-start keys have already been fetched
  const fetchedWeeks = useRef<Set<string>>(new Set());
  // Track which individual dates we have data for
  const fetchedDates = useRef<Set<string>>(new Set());

  const fetchWeek = useCallback(async (weekStartDate: Date) => {
    const weekKey = localDateKey(weekStartDate);
    if (fetchedWeeks.current.has(weekKey)) return;
    fetchedWeeks.current.add(weekKey);

    const endDate = new Date(weekStartDate);
    endDate.setDate(endDate.getDate() + 6);

    const startDateStr = localDateKey(weekStartDate);
    const endDateStr = localDateKey(endDate);

    setLoading(true);
    try {
      // Fetch backend availability for the entire week
      const res = await fetch(
        `/api/bookings/availability?start_date=${startDateStr}&end_date=${endDateStr}`
      );

      if (!res.ok) {
        fetchedWeeks.current.delete(weekKey);
        return;
      }

      const data = await res.json();

      // Transform backend response: { available_slots: { "2026-05-05": [{time, available, date}, ...] } }
      const grouped: AvailabilityMap = {};
      const availableSlots = data.available_slots || {};

      for (const [date, slots] of Object.entries(availableSlots)) {
        if (Array.isArray(slots)) {
          grouped[date] = slots
            .filter((slot: any) => slot.available === "true" || slot.available === true)
            .map((slot: any) => slot.time);
        }
      }

      // Mark all days in this week as fetched (even those without availability)
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        fetchedDates.current.add(localDateKey(d));
      }

      setAvailable((prev) => ({ ...prev, ...grouped }));
    } catch {
      fetchedWeeks.current.delete(weekKey);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all weeks that overlap with a given month
  const fetchMonth = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const current = weekStart(firstDay);
    while (current <= lastDay) {
      fetchWeek(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  }, [fetchWeek]);

  // Pre-fetch current and next month on mount
  useEffect(() => {
    const now = new Date();
    fetchMonth(now.getFullYear(), now.getMonth());
    fetchMonth(now.getFullYear(), now.getMonth() + 1);
  }, [fetchMonth]);

  const onMonthChange = useCallback((date: Date) => {
    fetchMonth(date.getFullYear(), date.getMonth());
  }, [fetchMonth]);

  const isDateBooked = useCallback((date: Date): boolean => {
    const key = localDateKey(date);
    if (!fetchedDates.current.has(key)) return false; // not yet fetched → show as available
    // If fetched but no availability data exists, consider it unavailable
    if (!(key in available) || available[key].length === 0) return true;
    return false; // Has availability data
  }, [available]);

  const isSlotBooked = useCallback((date: Date, time: string): boolean => {
    const key = localDateKey(date);
    if (!(key in available)) return true;
    return !available[key].includes(time);
  }, [available]);

  const fetchSingleDate = useCallback(async (date: Date) => {
    const dateKey = localDateKey(date);

    // If we already have data for this date, use it
    if (dateKey in available) {
      setCurrentDateTimes(available[dateKey]);
      return available[dateKey];
    }

    // Otherwise, fetch this specific date's availability
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bookings/availability?date=${dateKey}`
      );

      if (!res.ok) {
        console.error('Failed to fetch availability for date:', dateKey);
        setCurrentDateTimes([]);
        return [];
      }

      const data = await res.json();

      // Transform the response: { allSlots: [{time, available, date}, ...] }
      const times = data.allSlots
        ?.filter((slot: any) => slot.available === true)
        .map((slot: any) => slot.time) || [];

      // Cache the result
      setAvailable((prev) => ({
        ...prev,
        [dateKey]: times
      }));

      // Update current date times
      setCurrentDateTimes(times);

      // Mark this date as fetched
      fetchedDates.current.add(dateKey);

      return times;
    } catch (error) {
      console.error('Error fetching availability for date:', dateKey, error);
      setCurrentDateTimes([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [available]);

  const getAvailableTimes = useCallback((date: Date): string[] => {
    const dateKey = localDateKey(date);

    // Trigger async fetch if we don't have data for this date
    if (!(dateKey in available)) {
      fetchSingleDate(date);
    }

    // Return current data (either from cache or empty while loading)
    return available[dateKey] ?? currentDateTimes;
  }, [available, currentDateTimes, fetchSingleDate]);

  // Remove a specific slot from local state after a 409 conflict
  const removeSlot = useCallback((date: Date, time: string) => {
    const key = localDateKey(date);
    setAvailable((prev) => {
      if (!prev[key]) return prev;
      const updated = prev[key].filter((t) => t !== time);
      return { ...prev, [key]: updated };
    });
  }, []);

  return {
    isDateBooked,
    isSlotBooked,
    getAvailableTimes,
    fetchSingleDate,
    currentDateTimes,
    onMonthChange,
    removeSlot,
    loading
  };
}
