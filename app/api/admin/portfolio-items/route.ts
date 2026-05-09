import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

/**
 * GET /api/admin/portfolio-items
 * List all portfolio items from the Go backend
 * Note: Authentication is handled by the Go backend middleware
 */
export async function GET(request: NextRequest) {
  try {
    // Forward the request with authentication cookies
    const response = await fetch(`${BACKEND_URL}/api/admin/portfolio-items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend portfolio items list error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to load portfolio items' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ items: data.data ?? data.items ?? [] });
  } catch (err) {
    console.error('Portfolio items list unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/portfolio-items
 * Create a new portfolio item via the Go backend
 */
export async function POST(request: NextRequest) {
  const errorResponse = await protectAdminRoute();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/admin/portfolio-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend portfolio items create error:', error);
      return NextResponse.json(
        { error: error.error || 'Failed to create portfolio item' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Portfolio items create unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
}