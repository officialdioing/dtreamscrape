import { NextResponse } from 'next/server';
import { sendCustomerConfirmationEmail, sendBusinessNotificationEmail, getEmailServiceStatus } from '@/src/lib/email-service';

// Test email endpoint
export async function GET() {
  try {
    const testBookingData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'info@dreamscapeevent.com',
      phone: '+2348169246969',
      consultation_date: '2026-05-15',
      consultation_time: '10:00',
      event_date: '2026-06-20',
      event_location: 'Lagos, Nigeria',
      event_types: ['Wedding', 'Reception'],
      budget: '$5,000 - $10,000',
      guests: '200',
      how_did_you_hear: 'Google',
      additional_details: 'This is a test booking to verify email functionality.',
    };

    console.log('🧪 Testing email sending...');

    // Test customer email
    const customerResult = await sendCustomerConfirmationEmail(testBookingData);

    // Test business email
    const businessResult = await sendBusinessNotificationEmail(testBookingData);

    // Get service status
    const serviceStatus = getEmailServiceStatus();

    return NextResponse.json({
      success: true,
      message: 'Email test completed',
      results: {
        customerEmail: {
          sent: customerResult.success,
          service: customerResult.service,
          data: customerResult.data,
          error: customerResult.error,
        },
        businessEmail: {
          sent: businessResult.success,
          service: businessResult.service,
          data: businessResult.data,
          error: businessResult.error,
        },
      },
      serviceStatus: {
        brevo: {
          available: serviceStatus.brevo.available,
          error: serviceStatus.brevo.lastError,
        },
        resend: {
          available: serviceStatus.resend.available,
          error: serviceStatus.resend.lastError,
        },
      },
      instructions: 'Check your inbox for test emails',
      emailCapacity: {
        brevo: '300 emails/day FREE',
        resend: '100 emails/day FREE',
        total: '400 emails/day potential (when both work)'
      }
    });

  } catch (error) {
    console.error('❌ Email test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to send test emails'
    }, { status: 500 });
  }
}
