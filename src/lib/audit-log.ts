/**
 * Production-ready audit logging system
 * Tracks all security-relevant events for compliance and monitoring
 */

import { createClient } from '@supabase/supabase-js'
import { getClientIp, getUserAgent } from './rate-limit-auth'

// Event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_RESET_FAILED = 'password_reset_failed',

  // User management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOCKED = 'user_locked',
  USER_UNLOCKED = 'user_unlocked',

  // Two-factor authentication
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_VERIFY_SUCCESS = 'two_factor_verify_success',
  TWO_FACTOR_VERIFY_FAILED = 'two_factor_verify_failed',
  TWO_FACTOR_BACKUP_CODE_USED = 'two_factor_backup_code_used',

  // Email verification
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  EMAIL_VERIFIED = 'email_verified',
  EMAIL_VERIFICATION_FAILED = 'email_verification_failed',

  // Security events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  BRUTE_FORCE_DETECTED = 'brute_force_detected',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',

  // Admin actions
  ADMIN_LOGIN = 'admin_login',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ROLE_CHANGE = 'role_change',
}

// Event categories
export enum AuditEventCategory {
  AUTH = 'auth',
  USER_MANAGEMENT = 'user_management',
  SECURITY = 'security',
  ADMIN = 'admin',
}

export interface AuditLogEntry {
  eventType: AuditEventType
  category: AuditEventCategory
  userId?: string
  userEmail?: string
  targetUserId?: string
  targetUserEmail?: string
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestPath?: string
  eventData?: Record<string, any>
  success?: boolean
  errorMessage?: string
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Get IP and user agent if not provided
    const ipAddress = entry.ipAddress || 'unknown'
    const userAgent = entry.userAgent || 'unknown'

    const { error } = await supabase.from('audit_logs').insert({
      event_type: entry.eventType,
      event_category: entry.category,
      user_id: entry.userId || null,
      user_email: entry.userEmail || null,
      target_user_id: entry.targetUserId || null,
      target_user_email: entry.targetUserEmail || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_method: entry.requestMethod || null,
      request_path: entry.requestPath || null,
      event_data: entry.eventData || {},
      success: entry.success !== undefined ? entry.success : true,
      error_message: entry.errorMessage || null,
    })

    if (error) {
      console.error('Failed to create audit log:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating audit log:', error)
    return false
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  eventType:
    | AuditEventType.LOGIN_SUCCESS
    | AuditEventType.LOGIN_FAILED
    | AuditEventType.LOGOUT,
  userEmail: string,
  success: boolean,
  errorMessage?: string,
  eventData?: Record<string, any>
): Promise<boolean> {
  return createAuditLog({
    eventType,
    category: AuditEventCategory.AUTH,
    userEmail,
    success,
    errorMessage,
    eventData,
  })
}

/**
 * Log user management event
 */
export async function logUserEvent(
  eventType:
    | AuditEventType.USER_CREATED
    | AuditEventType.USER_UPDATED
    | AuditEventType.USER_DELETED
    | AuditEventType.USER_LOCKED
    | AuditEventType.USER_UNLOCKED,
  actorUserId: string,
  actorEmail: string,
  targetUserEmail: string,
  eventData?: Record<string, any>
): Promise<boolean> {
  return createAuditLog({
    eventType,
    category: AuditEventCategory.USER_MANAGEMENT,
    userId: actorUserId,
    userEmail: actorEmail,
    targetUserEmail,
    eventData,
  })
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType:
    | AuditEventType.SUSPICIOUS_ACTIVITY
    | AuditEventType.RATE_LIMIT_EXCEEDED
    | AuditEventType.BRUTE_FORCE_DETECTED
    | AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
  eventData?: Record<string, any>,
  userEmail?: string
): Promise<boolean> {
  return createAuditLog({
    eventType,
    category: AuditEventCategory.SECURITY,
    userEmail,
    eventData,
  })
}

/**
 * Get recent audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .or(`user_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
  hours: number = 24,
  limit: number = 100
): Promise<any[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const since = new Date(Date.now() - hours * 3600000).toISOString()

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_category', AuditEventCategory.SECURITY)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching security events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching security events:', error)
    return []
  }
}

/**
 * Get failed login attempts for a user
 */
export async function getFailedLoginAttempts(
  userEmail: string,
  hours: number = 24
): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const since = new Date(Date.now() - hours * 3600000).toISOString()

