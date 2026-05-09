/**
 * Production-ready password reset flow
 * Secure token generation, email delivery, and verification
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { hashPassword } from './password'
import { createAuditLog, AuditEventType, AuditEventCategory } from './audit-log'
import { checkRateLimitByEmail, RATE_LIMIT_CONFIGS } from './rate-limit-auth'
import { getUserByEmail, getUserWithPasswordByEmail } from './user-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Token expiration: 1 hour
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000

/**
 * Generate secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean
  error?: string
  rateLimited?: boolean
}> {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimitByEmail(email, 'passwordReset')
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: rateLimit.error || 'Too many reset requests. Please try again later.',
        rateLimited: true,
      }
    }

    // Get user (don't reveal if user exists or not)
    const user = await getUserByEmail(email)
    if (!user) {
      // Still return success to prevent email enumeration
      return { success: true }
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return {
        success: false,
        error: `Account is locked until ${user.lockedUntil.toLocaleString()}`,
      }
    }

    // Generate token
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS)

    // Store token in database
    const { error } = await supabase
      .from('users')
      .update({
        password_reset_token: token,
        password_reset_expires: expiresAt.toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error storing reset token:', error)
      return {
        success: false,
        error: 'Failed to process reset request',
      }
    }

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${token}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@dreamscapeevents.com',
        to: email,
        subject: 'Password Reset Request - Dreamscape Curated Events',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #7B2D6E 0%, #C9A84C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #7B2D6E; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Dreamscape Curated Events</h1>
              </div>
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>

                <p>To reset your password, click the button below:</p>
                <center>
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </center>

                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #7B2D6E;">${resetUrl}</p>

                <div class="warning">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour for your security.
                </div>

                <p>If you have any questions, please contact our support team.</p>

                <div class="footer">
                  <p>This is an automated email. Please do not reply.</p>
                  <p>&copy; ${new Date().getFullYear()} Dreamscape Curated Events. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      })

      // Log the event
      await createAuditLog({
        eventType: AuditEventType.PASSWORD_RESET_REQUEST,
        category: AuditEventCategory.AUTH,
        userId: user.id,
        userEmail: email,
        eventData: {
          resetUrl: resetUrl.substring(0, 100) + '...', // Truncate for security
          expiresAt: expiresAt.toISOString(),
        },
      })

      return { success: true }
    } catch (emailError) {
      console.error('Error sending reset email:', emailError)
      return {
        success: false,
        error: 'Failed to send reset email',
      }
    }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return {
      success: false,
      error: 'Failed to process reset request',
    }
  }
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean
  userId?: string
  email?: string
  error?: string
}> {
  try {
    if (!token || token.length !== 64) {
      return { valid: false, error: 'Invalid token format' }
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, password_reset_expires')
      .eq('password_reset_token', token)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid or expired token' }
    }

    // Check expiration
    if (data.password_reset_expires) {
      const expiresAt = new Date(data.password_reset_expires)
      if (expiresAt < new Date()) {
        return { valid: false, error: 'Token has expired' }
      }
    }

    return {
      valid: true,
      userId: data.id,
      email: data.email,
    }
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * Complete password reset
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  ipAddress?: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Verify token first
    const verification = await verifyResetToken(token)
    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        error: verification.error || 'Invalid or expired token',
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password and clear token
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
        failed_login_attempts: 0, // Reset failed attempts
        locked_until: null, // Unlock account if locked
        updated_at: new Date().toISOString(),
      })
      .eq('id', verification.userId)

    if (error) {
      console.error('Error completing password reset:', error)
      return {
        success: false,
        error: 'Failed to complete password reset',
      }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.PASSWORD_RESET_SUCCESS,
      category: AuditEventCategory.AUTH,
      userId: verification.userId,
      userEmail: verification.email,
      eventData: {
        ipAddress,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error completing password reset:', error)
    return {
      success: false,
      error: 'Failed to complete password reset',
    }
  }
}

/**
 * Admin reset user password
 */
export async function adminResetUserPassword(
  userId: string,
  adminEmail: string
): Promise<{
  success: boolean
  tempPassword?: string
  error?: string
}> {
  try {
    // Generate temporary password
    const tempPassword = generateSecurePassword(16)
    const passwordHash = await hashPassword(tempPassword)

    // Update password
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error resetting user password:', error)
      return {
        success: false,
        error: 'Failed to reset password',
      }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.PASSWORD_RESET_SUCCESS,
      category: AuditEventCategory.USER_MANAGEMENT,
      userEmail: adminEmail,
      eventData: {
        targetUserId: userId,
        resetBy: 'admin',
      },
    })

    return {
      success: true,
      tempPassword,
    }
  } catch (error) {
    console.error('Error resetting user password:', error)
    return {
      success: false,
      error: 'Failed to reset password',
    }
  }
}

/**
 * Generate secure password
 */
function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  const all = uppercase + lowercase + numbers + special
  let password = ''

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Invalidate all reset tokens for a user
 */
export async function invalidateResetTokens(userId: string): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', userId)
  } catch (error) {
    console.error('Error invalidating reset tokens:', error)
  }
}

/**
 * Clean up expired reset tokens (maintenance function)
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('users')
      .update({
        password_reset_token: null,
        password_reset_expires: null,
      })
      .lt('password_reset_expires', new Date().toISOString())
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error cleaning up expired tokens:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error)
    return 0
  }
}
