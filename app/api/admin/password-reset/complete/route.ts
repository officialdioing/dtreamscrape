/**
 * Complete password reset
 * POST /api/admin/password-reset/complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { completePasswordReset } from '@/src/lib/password-reset'
import { checkRateLimitByIp } from '@/src/lib/rate-limit-auth'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimitByIp('passwordReset')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.error || 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    const result = await completePasswordReset(token, password, ipAddress)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Error completing password reset:', error)
    return NextResponse.json(
      { error: 'Failed to complete password reset' },
      { status: 500 }
    )
  }
}
