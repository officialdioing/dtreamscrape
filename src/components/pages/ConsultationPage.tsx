'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload as UploadIcon, X, File, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { useCustomBooking } from '@/src/lib/hooks/useCustomBooking';
import { useFileUpload } from '@/src/lib/hooks/useFileUpload';
import { getWorkingHoursSummary } from '@/src/lib/availability-manager';

const DEFAULT_CONSULTATION_CONTENT = {
  'wedding-destination-social': {
    title: 'Wedding/Destination/Social Event Planning',
    subtitle: 'Dreamscape Curated Events',
    description: 'A brief overview before you schedule your consultation. Choose a date and time that fits your calendar, then continue to the inquiry form with your selected appointment details.'
  },
  'design-styling': {
    title: 'Event Design & Styling',
    subtitle: 'Dreamscape Curated Events',
    description: 'A consultation focused on visual storytelling, styling direction, tablescape decisions, ambiance, and the design details that shape how your event feels from first impression to final reveal.'
  },
  'corporate-brand': {
    title: 'Corporate & Brand Events',
    subtitle: 'Dreamscape Curated Events',
    description: 'Strategic planning and production for corporate events, brand activations, and professional experiences.'
  },
  'private-social': {
    title: 'Private & Social Events',
    subtitle: 'Dreamscape Curated Events',
    description: 'Planning support for private celebrations, milestones, and intimate social gatherings.'
  },
  'pick-my-brain': {
    title: 'Pick My Brain Session (1-Hour Virtual Consultation)',
    subtitle: 'Dreamscape Curated Events',
    description: 'For clients who need strategic event guidance, vendor advice, or professional clarity before moving forward. Ideal for a focused conversation around planning decisions and next steps.'
  }
};

const SERVICE_EVENT_TYPE_MAP = {
  'wedding-destination-social': ['wedding-destination-social'],
  'event-design-styling': ['design-styling'],
  'pick-my-brain': ['pick-my-brain'],
  'real-time-assessment': ['assessment']
} as const;

const DEFAULT_EVENT_TYPE_OPTIONS = [
  { id: 'wedding-destination-social', label: 'Wedding / Destination Planning' },
  { id: 'design-styling', label: 'Event Design & Styling' },
  { id: 'corporate-brand', label: 'Corporate & Brand Events' },
  { id: 'private-social', label: 'Private & Social Events' },
  { id: 'pick-my-brain', label: 'Pick My Brain Session' }
];

