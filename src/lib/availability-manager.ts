// Availability Management System
// Allows business owners to set custom availability from Supabase

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklyAvailability {
  sunday: DayAvailability;
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
}

export interface DateOverride {
  date: string; // YYYY-MM-DD
  available: boolean;
  notes?: string;
}

export interface AvailabilitySettings {
  weekly: WeeklyAvailability;
  overrides: DateOverride[];
  slotIntervalMinutes: number; // minutes between available time slots
  bufferTime: number; // minutes between bookings
  minBookingNotice: number; // hours in advance
  maxBookingAdvance: number; // days in advance
}

// Default availability - completely unrestricted, pulls from database
export const DEFAULT_AVAILABILITY: AvailabilitySettings = {
  weekly: {
    sunday: { enabled: true, slots: [] },
    monday: { enabled: true, slots: [] },
    tuesday: { enabled: true, slots: [] },
    wednesday: { enabled: true, slots: [] },
    thursday: { enabled: true, slots: [] },
    friday: { enabled: true, slots: [] },
    saturday: { enabled: true, slots: [] },
  },
  overrides: [],
  slotIntervalMinutes: 30, // 30-minute slots by default
  bufferTime: 0, // No buffer by default
  minBookingNotice: 0, // No restriction
  maxBookingAdvance: 365, // 1 year ahead
};

export function normalizeAvailabilitySettings(
  settings?: Partial<AvailabilitySettings> | null
): AvailabilitySettings {
  return {
    ...DEFAULT_AVAILABILITY,
    ...settings,
    weekly: {
      ...DEFAULT_AVAILABILITY.weekly,
      ...(settings?.weekly || {}),
    },
    overrides: settings?.overrides || [],
    slotIntervalMinutes: settings?.slotIntervalMinutes || DEFAULT_AVAILABILITY.slotIntervalMinutes,
    bufferTime: settings?.bufferTime ?? DEFAULT_AVAILABILITY.bufferTime,
    minBookingNotice: settings?.minBookingNotice ?? DEFAULT_AVAILABILITY.minBookingNotice,
    maxBookingAdvance: settings?.maxBookingAdvance ?? DEFAULT_AVAILABILITY.maxBookingAdvance,
  };
}

// Generate time slots from availability settings - completely unrestricted
export function generateAvailableSlots(
  date: Date,
  settings: AvailabilitySettings
): string[] {
  const normalizedSettings = normalizeAvailabilitySettings(settings);
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayName = dayNames[dayOfWeek];
  const dateStr = date.toISOString().split('T')[0];

  // Check for date overrides
  const override = normalizedSettings.overrides.find(o => o.date === dateStr);
  if (override && !override.available) {
    return []; // Date is explicitly blocked
  }

  const dayAvailability = normalizedSettings.weekly[dayName];

  // If the day is disabled, it should never return slots even if old ranges remain saved.
  if (!dayAvailability.enabled) {
    return [];
  }

  // If day is enabled but has no specific time slots, treat it as unavailable.
  if (dayAvailability.enabled && dayAvailability.slots.length === 0) {
    return [];
  }

  // Generate slots from configured time ranges
  const allSlots: string[] = [];
  const slotInterval = Math.max(1, normalizedSettings.slotIntervalMinutes || DEFAULT_AVAILABILITY.slotIntervalMinutes);

  dayAvailability.slots.forEach(slot => {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + slotInterval <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      allSlots.push(`${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
      currentMinutes += slotInterval + normalizedSettings.bufferTime;
    }
  });

  return allSlots;
}

// Check if a date is bookable
export function isDateBookable(
  date: Date,
  settings: AvailabilitySettings
): boolean {
  const normalizedSettings = normalizeAvailabilitySettings(settings);
  const now = new Date();
  const minBookingDate = new Date(now.getTime() + normalizedSettings.minBookingNotice * 60 * 60 * 1000);
  const maxBookingDate = new Date(now.getTime() + normalizedSettings.maxBookingAdvance * 24 * 60 * 60 * 1000);

  // Check if date is within booking window
  if (date < minBookingDate || date > maxBookingDate) {
    return false;
  }

  // Check if date has any available slots
  const slots = generateAvailableSlots(date, normalizedSettings);
  return slots.length > 0;
}

// Get available dates for a date range
export function getAvailableDates(
  startDate: Date,
  endDate: Date,
  settings: AvailabilitySettings
): string[] {
  const normalizedSettings = normalizeAvailabilitySettings(settings);
  const availableDates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isDateBookable(new Date(currentDate), normalizedSettings)) {
      availableDates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableDates;
}

// Format time for display
export function formatTimeRange(slot: TimeSlot): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
}

function formatDayName(dayIndex: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[dayIndex] || '';
}

function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function compressDayRanges(days: number[]): string[] {
  if (days.length === 0) return [];
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push(start === prev ? formatDayName(start) : `${formatDayName(start)} to ${formatDayName(prev)}`);
    start = current;
    prev = current;
  }

  ranges.push(start === prev ? formatDayName(start) : `${formatDayName(start)} to ${formatDayName(prev)}`);
  return ranges;
}

export function getWorkingHoursSummary(settings: AvailabilitySettings): string {
  const normalizedSettings = normalizeAvailabilitySettings(settings);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

  const groups = new Map<string, number[]>();

  dayNames.forEach((dayName, index) => {
    const dayAvailability = normalizedSettings.weekly[dayName];
    if (!dayAvailability.enabled) return;

    if (dayAvailability.slots.length === 0) return;

    const signature = dayAvailability.slots.map((slot) => `${slot.start}-${slot.end}`).join('|');

    if (!groups.has(signature)) {
      groups.set(signature, []);
    }
    groups.get(signature)?.push(index);
  });

  if (groups.size === 0) {
    return 'Availability set in admin';
  }

  const summaries = Array.from(groups.entries()).map(([signature, dayIndexes]) => {
    const dayLabel = compressDayRanges(dayIndexes).join(', ');

    const slots = signature.split('|').filter(Boolean).map((pair) => {
      const [start, end] = pair.split('-');
      return { start, end };
    });

    if (slots.length === 0) {
      return '';
    }

    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    return `${dayLabel}, ${formatTimeLabel(firstSlot.start)} to ${formatTimeLabel(lastSlot.end)}`;
  });

  return summaries.filter(Boolean).join('; ');
}

// Validate time slot
export function validateTimeSlot(slot: TimeSlot): boolean {
  const [startHour, startMin] = slot.start.split(':').map(Number);
  const [endHour, endMin] = slot.end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes > startMinutes && startMinutes >= 0 && endMinutes <= 1440; // 24 hours
}

// Check for overlapping slots
export function hasOverlappingSlots(slots: TimeSlot[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slot1 = slots[i];
      const slot2 = slots[j];

      const [start1, end1] = slot1.start.split(':').map(Number);
      const [start2, end2] = slot2.start.split(':').map(Number);

      const start1Min = start1 * 60 + parseInt(slot1.start.split(':')[1]);
      const end1Min = end1 * 60 + parseInt(slot1.end.split(':')[1]);
      const start2Min = start2 * 60 + parseInt(slot2.start.split(':')[1]);
      const end2Min = end2 * 60 + parseInt(slot2.end.split(':')[1]);

      // Check for overlap
      if (!(end1Min <= start2Min || start1Min >= end2Min)) {
        return true;
      }
    }
  }
  return false;
}
