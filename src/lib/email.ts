import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dreamscape-events.com';
const BUSINESS_EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@dreamscapeevent.com';

// Generate Google Calendar link
function generateGoogleCalendarLink(booking: BookingDetails): string {
  const startDate = new Date(`${booking.consultation_date}T${booking.consultation_time}:00`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const title = encodeURIComponent(`Dreamscape Consultation - ${booking.first_name} ${booking.last_name}`);
  const details = encodeURIComponent(
    `Consultation with ${booking.first_name} ${booking.last_name}\n` +
    `Email: ${booking.email}\n` +
    `Phone: ${booking.phone || 'Not provided'}\n\n` +
    (booking.event_date ? `Event Date: ${booking.event_date}\n` : '') +
    (booking.event_location ? `Location: ${booking.event_location}\n` : '') +
    (booking.event_types?.length ? `Event Type: ${booking.event_types.join(', ')}\n` : '') +
    (booking.additional_details ? `Additional Details:\n${booking.additional_details}` : '')
  );
  const location = encodeURIComponent(booking.event_location || 'Online Consultation');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}&location=${location}`;
}

// Generate .ics calendar invite content
function generateICSContent(booking: BookingDetails, forCustomer: boolean = false): string {
  const startDate = new Date(`${booking.consultation_date}T${booking.consultation_time}:00`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const organizerEmail = forCustomer ? BUSINESS_EMAIL : booking.email;
  const attendeeEmail = forCustomer ? booking.email : BUSINESS_EMAIL;
  const title = forCustomer
    ? `Dreamscape Consultation`
    : `Consultation - ${booking.first_name} ${booking.last_name}`;

  const description =
    `Dreamscape Curated Events - Consultation\n\n` +
    `Client: ${booking.first_name} ${booking.last_name}\n` +
    `Email: ${booking.email}\n` +
    `Phone: ${booking.phone || 'Not provided'}\n\n` +
    (booking.event_date ? `Event Date: ${booking.event_date}\n` : '') +
    (booking.event_location ? `Event Location: ${booking.event_location}\n` : '') +
    (booking.event_types?.length ? `Event Type: ${booking.event_types.join(', ')}\n` : '') +
    (booking.guests ? `Guests: ${booking.guests}\n` : '') +
    (booking.budget ? `Budget: ${booking.budget}\n` : '') +
    (booking.how_did_you_hear ? `How did they hear: ${booking.how_did_you_hear}\n` : '') +
    (booking.additional_details ? `Additional Details:\n${booking.additional_details}` : '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dreamscape Curated Events//Consultation Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `UID:${Date.now()}@dreamscapeevents.com`,
    `ORGANIZER;CN=Dreamscape Events:MAILTO:${organizerEmail}`,
    `ATTENDEE;CN=${forCustomer ? booking.first_name : 'Business'};RSVP=TRUE:MAILTO:${attendeeEmail}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${booking.event_location || 'Online Consultation'}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Consultation in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

interface BookingDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  consultation_date: string;
  consultation_time: string;
  event_date?: string;
  event_location?: string;
  event_types?: string[];
  budget?: string;
  guests?: string;
  how_did_you_hear?: string;
  additional_details?: string;
}

// Send confirmation email to customer
export async function sendCustomerConfirmationEmail(booking: BookingDetails) {
  try {
    const googleCalendarLink = generateGoogleCalendarLink(booking);
    const icsContent = generateICSContent(booking, true);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      subject: 'Consultation Booking Confirmed - Dreamscape Curated Events',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Consultation Booking Confirmed</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; width: 150px; color: #667eea; }
              .detail-value { flex: 1; }
              .calendar-buttons { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .calendar-buttons a { display: inline-block; padding: 12px 24px; margin: 5px; border-radius: 5px; text-decoration: none; font-weight: bold; }
              .google-calendar { background: #4285f4; color: white; }
              .google-calendar:hover { background: #357ae8; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              h1 { margin: 0; font-size: 28px; }
              h2 { color: #667eea; margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Booking Confirmed!</h1>
                <p>Thank you for choosing Dreamscape Curated Events</p>
              </div>
              <div class="content">
                <p>Dear ${booking.first_name} ${booking.last_name},</p>
                <p>Your consultation booking has been confirmed! We're excited to discuss your upcoming event and help make it truly special.</p>

                <div class="calendar-buttons">
                  <h2 style="margin-bottom: 15px;">📅 Add to Your Calendar</h2>
                  <a href="${googleCalendarLink}" class="google-calendar" target="_blank">
                    📆 Add to Google Calendar
                  </a>
                  <p style="font-size: 12px; margin-top: 10px; color: #666;">
                    Click the button above to add this consultation to your calendar
                  </p>
                </div>

                <div class="details">
                  <h2>📅 Consultation Details</h2>
                  <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${booking.consultation_date}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${booking.consultation_time}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${booking.email}</span>
                  </div>
                  ${booking.phone ? `
                  <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${booking.phone}</span>
                  </div>
                  ` : ''}

                  ${booking.event_date ? `
                  <h2 style="margin-top: 20px;">🎉 Event Information</h2>
                  <div class="detail-row">
                    <span class="detail-label">Event Date:</span>
                    <span class="detail-value">${booking.event_date}</span>
                  </div>
                  ` : ''}

                  ${booking.event_location ? `
                  <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${booking.event_location}</span>
                  </div>
                  ` : ''}

                  ${booking.event_types && booking.event_types.length > 0 ? `
                  <div class="detail-row">
                    <span class="detail-label">Event Type:</span>
                    <span class="detail-value">${booking.event_types.join(', ')}</span>
                  </div>
                  ` : ''}

                  ${booking.guests ? `
                  <div class="detail-row">
                    <span class="detail-label">Guests:</span>
                    <span class="detail-value">${booking.guests}</span>
                  </div>
                  ` : ''}

                  ${booking.budget ? `
                  <div class="detail-row">
                    <span class="detail-label">Budget:</span>
                    <span class="detail-value">${booking.budget}</span>
                  </div>
                  ` : ''}

                  ${booking.additional_details ? `
                  <h2 style="margin-top: 20px;">📝 Additional Details</h2>
                  <div class="detail-row">
                    <span class="detail-value" style="white-space: pre-wrap;">${booking.additional_details}</span>
                  </div>
                  ` : ''}
                </div>

                <h2>What's Next?</h2>
                <ul>
                  <li>📅 Add the consultation to your calendar using the button above</li>
                  <li>📧 Check your email for any updates or reminders</li>
                  <li>📱 We'll contact you at ${booking.phone || booking.email} if needed</li>
                  <li>💡 Feel free to prepare any questions or ideas you'd like to discuss</li>
                </ul>

                <p>If you need to reschedule or have any questions, please reply to this email or contact us at:</p>
                <p>
                  📧 Email: ${BUSINESS_EMAIL}<br>
                  📱 Phone: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE || 'Contact us'}
                </p>
              </div>
              <div class="footer">
                <p>© 2026 Dreamscape Curated Events. All rights reserved.</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: 'consultation-invite.ics',
          content: icsContent,
        },
      ],
    });

    if (error) {
      console.error('Failed to send customer email:', error);
      return { success: false, error };
    }

    console.log('✅ Customer confirmation email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error };
  }
}

