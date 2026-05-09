/**
 * Account lock/unlock API routes
 * POST /api/admin/users/[id]/lock - Lock user account
 * DELETE /api/admin/users/[id]/lock - Unlock user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/src/lib/server-auth'
import { lockUserAccount, unlockUserAccount } from '@/src/lib/user-service'

/**
 * POST /api/admin/users/[id]/lock
 * Lock user account (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser()

    const body = await request.json()
    const { durationMinutes } = body

    if (!durationMinutes || durationMinutes < 1 || durationMinutes > 43200) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 43200 minutes (30 days)' },
        { status: 400 }
      )
    }

    const result = await lockUserAccount(params.id, durationMinutes, admin.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User account locked for ${durationMinutes} minutes`,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error locking user:', error)
    return NextResponse.json(
      { error: 'Failed to lock user account' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]/lock
 * Unlock user account (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser()

    const result = await unlockUserAccount(params.id, admin.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User account unlocked successfully',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error unlocking user:', error)
    return NextResponse.json(
      { error: 'Failed to unlock user account' },
      { status: 500 }
    )
  }
}
