import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/src/lib/backend-url';

/**
 * POST /api/admin/update-email
 * Update user's email address via Golang backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newEmail } = body;

    // Validate input
    if (!newEmail) {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get authorization header from incoming request
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user info
    const meResponse = await fetch(`${getBackendUrl()}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
      credentials: 'include',
    });

    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify identity' },
        { status: 401 }
      );
    }

    const meData = await meResponse.json();
    const currentUserId = meData.data?.id;

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unable to identify user' },
        { status: 401 }
      );
    }

    // Update email using admin endpoint
    const updateResponse = await fetch(`${getBackendUrl()}/api/admin/users/${currentUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      credentials: 'include',
      body: JSON.stringify({
        email: newEmail,
      }),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      return NextResponse.json(
        { error: updateData.error || updateData.message || 'Failed to update email' },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully. Please use your new email for future logins.',
    });

  } catch (error: any) {
    console.error('Email update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update email' },
      { status: 500 }
    );
  }
}