function formatLongDate(date?: Date) {
  if (!date) return 'Choose a day on the calendar';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTimeDisplay(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export function ConsultationPage({
  initialEventTypeOptions,
  initialConsultationContent,
}: {
  initialEventTypeOptions?: { id: string; label: string }[];
  initialConsultationContent?: typeof DEFAULT_CONSULTATION_CONTENT;
}) {
  const eventDatePickerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const selectedService = searchParams.get('service') as keyof typeof DEFAULT_CONSULTATION_CONTENT | null;

  const [eventTypeOptions, setEventTypeOptions] = useState(
    initialEventTypeOptions?.length ? initialEventTypeOptions : DEFAULT_EVENT_TYPE_OPTIONS
  );
  const [consultationContent, setConsultationContent] = useState(
    initialConsultationContent ?? DEFAULT_CONSULTATION_CONTENT
  );

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState('availability');
  const [isEventDatePickerOpen, setIsEventDatePickerOpen] = useState(false);

  const {
    fetchAvailability,
    refetchAvailability,
    isSlotAvailable,
    getAvailableSlots,
    getAllSlots,
    isDateBookable,
    getBookedSlots,
    settings: availabilitySettings,
    loading
  } = useCustomBooking();

  // Wrapper functions to match the expected interface
  const removeSlot = (date: Date, time: string) => {
    // Slots are automatically filtered out when they're booked
    // This function is kept for compatibility but doesn't need to do anything
    console.log('Slot already filtered from availability:', date, time);
  };

  const {
    uploads,
    successfulUploads,
    isUploading,
    isDragActive,
    getRootProps,
    getInputProps,
    removeUpload,
    clearUploads,
  } = useFileUpload({
    maxFiles: 5,
    onUploadComplete: () => {},
  });

  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    selectedService
      ? [...(SERVICE_EVENT_TYPE_MAP[selectedService as keyof typeof SERVICE_EVENT_TYPE_MAP] ?? [])]
      : []
  );

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    eventDate: undefined as Date | undefined,
    eventLocation: '',
    budget: '',
    guests: '',
    howDidYouHear: '',
    additionalDetails: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const hasInitial = (initialEventTypeOptions?.length ?? 0) > 0 || Boolean(initialConsultationContent);
    if (hasInitial) return;

    const fetchConsultationConfig = async () => {
      try {
        const eventRes = await fetch('/api/site-content?page=consultation&section=event_types', { cache: 'no-store' });
        if (eventRes.ok) {
          const eventJson = await eventRes.json();
          const events = eventJson.grouped?.consultation_event_types?.options?.value ?? [];
          if (events.length > 0) setEventTypeOptions(events);
        }

        const contentRes = await fetch('/api/site-content?page=consultation&section=consultation_types', { cache: 'no-store' });
        if (contentRes.ok) {
          const contentJson = await contentRes.json();
          const types = contentJson.grouped?.consultation_consultation_types?.types?.value ?? {};
          if (Object.keys(types).length > 0) {
            const transformed = Object.entries(types).reduce((acc, [key, value]) => {
              const str = typeof value === 'string' ? value : String(value);
              acc[key] = { title: str, subtitle: 'Dreamscape Curated Events', description: str };
              return acc;
            }, {} as Record<string, { title: string; subtitle: string; description: string }>);
            setConsultationContent(transformed as typeof DEFAULT_CONSULTATION_CONTENT);
          }
        }
      } catch (error) {
        console.error('Failed to load consultation configuration:', error);
      }
    };

    fetchConsultationConfig();
  }, [initialEventTypeOptions?.length, initialConsultationContent]);

  const consultationIntro =
    (selectedService && consultationContent[selectedService]) ||
    consultationContent['wedding-destination-social'];

  const lockedEventTypes = selectedService
    ? new Set(SERVICE_EVENT_TYPE_MAP[selectedService as keyof typeof SERVICE_EVENT_TYPE_MAP] ?? [])
    : null;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (eventDatePickerRef.current && !eventDatePickerRef.current.contains(event.target as Node)) {
        setIsEventDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (selectedService && SERVICE_EVENT_TYPE_MAP[selectedService as keyof typeof SERVICE_EVENT_TYPE_MAP]) {
      setSelectedEventTypes([...SERVICE_EVENT_TYPE_MAP[selectedService as keyof typeof SERVICE_EVENT_TYPE_MAP]]);
    }
  }, [selectedService]);

  useEffect(() => {
    if (loading) {
      setSelectedTime('');
    }
  }, [loading]);

  // Reset selected time when date changes
  useEffect(() => {
    setSelectedTime('');
  }, [date]);

  // Helper function to format dates consistently (avoiding timezone issues)
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Wrapper functions to match the expected interface
  const isDateBooked = (date: Date): boolean => {
    return !isDateBookable(formatDateKey(date));
  };
  const isAvailabilityPending = loading || !availabilitySettings;

  const isSlotBooked = (date: Date, time: string): boolean => {
    return !isSlotAvailable(formatDateKey(date), time);
  };

  const getAvailableTimes = (date: Date): string[] => {
    return getAvailableSlots(formatDateKey(date));
  };

  const getAllTimes = (date: Date): string[] => {
    return getAllSlots(formatDateKey(date));
  };

  const getBookedTimes = (date: Date): string[] => {
    return getBookedSlots(formatDateKey(date));
  };

  const onMonthChange = (date: Date) => {
    const startDate = formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
    const endDate = formatDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    fetchAvailability(startDate, endDate);
  };

  // Fetch initial month's availability on component mount
  useEffect(() => {
    const today = new Date();
    const startDate = formatDateKey(new Date(today.getFullYear(), today.getMonth(), 1));
    const endDate = formatDateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    fetchAvailability(startDate, endDate);
  }, [fetchAvailability]);

  const toggleEventType = (value: string, checked: boolean | string) => {
    setSelectedEventTypes((current) => {
      if (checked) return current.includes(value) ? current : [...current, value];
      return current.filter((item) => item !== value);
    });
  };

  const isEventTypeDisabled = (value: string) => {
    if (!lockedEventTypes) return false;
    return !lockedEventTypes.has(value as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setSubmitStatus('error');
      setSubmitMessage('Please fill in all required fields.');
      return;
    }

    if (!date || !selectedTime) {
      setSubmitStatus('error');
      setSubmitMessage('Please select a consultation date and time.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          event_date: formData.eventDate ? formatDateKey(formData.eventDate) : undefined,
          event_location: formData.eventLocation || undefined,
          event_types: selectedEventTypes,
          budget: formData.budget || undefined,
          guests: formData.guests || undefined,
          how_did_you_hear: formData.howDidYouHear || undefined,
          additional_details: formData.additionalDetails || undefined,
          consultation_date: formatDateKey(date),
          consultation_time: selectedTime,
          file_urls: successfulUploads.map(u => u.url),
          file_names: successfulUploads.map(u => u.fileName),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create booking');

      setSubmitStatus('success');
      setSubmitMessage('Your consultation has been booked successfully! You will receive a confirmation email shortly.');

      setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        eventDate: undefined, eventLocation: '', budget: '',
        guests: '', howDidYouHear: '', additionalDetails: ''
      });
      clearUploads();
      await refetchAvailability();

    } catch (error) {
      console.error('Booking error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create booking. Please try again.';
      const isConflict = msg.toLowerCase().includes('no longer available') || msg.includes('409');
      if (isConflict && date && selectedTime) {
        // Immediately drop the taken slot from local state so it disappears from the UI
        removeSlot(date, selectedTime);
        setSelectedTime('');
        setSubmitMessage('That time slot was just booked. Please pick another available time.');
      } else {
        setSubmitMessage(msg);
      }
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTimesForDate = date ? getAvailableTimes(date) : [];
  const bookedTimesForDate = date ? getBookedTimes(date) : [];
  const allTimes = date ? getAllTimes(date) : [];
  const isCheckingAvailability = loading && Boolean(date);
  const workingHoursSummary = availabilitySettings
    ? getWorkingHoursSummary(availabilitySettings)
    : 'Availability set in admin';

  return (
    <div className="w-full bg-brand-light min-h-screen pt-40 md:pt-44 pb-24">
      <div className="container mx-auto px-6 max-w-5xl">
        <section className="mb-12">
          <Link
            href="/consultation-editorial"
            className="mb-8 inline-flex min-h-9 items-center gap-2 rounded-full border border-brand-purple/12 bg-white px-5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:border-brand-pink hover:text-brand-pink">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <h1 className="text-4xl md:text-5xl lg:text-6xl text-brand-dark font-normal leading-[0.96] mb-4">
            Consultation Booking
          </h1>
          <p className="text-xl md:text-2xl text-brand-purple mb-3">
            {consultationIntro.title}
          </p>
          <h2 className="text-lg md:text-xl text-brand-purple mb-6 tracking-wide">
            {consultationIntro.subtitle}
          </h2>
          <p className="max-w-2xl text-base md:text-lg text-brand-gray leading-relaxed mb-8">
            {consultationIntro.description}
          </p>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-4xl flex gap-10 bg-transparent h-auto p-0 mb-12">
            <TabsTrigger
              value="availability"
              className="flex-1 rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none">
              Availability
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="flex-1 rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none">
              Form
            </TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
              <div className="flex justify-center md:justify-end">
                <div className="w-full max-w-sm">
                  <Calendar
                    selected={date}
                    onSelect={setDate}
                    onMonthChange={onMonthChange}
                    getDayStatus={(calendarDate) =>
                      isAvailabilityPending || !isDateBookable(formatDateKey(calendarDate)) ? 'booked' : 'available'
                    }
                    className="w-full max-w-sm bg-transparent p-0"
                  />

                  <div className="mt-5 flex items-center gap-5 text-[0.68rem] uppercase tracking-[0.16em] text-brand-gray">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-pink" />
                      Available
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-gray" />
                      Booked
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="text-2xl text-brand-dark mb-1">
                  {date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : 'Select a Date'}
                </h3>
                <p className="text-brand-gray mb-6">{formatLongDate(date)}</p>

                <div className="mb-6 max-w-[320px] border-b border-brand-purple/10 pb-5">
                  <p className="text-xs tracking-[0.18em] uppercase text-brand-pink mb-3">
                    Selected Appointment
                  </p>
                  <p className="text-lg font-serif text-brand-dark">
                    {date && selectedTime
                      ? `${formatLongDate(date)} at ${formatTimeDisplay(selectedTime)}`
                      : 'Select a date and time'}
                  </p>
                  {date && (
                    <p className={`mt-2 text-sm ${isDateBooked(date) ? 'text-brand-gray' : 'text-brand-pink'}`}>
                      {isDateBooked(date)
                        ? 'This day is fully booked.'
                        : loading
                        ? 'Checking availability…'
                        : 'This day is available for consultation.'}
                    </p>
                  )}
                </div>

                <div className="max-w-[420px] mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs tracking-[0.18em] uppercase text-brand-pink">
                      Available Times
                    </p>
                  </div>
                  {loading && !date ? (
                    <div className="rounded-[1.5rem] border border-brand-purple/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(33,27,37,0.06)]">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-3 w-36 rounded-full bg-brand-purple/10 animate-pulse" />
                          <div className="h-3 w-48 rounded-full bg-brand-purple/5 animate-pulse" />
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-pink animate-pulse" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-11 rounded-lg border border-brand-purple/10 bg-brand-purple/5 animate-pulse"
                          />
                        ))}
                      </div>

                      <p className="mt-4 text-sm text-brand-gray">
                        We’re checking your admin working hours and booked slots…
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-brand-gray">
                      {isCheckingAvailability
                        ? 'Checking availability…'
                        : date && availableTimesForDate.length > 0
                        ? `${availableTimesForDate.length} slot${availableTimesForDate.length === 1 ? '' : 's'} available`
                        : workingHoursSummary}
                    </p>
                  )}
                </div>

                <div className="grid max-w-[420px] grid-cols-2 gap-3 sm:grid-cols-4">
                  {date
                    ? allTimes.map((time) => {
                        const isSelected = selectedTime === time;
                        const isBooked = bookedTimesForDate.includes(time) || !isSlotAvailable(formatDateKey(date), time);
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => !loading && !isBooked && setSelectedTime(time)}
                            disabled={loading || isBooked}
                            className={`h-11 rounded-lg border text-sm transition-colors ${
                              loading || isBooked
                                ? 'border-brand-purple/10 bg-[#f1edea] text-brand-gray/45 cursor-not-allowed'
                                : isSelected
                                ? 'border-brand-purple bg-brand-purple text-white'
                                : 'border-brand-purple/10 bg-[#f6f4f2] text-brand-dark hover:border-brand-pink hover:text-brand-pink'
                            }`}>
                            {formatTimeDisplay(time)}
                          </button>
                        );
                      })
                    : null}
                </div>

                <Button
                  className="mt-8 w-full max-w-[320px] bg-brand-purple hover:bg-brand-pink text-white h-12 rounded-full font-medium tracking-[0.14em] uppercase"
                  disabled={!date || !selectedTime || isDateBooked(date)}
                  onClick={() => setActiveTab('form')}>
                  Submit and Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="form" className="mt-0">
            <div className="border-b border-brand-pink/15 pb-4 mb-8 text-sm text-brand-gray">
              {date && selectedTime && !isDateBooked(date)
                ? `Your consultation is set for ${formatLongDate(date)} at ${formatTimeDisplay(selectedTime)}.`
                : 'Select an available day and time for your appointment to complete this form.'}
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {submitStatus !== 'idle' && (
                <Alert variant={submitStatus === 'success' ? 'default' : 'destructive'}>
                  {submitStatus === 'success' ? <CheckCircle2Icon /> : <InfoIcon />}
                  <AlertTitle>
                    {submitStatus === 'success' ? 'Booking successful' : 'Booking issue'}
                  </AlertTitle>
                  <AlertDescription>{submitMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    First Name:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Please provide your first name"
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Last Name:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Please provide your last name"
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Phone Number:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Your phone number"
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Email Address:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Event Date:<span className="text-red-500">*</span>
                  </Label>
                  <div ref={eventDatePickerRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEventDatePickerOpen((open) => !open)}
                      className="flex h-11 w-full items-center rounded-full border border-brand-purple/15 bg-white px-4 text-left text-sm text-brand-dark transition-colors hover:border-brand-pink"
                      disabled={isSubmitting}
                    >
                      {formData.eventDate ? formatLongDate(formData.eventDate) : 'Select date'}
                    </button>

                    {isEventDatePickerOpen && (
                      <div className="absolute left-0 top-full z-30 mt-2 rounded-[1.25rem] border border-brand-purple/12 bg-white p-3 shadow-[0_22px_60px_rgba(33,27,37,0.12)]">
                        <Calendar
                          selected={formData.eventDate}
                          onSelect={(selectedDate) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const selectedKey = formatDateKey(selectedDate);
                            if (selectedDate < today || isAvailabilityPending || !isDateBookable(selectedKey)) return;
                            setFormData({...formData, eventDate: selectedDate});
                            setIsEventDatePickerOpen(false);
                          }}
                          getDayStatus={(calendarDate) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dateKey = formatDateKey(calendarDate);
                            return calendarDate < today || isAvailabilityPending || !isDateBookable(dateKey) ? 'booked' : 'available';
                          }}
                          className="w-full bg-transparent p-0"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Event Location (If Known)
                  </Label>
                  <Input
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.eventLocation}
                    onChange={(e) => setFormData({...formData, eventLocation: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Budget Range<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="$50,000"
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-gray font-normal text-sm">
                    Estimated Number of Guests:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="100"
                    className="border-brand-purple/15 bg-white rounded-full h-11"
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: e.target.value})}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-brand-gray font-normal text-sm">
                  Event Type: <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-6">
                  {eventTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedEventTypes.includes(option.id)}
                        onCheckedChange={(checked) => toggleEventType(option.id, checked)}
                        disabled={isEventTypeDisabled(option.id)}
                        className="border-brand-purple/20 rounded-sm" />
                      <Label
                        htmlFor={option.id}
                        className={`font-normal text-sm ${isEventTypeDisabled(option.id) ? 'cursor-not-allowed text-brand-gray/45' : 'cursor-pointer text-brand-gray'}`}>
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-brand-gray font-normal text-sm">
                  How did you hear about us?
                </Label>
                <Input
                  placeholder="Instagram, referral, etc."
                  className="border-brand-purple/15 bg-white rounded-full h-11"
                  value={formData.howDidYouHear}
                  onChange={(e) => setFormData({...formData, howDidYouHear: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-brand-gray font-normal text-sm">
                  Additional Details (Optional)
                </Label>
                <Textarea
                  placeholder="Tell us more about your event..."
                  className="border-brand-purple/15 bg-white rounded-[1.5rem] min-h-[120px] resize-none"
                  value={formData.additionalDetails}
                  onChange={(e) => setFormData({...formData, additionalDetails: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col items-center justify-center pt-4 pb-8">
                <div
                  {...getRootProps()}
                  className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-brand-pink bg-brand-pink/5'
                      : 'border-brand-purple/20 hover:border-brand-pink/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadIcon className="mx-auto h-12 w-12 text-brand-gray mb-4" />
                  <p className="text-sm text-brand-gray mb-2">
                    <span className="font-semibold text-brand-purple">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-brand-gray/60">
                    PNG, JPG, GIF, PDF, DOC, DOCX, XLS, XLSX (max 10MB each)
                  </p>
                  <p className="text-xs text-brand-gray/50 mt-1">
                    Up to {successfulUploads.length} files allowed
                  </p>
                </div>

                {uploads.length > 0 && (
                  <div className="w-full max-w-xl mt-4 space-y-2">
                    <p className="text-sm font-medium text-brand-gray">Uploaded Files:</p>
                    {uploads.map((upload, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-brand-purple/10"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <File className="h-5 w-5 text-brand-purple flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-dark truncate">{upload.file.name}</p>
                            <p className="text-xs text-brand-gray">{(upload.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {upload.status === 'success' && upload.url && (
                            <a href={upload.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-pink hover:underline">View</a>
                          )}
                          {upload.status === 'error' && <span className="text-xs text-red-500">{upload.error}</span>}
                          {upload.status === 'uploading' && <span className="text-xs text-brand-gray">Uploading...</span>}
                          <button
                            type="button"
                            onClick={() => removeUpload(index)}
                            className="p-1 hover:bg-brand-gray/100 rounded-full"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4 text-brand-gray hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-brand-purple/10">
                <Button
                  type="submit"
                  className="bg-brand-purple hover:bg-brand-pink text-white rounded-full px-8 h-11 font-medium tracking-[0.14em] uppercase"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit and Finish'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ConsultationPage;
