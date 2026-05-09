import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    },
    email: {
      brevo: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
      resend: process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
    },
    other: {
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL ? '✅ Set' : '❌ Missing',
      businessEmail: process.env.NEXT_PUBLIC_BUSINESS_EMAIL ? '✅ Set' : '❌ Missing',
    }
  });
}
