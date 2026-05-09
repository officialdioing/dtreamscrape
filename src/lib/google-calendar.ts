import { google } from 'googleapis';
import type { CalendarBooking, CalendarEvent } from '@/src/types';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export async function createCalendarEvent(booking: CalendarBooking): Promise<CalendarEvent | null> {
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    // Google Calendar is optional
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Format the consultation date and time
    const consultationDateTime = new Date(`${booking.consultation_date}T${booking.consultation_time}:00`);

    // Calculate end time (1 hour consultation)
    const endTime = new Date(consultationDateTime.getTime() + 60 * 60 * 1000);

    const event: CalendarEvent = {
      id: '', // Will be set by Google Calendar API
      summary: `Consultation: ${booking.first_name} ${booking.last_name}`,
      description: `
Consultation Details:
- Name: ${booking.first_name} ${booking.last_name}
- Email: ${booking.email}
- Phone: ${booking.phone}
${booking.event_date ? `- Event Date: ${new Date(booking.event_date).toLocaleDateString()}` : ''}
${booking.event_location ? `- Event Location: ${booking.event_location}` : ''}
${booking.event_types && booking.event_types.length ? `- Event Types: ${booking.event_types.join(', ')}` : ''}
${booking.budget ? `- Budget: ${booking.budget}` : ''}
${booking.guests ? `- Guests: ${booking.guests}` : ''}
${booking.how_did_you_hear ? `- How did they hear: ${booking.how_did_you_hear}` : ''}
${booking.additional_details ? `- Additional Details: ${booking.additional_details}` : ''}
      `.trim(),
      start: {
        dateTime: consultationDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'email', minutes: 60 }, // 1 hour before
        ],
      },
      attendees: [
        { email: booking.email },
        { email: process.env.NEXT_PUBLIC_CALENDAR_EMAIL || '' },
      ],
    };

    const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.NEXT_PUBLIC_CALENDAR_EMAIL;

    const response = await calendar.events.insert({
      calendarId: calendarId || 'primary',
      requestBody: event,
      sendUpdates: 'all', // Send invitations to attendees
    });

    return response.data as CalendarEvent;

  } catch (error) {
    throw error;
  }
}
