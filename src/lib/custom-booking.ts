// Custom Booking System - Legacy helpers kept compatible with the admin settings model.

import {
  DEFAULT_AVAILABILITY,
  generateAvailableSlots,
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from './availability-manager';

interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
}

interface DailyAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

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

// Generate all possible time slots using an interval.
// If no interval is provided, fall back to the admin default.
export function generateTimeSlots(intervalMinutes = DEFAULT_AVAILABILITY.slotIntervalMinutes): string[] {
  const slots: string[] = [];
  const interval = Math.max(1, intervalMinutes);

  for (let minutes = 0; minutes < 24 * 60; minutes += interval) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }

  return slots;
}

// Check if a date has any admin-defined availability.
export function isWorkingDay(date: Date, settings: AvailabilitySettings = DEFAULT_AVAILABILITY): boolean {
  return generateAvailableSlots(date, normalizeAvailabilitySettings(settings)).length > 0;
}

// Generate availability for a date range using admin settings.
export function generateAvailabilityForDateRange(
  startDate: Date,
  endDate: Date,
  settings: AvailabilitySettings = DEFAULT_AVAILABILITY
): Record<string, string[]> {
  const availability: Record<string, string[]> = {};
  const normalizedSettings = normalizeAvailabilitySettings(settings);

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    availability[dateStr] = generateAvailableSlots(new Date(dateStr), normalizedSettings);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
}

// Remove booked slots from availability
export function removeBookedSlots(
  availability: Record<string, string[]>,
  bookings: Booking[]
): Record<string, string[]> {
  const updatedAvailability = { ...availability };

  bookings.forEach(booking => {
    if (booking.status !== 'cancelled' && updatedAvailability[booking.consultation_date]) {
      updatedAvailability[booking.consultation_date] = updatedAvailability[booking.consultation_date].filter(
        time => time !== booking.consultation_time
      );
    }
  });

  return updatedAvailability;
}

// Check if a specific slot is available
export function isSlotAvailable(
  date: string,
  time: string,
  bookings: Booking[]
): boolean {
  const bookedSlots = bookings.filter(
    b => b.consultation_date === date && b.status !== 'cancelled'
  );

  return !bookedSlots.some(b => b.consultation_time === time);
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Get available slots for a specific date
export function getAvailableSlotsForDate(
  date: string,
  bookings: Booking[],
  settings: AvailabilitySettings = DEFAULT_AVAILABILITY
): string[] {
  const allSlots = generateAvailableSlots(new Date(date), normalizeAvailabilitySettings(settings));
  const bookedSlots = bookings.filter(
    b => b.consultation_date === date && b.status !== 'cancelled'
  );

  const bookedTimes = bookedSlots.map(b => b.consultation_time);
  return allSlots.filter(slot => !bookedTimes.includes(slot));
}
