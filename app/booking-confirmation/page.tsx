'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function BookingConfirmationPage() {
  useEffect(() => {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (!pendingBooking) return;

    const bookingData = JSON.parse(pendingBooking);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase client environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    supabase
      .from('bookings')
      .insert([
        {
          first_name: bookingData.firstName,
          last_name: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          event_date: bookingData.eventDate || null,
          event_location: bookingData.eventLocation || null,
          event_types: bookingData.eventTypes || [],
          budget: bookingData.budget || null,
          guests: bookingData.guests || null,
          how_did_you_hear: bookingData.howDidYouHear || null,
          additional_details: bookingData.additionalDetails || null,
          consultation_date: bookingData.consultationDate,
          consultation_time: bookingData.consultationTime,
          file_urls: bookingData.fileUrls || [],
          file_names: bookingData.fileNames || [],
          status: 'confirmed',
        },
      ])
      .then(() => {
        console.log('Booking saved to database');
        sessionStorage.removeItem('pendingBooking');
      })
      .catch((error) => {
        console.error('Failed to save booking:', error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-6 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-brand-purple/20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-brand-dark mb-4">
            Booking Confirmed!
          </h1>

          <p className="text-lg text-brand-gray mb-6">
            Thank you for booking your consultation with Dreamscape Curated Events. We have received your booking and will send you a confirmation email shortly.
          </p>

          <div className="bg-brand-purple/5 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-brand-purple mb-3">What happens next:</h2>
            <ul className="space-y-2 text-sm text-brand-gray">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                You'll receive a confirmation email with meeting details
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                We'll review your event details and prepare for our consultation
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                You can add files or more details through the link in the email
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-brand-purple text-white rounded-lg hover:bg-brand-pink transition-colors font-semibold"
            >
              Back to Home
            </a>
            <a
              href="/consultation"
              className="px-6 py-3 border-2 border-brand-purple text-brand-purple rounded-lg hover:bg-brand-purple hover:text-white transition-colors font-semibold"
            >
              Book Another Consultation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
