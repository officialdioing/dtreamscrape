import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/src/lib/backend-url';

/**
 * POST /api/admin/update-profile
 * Update user's profile information via Golang backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, firstName, middleName, lastName, phone } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Validate first name
    if (!firstName || typeof firstName !== 'string') {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (firstName.trim().length < 2) {
      return NextResponse.json(
        { error: 'First name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate last name
    if (!lastName || typeof lastName !== 'string') {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      );
    }

    if (lastName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Last name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && phone.trim().length > 0) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }
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

    // Get current user data to preserve existing metadata
    const currentUser = meData.data;
    const existingMetadata = currentUser?.metadata || {};

    // Build full name
    const fullName = `${firstName.trim()} ${middleName ? middleName.trim() + ' ' : ''}${lastName.trim()}`;

    // Update profile using admin endpoint
    // Note: first_name and last_name are stored in metadata, not as separate DB columns
    const updateResponse = await fetch(`${getBackendUrl()}/api/admin/users/${currentUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      credentials: 'include',
      body: JSON.stringify({
        name: fullName,
        metadata: {
          ...existingMetadata,
          username: trimmedUsername,
          first_name: firstName.trim(),
          middle_name: middleName ? middleName.trim() : null,
          last_name: lastName.trim(),
          phone: phone ? phone.trim() : null,
        },
      }),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      return NextResponse.json(
        { error: updateData.error || updateData.message || 'Failed to update profile' },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updateData.data || updateData.user,
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
