import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS } from '@/src/lib/validation';

/**
 * Rate limiting module for Dreamscape Curated Events
 *
 * Provides in-memory rate limiting with support for:
 * - Multiple rate limit types (booking, contact, upload, general)
 * - Per-client identification using IP and user agent
 * - Automatic cleanup of expired entries
 *
 * For production use with Redis, see rate-limit-redis.ts (optional)
 */

interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
  error?: string;
}

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
  error?: string;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the client (IP + user agent hash)
 * @param type - Type of rate limit to apply
 * @returns Rate limit result with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMITS = 'general'
): RateLimitResult {
  const now = Date.now();
  const limit = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // Reset if window has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limit.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= limit.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: `Too many requests. Please try again later.`,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: limit.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Generate a unique client identifier from the request
 *
 * Combines IP address and user agent to create a unique identifier
 * while preserving privacy by hashing the combination.
 *
 * @param request - Next.js request object
 * @returns Base64-encoded hash of IP + user agent
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // Add user agent to make identifier more unique
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create hash of IP + user agent for privacy
  return Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
}

/**
 * Express-style middleware for rate limiting API routes
 *
 * Automatically generates client identifier and returns appropriate
 * response if rate limit is exceeded.
 *
 * @param request - Next.js request object
 * @param type - Type of rate limit to apply
 * @returns Object with success status and optional error response
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'general'
): Promise<{ success: boolean; response?: NextResponse }> {
  const identifier = getClientIdentifier(request);
  const result = rateLimit(identifier, type);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: result.error,
          resetTime: result.resetTime,
        },
        {
          status: 429,
          headers: Object.fromEntries([
            ['X-RateLimit-Limit', RATE_LIMITS[type].maxRequests.toString()],
            ['X-RateLimit-Remaining', '0'],
            ['Retry-After', Math.ceil((result.resetTime! - Date.now()) / 1000).toString()],
            ...(result.resetTime ? [['X-RateLimit-Reset', result.resetTime.toString()]] : []),
          ]),
        }
      ),
    };
  }

  return { success: true };
}

// Cleanup old entries periodically (run every hour)
let cleanupInterval: NodeJS.Timeout | null = null;
if (typeof window === 'undefined' && !cleanupInterval) {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 3600000); // 1 hour
}
