/**
 * Production-ready rate limiting for authentication endpoints
 * Prevents brute force attacks and abuse
 */

import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowSeconds: 300, // 5 minutes
    lockoutSeconds: 900, // 15 minutes
  },
  passwordReset: {
    maxAttempts: 3,
    windowSeconds: 3600, // 1 hour
    lockoutSeconds: 3600, // 1 hour
  },
  userCreation: {
    maxAttempts: 10,
    windowSeconds: 86400, // 24 hours
    lockoutSeconds: 3600, // 1 hour
  },
  apiRequest: {
    maxAttempts: 100,
    windowSeconds: 60, // 1 minute
    lockoutSeconds: 60, // 1 minute
  },
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetAt: Date | null
  lockedUntil: Date | null
  error?: string
}

export interface RateLimitIdentifier {
  type: 'ip' | 'user_id' | 'email'
  value: string
}

/**
 * Get client IP address from request headers
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers()

  // Check various headers for IP (reverse proxy compatible)
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-client-ip') ||
    'unknown'

  return ip
}

/**
 * Get user agent from request headers
 */
export async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get('user-agent') || 'unknown'
}

/**
 * Create rate limit identifier from IP or user
 */
export function createRateLimitIdentifier(
  identifier: RateLimitIdentifier
): string {
  return `${identifier.type}:${identifier.value}`
}

/**
 * Clean up expired rate limit records
 */
async function cleanupExpiredRecords(supabase: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('rate_limits')
      .delete()
      .or(`window_start.lt.${new Date(Date.now() - 3600000).toISOString()},and(is_locked.eq.false)`)

    if (error) {
      console.error('Error cleaning up rate limits:', error)
    }
  } catch (error) {
    console.error('Error cleaning up rate limits:', error)
  }
}

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: RateLimitIdentifier,
  requestType: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[requestType]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const identifierString = createRateLimitIdentifier(identifier)
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000)

  try {
    // Clean up old records periodically
    if (Math.random() < 0.01) {
      // 1% chance to cleanup
      await cleanupExpiredRecords(supabase)
    }

    // Get existing rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifierString)
      .eq('identifier_type', identifier.type)
      .eq('request_type', requestType)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is ok
      console.error('Error fetching rate limit:', fetchError)
      return {
        // Fail open: do not block legitimate logins if the rate limit backend
        // (Supabase/PostgREST/fetch) is temporarily unavailable.
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
        lockedUntil: null,
        error: 'Rate limit unavailable',
      }
    }

    // Check if locked
    if (existing?.is_locked && existing.locked_until) {
      const lockedUntil = new Date(existing.locked_until)
      if (lockedUntil > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          resetAt: new Date(existing.window_start.getTime() + config.windowSeconds * 1000),
          lockedUntil,
          error: `Too many attempts. Try again after ${lockedUntil.toLocaleString()}`,
        }
      }
    }

    // Check if window has expired
    if (!existing || new Date(existing.window_start) < windowStart) {
      // Create or reset rate limit record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .upsert(
          {
            identifier: identifierString,
            identifier_type: identifier.type,
            request_type: requestType,
            attempt_count: 1,
            window_start: now.toISOString(),
            is_locked: false,
            locked_until: null,
          },
          {
            onConflict: 'identifier,identifier_type,request_type',
          }
        )

      if (insertError) {
        console.error('Error creating rate limit:', insertError)
      }

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
        lockedUntil: null,
      }
    }

    // Increment attempt count
    const newAttemptCount = existing.attempt_count + 1
    const remainingAttempts = Math.max(0, config.maxAttempts - newAttemptCount)
    const resetAt = new Date(
      new Date(existing.window_start).getTime() + config.windowSeconds * 1000
    )

    // Check if limit exceeded
    if (newAttemptCount > config.maxAttempts) {
      const lockedUntil = new Date(now.getTime() + config.lockoutSeconds * 1000)

      // Lock the identifier
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          attempt_count: newAttemptCount,
          is_locked: true,
          locked_until: lockedUntil.toISOString(),
        })
        .eq('identifier', identifierString)

      if (updateError) {
        console.error('Error updating rate limit:', updateError)
      }

      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt,
        lockedUntil,
        error: `Too many attempts. Try again after ${lockedUntil.toLocaleString()}`,
      }
    }

    // Update attempt count
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        attempt_count: newAttemptCount,
        window_start: existing.window_start,
      })
      .eq('identifier', identifierString)

    if (updateError) {
      console.error('Error updating rate limit:', updateError)
    }

    return {
      allowed: true,
      remainingAttempts,
      resetAt,
      lockedUntil: null,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open for safety (don't block legitimate traffic on error)
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      resetAt: new Date(now.getTime() + config.windowSeconds * 1000),
      lockedUntil: null,
    }
  }
}

