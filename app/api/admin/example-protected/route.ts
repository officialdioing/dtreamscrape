import { NextResponse } from 'next/server'
import { requireAdminUser, protectAdminRoute } from '@/src/lib/server-auth'

/**
 * Example protected admin API route
 *
 * GET /api/admin/example-protected
 * Returns protected data only accessible to authenticated admins
 */

export async function GET() {
  // Method 1: Simple protection using protectAdminRoute
  const errorResponse = await protectAdminRoute()
  if (errorResponse) {
    return errorResponse
  }

  // Method 2: Get user and handle manually
  const user = await requireAdminUser()

  return NextResponse.json({
    message: 'This is protected admin data',
    user: {
      email: user.email,
      name: user.name,
    },
    timestamp: new Date().toISOString(),
  })
}

/**
 * Example with POST request
 */
export async function POST(request: Request) {
  try {
    const user = await requireAdminUser()

    const body = await request.json()

    // Process the request with admin privileges
    return NextResponse.json({
      message: 'Data created successfully',
      data: body,
      createdBy: user.email,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