// Send notification email to business
export async function sendBusinessNotificationEmail(booking: BookingDetails) {
  try {
    const googleCalendarLink = generateGoogleCalendarLink(booking);
    const icsContent = generateICSContent(booking, false);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: BUSINESS_EMAIL,
      subject: `🎉 New Consultation Booking: ${booking.first_name} ${booking.last_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Consultation Booking</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; width: 150px; color: #667eea; }
              .detail-value { flex: 1; }
              .urgent { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              .calendar-buttons { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .calendar-buttons a { display: inline-block; padding: 12px 24px; margin: 5px; border-radius: 5px; text-decoration: none; font-weight: bold; }
              .google-calendar { background: #4285f4; color: white; }
              .google-calendar:hover { background: #357ae8; }
              .email-button { background: #667eea; color: white; }
              .email-button:hover { background: #5568d3; }
              h1 { margin: 0; font-size: 28px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 New Consultation Booking!</h1>
                <p>A client has booked a consultation</p>
              </div>
              <div class="content">
                <div class="calendar-buttons">
                  <h2 style="margin-bottom: 15px;">📅 Add to Your Calendar</h2>
                  <a href="${googleCalendarLink}" class="google-calendar" target="_blank">
                    📆 Add to Google Calendar
                  </a>
                  <p style="font-size: 12px; margin-top: 10px; color: #666;">
                    One-click calendar addition with all client details
                  </p>
                </div>

                <div class="urgent">
                  <strong>📅 Consultation Date:</strong> ${booking.consultation_date} at ${booking.consultation_time}<br>
                  <strong>⏰ Time until consultation:</strong> Please mark this in your calendar
                </div>

                <div class="details">
                  <h2>👤 Client Information</h2>
                  <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${booking.first_name} ${booking.last_name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${booking.email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${booking.phone || 'Not provided'}</span>
                  </div>

                  <h2>📋 Event Details</h2>
                  ${booking.event_date ? `
                  <div class="detail-row">
                    <span class="detail-label">Event Date:</span>
                    <span class="detail-value">${booking.event_date}</span>
                  </div>
                  ` : '<p><em>Event date not specified yet</em></p>'}

                  ${booking.event_location ? `
                  <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${booking.event_location}</span>
                  </div>
                  ` : ''}

                  ${booking.event_types && booking.event_types.length > 0 ? `
                  <div class="detail-row">
                    <span class="detail-label">Event Type:</span>
                    <span class="detail-value">${booking.event_types.join(', ')}</span>
                  </div>
                  ` : ''}

                  ${booking.guests ? `
                  <div class="detail-row">
                    <span class="detail-label">Guest Count:</span>
                    <span class="detail-value">${booking.guests}</span>
                  </div>
                  ` : ''}

                  ${booking.budget ? `
                  <div class="detail-row">
                    <span class="detail-label">Budget:</span>
                    <span class="detail-value">${booking.budget}</span>
                  </div>
                  ` : ''}

                  ${booking.how_did_you_hear ? `
                  <div class="detail-row">
                    <span class="detail-label">Heard About Us:</span>
                    <span class="detail-value">${booking.how_did_you_hear}</span>
                  </div>
                  ` : ''}

                  ${booking.additional_details ? `
                  <h2>📝 Additional Details</h2>
                  <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${booking.additional_details}</div>
                  ` : ''}
                </div>

                <h2>📞 Next Steps</h2>
                <ol>
                  <li>✅ Review the client's information above</li>
                  <li>📅 Add the consultation to your calendar (button above)</li>
                  <li>📧 Consider sending a confirmation email to the client</li>
                  <li>📋 Prepare any questions or materials for the consultation</li>
                </ol>

                <p style="margin-top: 30px;">
                  <a href="mailto:${booking.email}" class="email-button">📧 Email Client</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `${booking.first_name}-${booking.last_name}-consultation.ics`,
          content: icsContent,
        },
      ],
    });

    if (error) {
      console.error('Failed to send business notification email:', error);
      return { success: false, error };
    }

    console.log('✅ Business notification email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending business email:', error);
    return { success: false, error };
  }
}