    const { count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', AuditEventType.LOGIN_FAILED)
      .eq('user_email', userEmail.toLowerCase())
      .gte('created_at', since)

    if (error) {
      console.error('Error counting failed logins:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting failed logins:', error)
    return 0
  }
}

/**
 * Check for suspicious activity patterns
 */
export async function checkSuspiciousActivity(
  userEmail: string
): Promise<{
  isSuspicious: boolean
  reasons: string[]
  details: Record<string, any>
}> {
  const recentFailedLogins = await getFailedLoginAttempts(userEmail, 1)
  const recentSecurityEvents = await getRecentSecurityEvents(24, 50)

  const reasons: string[] = []
  const details: Record<string, any> = {
    failedLoginsLastHour: recentFailedLogins,
    recentSecurityEvents: recentSecurityEvents.length,
  }

  // Check for multiple failed logins
  if (recentFailedLogins >= 5) {
    reasons.push('Multiple failed login attempts detected')
    details.failedLoginThreshold = 5
  }

  // Check for rate limit violations
  const rateLimitViolations = recentSecurityEvents.filter(
    (e) => e.event_type === AuditEventType.RATE_LIMIT_EXCEEDED
  ).length

  if (rateLimitViolations >= 3) {
    reasons.push('Multiple rate limit violations')
    details.rateLimitViolations = rateLimitViolations
  }

  // Check for unauthorized access attempts
  const unauthorizedAttempts = recentSecurityEvents.filter(
    (e) => e.event_type === AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT
  ).length

  if (unauthorizedAttempts >= 3) {
    reasons.push('Multiple unauthorized access attempts')
    details.unauthorizedAttempts = unauthorizedAttempts
  }

  // Check for logins from multiple IPs (would need to aggregate)
  const userLogs = await getUserAuditLogs(
    userEmail,
    50
  )
  const uniqueIPs = new Set(
    userLogs.map((log) => log.ip_address).filter(Boolean)
  )

  if (uniqueIPs.size >= 5) {
    reasons.push('Logins from multiple IP addresses detected')
    details.uniqueIPs = uniqueIPs.size
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    details,
  }
}

/**
 * Generate audit report for compliance
 */
export async function generateAuditReport(params: {
  startDate: Date
  endDate: Date
  eventType?: AuditEventType
  category?: AuditEventCategory
  userId?: string
  limit?: number
}): Promise<{
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  eventsByType: Record<string, number>
  eventsByCategory: Record<string, number>
  topIPs: Array<{ ip: string; count: number }>
  events: any[]
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', params.startDate.toISOString())
      .lte('created_at', params.endDate.toISOString())

    if (params.eventType) {
      query = query.eq('event_type', params.eventType)
    }

    if (params.category) {
      query = query.eq('event_category', params.category)
    }

    if (params.userId) {
      query = query.or(`user_id.eq.${params.userId},target_user_id.eq.${params.userId}`)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(params.limit || 1000)

    const { data: events, error } = await query

    if (error) {
      throw error
    }

    const eventsList = events || []

    // Calculate statistics
    const eventsByType: Record<string, number> = {}
    const eventsByCategory: Record<string, number> = {}
    const ipCounts: Record<string, number> = {}
    let successfulEvents = 0
    let failedEvents = 0

    for (const event of eventsList) {
      // Count by type
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1

      // Count by category
      eventsByCategory[event.event_category] =
        (eventsByCategory[event.event_category] || 0) + 1

      // Count success/failure
      if (event.success) {
        successfulEvents++
      } else {
        failedEvents++
      }

      // Count IPs
      if (event.ip_address) {
        ipCounts[event.ip_address] = (ipCounts[event.ip_address] || 0) + 1
      }
    }

    // Get top IPs
    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEvents: eventsList.length,
      successfulEvents,
      failedEvents,
      eventsByType,
      eventsByCategory,
      topIPs,
      events: eventsList,
    }
  } catch (error) {
    console.error('Error generating audit report:', error)
    return {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      eventsByType: {},
      eventsByCategory: {},
      topIPs: [],
      events: [],
    }
  }
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 86400000).toISOString()

    const { count, error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error cleaning up audit logs:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error cleaning up audit logs:', error)
    return 0
  }
}