/**
 * Reset rate limit for an identifier (admin function)
 */
export async function resetRateLimit(
  identifier: RateLimitIdentifier,
  requestType: keyof typeof RATE_LIMIT_CONFIGS
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { error } = await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', createRateLimitIdentifier(identifier))
      .eq('identifier_type', identifier.type)
      .eq('request_type', requestType)

    return !error
  } catch (error) {
    console.error('Error resetting rate limit:', error)
    return false
  }
}

/**
 * Check rate limit with IP address (convenience function)
 */
export async function checkRateLimitByIp(
  requestType: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  const ip = await getClientIp()
  return checkRateLimit({ type: 'ip', value: ip }, requestType)
}

/**
 * Check rate limit by email
 */
export async function checkRateLimitByEmail(
  email: string,
  requestType: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  return checkRateLimit({ type: 'email', value: email.toLowerCase() }, requestType)
}

/**
 * Check rate limit by user ID
 */
export async function checkRateLimitByUserId(
  userId: string,
  requestType: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  return checkRateLimit({ type: 'user_id', value: userId }, requestType)
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit<T extends any[]>(
  requestType: keyof typeof RATE_LIMIT_CONFIGS,
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const rateLimit = await checkRateLimitByIp(requestType)

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimit.error || 'Rate limit exceeded',
          retryAfter: rateLimit.resetAt?.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.floor(
              ((rateLimit.resetAt?.getTime() || 0) - Date.now()) / 1000
            ).toString(),
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS[requestType].maxAttempts.toString(),
            'X-RateLimit-Remaining': rateLimit.remainingAttempts.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt?.toISOString() || '',
          },
        }
      )
    }

    return handler(...args)
  }
}

/**
 * Get rate limit status (non-blocking)
 */
export async function getRateLimitStatus(
  identifier: RateLimitIdentifier,
  requestType: keyof typeof RATE_LIMIT_CONFIGS
): Promise<{
  attempts: number
  maxAttempts: number
  remaining: number
  resetAt: Date | null
  isLocked: boolean
  lockedUntil: Date | null
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', createRateLimitIdentifier(identifier))
      .eq('identifier_type', identifier.type)
      .eq('request_type', requestType)
      .single()

    if (error || !data) {
      return {
        attempts: 0,
        maxAttempts: RATE_LIMIT_CONFIGS[requestType].maxAttempts,
        remaining: RATE_LIMIT_CONFIGS[requestType].maxAttempts,
        resetAt: null,
        isLocked: false,
        lockedUntil: null,
      }
    }

    const config = RATE_LIMIT_CONFIGS[requestType]
    const windowStart = new Date(data.window_start)
    const resetAt = new Date(windowStart.getTime() + config.windowSeconds * 1000)
    const remaining = Math.max(0, config.maxAttempts - data.attempt_count)

    return {
      attempts: data.attempt_count,
      maxAttempts: config.maxAttempts,
      remaining,
      resetAt: resetAt > new Date() ? resetAt : null,
      isLocked: data.is_locked,
      lockedUntil: data.locked_until ? new Date(data.locked_until) : null,
    }
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return {
      attempts: 0,
      maxAttempts: RATE_LIMIT_CONFIGS[requestType].maxAttempts,
      remaining: RATE_LIMIT_CONFIGS[requestType].maxAttempts,
      resetAt: null,
      isLocked: false,
      lockedUntil: null,
    }
  }
}
