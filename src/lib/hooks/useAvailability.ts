import { useState, useEffect } from 'react';

interface BookedDate {
  date: string;
  bookedTimes: string[];
}

interface AvailabilityData {
  bookedDates: BookedDate[];
  generatedAt: string;
}

export function useAvailability(startDate: Date, endDate: Date) {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];

        const response = await fetch(
          `/api/bookings/real-time-availability?start=${start}&end=${end}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch availability');
        }

        const data = await response.json();
        setAvailability(data);

      } catch (err) {
        console.error('Error fetching availability:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch availability');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [startDate, endDate]);

  // Check if a specific date/time is booked
  const isSlotBooked = (date: Date, time: string): boolean => {
    if (!availability) return false;

    const dateStr = date.toISOString().split('T')[0];
    const bookedDate = availability.bookedDates.find(d => d.date === dateStr);

    return bookedDate?.bookedTimes.includes(time) || false;
  };

  // Check if a date has any bookings
  const isDateBooked = (date: Date): boolean => {
    if (!availability) return false;

    const dateStr = date.toISOString().split('T')[0];
    const bookedDate = availability.bookedDates.find(d => d.date === dateStr);

    return bookedDate !== undefined;
  };

  // Get available times for a specific date
  const getAvailableTimes = (date: Date, allTimes: string[]): string[] => {
    if (!availability) return allTimes;

    const dateStr = date.toISOString().split('T')[0];
    const bookedDate = availability.bookedDates.find(d => d.date === dateStr);

    if (!bookedDate) return allTimes;

    return allTimes.filter(time => !bookedDate.bookedTimes.includes(time));
  };

  return {
    availability,
    isLoading,
    error,
    isSlotBooked,
    isDateBooked,
    getAvailableTimes,
  };
}
