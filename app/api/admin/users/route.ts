/**
 * User management API routes
 * POST /api/admin/users - Create new user
 * GET /api/admin/users - List all users
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/src/lib/server-auth'
import { createUser, listUsers } from '@/src/lib/user-service'
import { checkRateLimitByIp } from '@/src/lib/rate-limit-auth'

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimitByIp('apiRequest')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error || 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const admin = await requireAdminUser()

    const users = await listUsers()

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error listing users:', error)
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * Create new user (admin only)
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimitByIp('userCreation')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error || 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  try {
    const admin = await requireAdminUser()

    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const result = await createUser({
      email,
      password,
      name,
      role,
      createdBy: admin.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
