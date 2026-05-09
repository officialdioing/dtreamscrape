/**
 * Password reset API routes
 * POST /api/admin/password-reset - Request password reset
 * POST /api/admin/password-reset/verify - Verify reset token
 * POST /api/admin/password-reset/complete - Complete password reset
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  requestPasswordReset,
  verifyResetToken,
  completePasswordReset,
} from '@/src/lib/password-reset'
import { checkRateLimitByIp } from '@/src/lib/rate-limit-auth'

/**
 * POST /api/admin/password-reset
 * Request password reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await requestPasswordReset(email.trim().toLowerCase())

    if (!result.success && !result.rateLimited) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
