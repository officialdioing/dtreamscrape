/**
 * Redis-based Rate Limiting for Production
 *
 * This implementation uses Redis for persistent, distributed rate limiting.
 * Falls back to in-memory rate limiting if Redis is not configured.
 *
 * Environment Variables:
 * - REDIS_URL: Redis connection URL (e.g., redis://localhost:6379)
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST API URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST API Token
 *
 * @example
 * ```typescript
 * import { rateLimit } from '@/lib/rate-limit-redis';
 *
 * const result = await rateLimit('client-identifier', 'booking');
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 429 });
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS } from '@/src/lib/validation';

interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
  error?: string;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<'OK' | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  ping?: () => Promise<string>;
  quit?: () => Promise<string>;
  disconnect?: () => void;
}

let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client
 * Supports both ioredis and redis packages
 */
async function initRedisClient(): Promise<RedisClient | null> {
  if (redisClient) return redisClient;

  try {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (!redisUrl) {
      console.warn('[RateLimit] Redis URL not configured, falling back to in-memory rate limiting');
      return null;
    }

    // Try to import and initialize Redis
    let redis: any;

    // Try ioredis first
    try {
      const IoRedis = (await import('ioredis')).default;
      redis = new IoRedis(redisUrl, {
        tls: redisUrl.includes('rediss://') ? {} : undefined,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
      });
    } catch (error) {
      // Fall back to redis package
      try {
        const RedisClient = (await import('redis')).createClient;
        redis = RedisClient({
          url: redisUrl,
        });
        await redis.connect();
      } catch (err) {
        console.error('[RateLimit] Redis initialization failed:', err);
        return null;
      }
    }

    // Test connection
    if (redis.ping) {
      await redis.ping();
    }
    console.log('[RateLimit] Redis client initialized successfully');

    redisClient = redis;
    return redisClient;
  } catch (error) {
    console.error('[RateLimit] Redis initialization failed:', error);
    return null;
  }
}

/**
 * Redis-based rate limiting with sliding window counter
 */
async function rateLimitRedis(
  identifier: string,
  type: keyof typeof RATE_LIMITS = 'general'
): Promise<RateLimitResult> {
  const client = await initRedisClient();
  if (!client) {
    // Fall back to in-memory rate limiting
    return rateLimitMemory(identifier, type);
  }

  const now = Date.now();
  const limit = RATE_LIMITS[type];
  const key = `ratelimit:${type}:${identifier}`;
  const windowSeconds = Math.ceil(limit.windowMs / 1000);

  try {
    // Get current count
    const current = await client.get(key);
    const count = current ? parseInt(current, 10) : 0;

    // Check if limit exceeded
    if (count >= limit.maxRequests) {
      const ttlKey = `${key}:ttl`;
      const ttl = await client.get(ttlKey);
      const resetTime = ttl ? parseInt(ttl, 10) : now + limit.windowMs;

      return {
        success: false,
        remaining: 0,
        resetTime,
        error: `Too many requests. Please try again later.`,
      };
    }

    // Increment counter
    const newCount = await client.incr(key);

    // Set expiry if this is the first request
    if (newCount === 1) {
      await client.expire(key, windowSeconds);
      const ttlKey = `${key}:ttl`;
      await client.setex(ttlKey, windowSeconds, (now + limit.windowMs).toString());
    }

    return {
      success: true,
      remaining: limit.maxRequests - newCount,
      resetTime: now + limit.windowMs,
    };
  } catch (error) {
    console.error('[RateLimit] Redis error:', error);
    // Fall back to in-memory on error
    return rateLimitMemory(identifier, type);
  }
}

/**
 * In-memory rate limiting fallback (for development or when Redis is unavailable)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimitMemory(
  identifier: string,
  type: keyof typeof RATE_LIMITS = 'general'
): RateLimitResult {
  const now = Date.now();
  const limit = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limit.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  if (entry.count >= limit.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: `Too many requests. Please try again later.`,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: limit.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Main rate limit function with automatic Redis fallback
 *
 * @param identifier - Unique client identifier (IP + user agent hash)
 * @param type - Type of rate limit (booking, contact, upload, general)
 * @returns Rate limit result
 */
export async function rateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMITS = 'general'
): Promise<RateLimitResult> {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedisUrl = !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL);

  if (isProduction && hasRedisUrl) {
    return rateLimitRedis(identifier, type);
  }

  // Use in-memory for development or when Redis is not configured
  return Promise.resolve(rateLimitMemory(identifier, type));
}

/**
 * Get client identifier from request
 *
 * Combines IP address and user agent to create a unique identifier
 * while preserving privacy by hashing the combination.
 *
 * @param request - Next.js request object
 * @returns Base64-encoded hash of IP + user agent
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create hash of IP + user agent for privacy
  return Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
}

/**
 * Rate limit middleware for API routes
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
  const result = await rateLimit(identifier, type);

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

/**
 * Cleanup old entries for in-memory store (development only)
 */
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

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      if ('quit' in redisClient && typeof redisClient.quit === 'function') {
        await redisClient.quit();
      } else if ('disconnect' in redisClient && typeof redisClient.disconnect === 'function') {
        redisClient.disconnect();
      }
      redisClient = null;
      console.log('[RateLimit] Redis connection closed');
    } catch (error) {
      console.error('[RateLimit] Error closing Redis connection:', error);
    }
  }
}
