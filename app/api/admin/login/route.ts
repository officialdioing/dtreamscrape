import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/src/lib/rate-limit';
import { generateToken, isValidEmail, isValidPassword } from '@/src/lib/jwt';

// Admin credentials - password MUST be set via environment variable
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    // Validate that required environment variables are set
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin login is not configured (missing ADMIN_EMAIL/ADMIN_PASSWORD)' },
        { status: 500 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 'general');
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const { email, password } = await request.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate email format
    const sanitizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password format (basic check)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Validate credentials
    if (sanitizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate secure JWT token
      const token = await generateToken({
        email: sanitizedEmail,
        name: 'Admin',
        role: 'admin',
      });

      // Create response with HTTP-only cookie for better security
      const response = NextResponse.json({
        success: true,
        token,
        user: {
          email: sanitizedEmail,
          name: 'Admin',
          role: 'admin',
        },
      });

      // Set HTTP-only cookie as additional security layer
      response.cookies.set('dreamscape_admin_auth', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      // Store JWT in an HTTP-only cookie so middleware can verify admin sessions
      response.cookies.set('dreamscape_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
