/**
 * Production-ready user management service
 * Handles user CRUD operations with security and audit logging
 */

import { createClient } from '@supabase/supabase-js'
import { hashPassword, verifyPassword, validatePassword } from './password'
import { createAuditLog, AuditEventType, AuditEventCategory } from './audit-log'
import { checkRateLimitByUserId } from './rate-limit-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role?: 'admin' | 'super_admin'
  createdBy?: string
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: 'admin' | 'super_admin'
  isActive?: boolean
  updatedBy?: string
}

export interface ChangePasswordInput {
  userId: string
  currentPassword: string
  newPassword: string
  changedBy?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  emailVerified: boolean
  isActive: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  lastLoginAt: Date | null
  failedLoginAttempts: number
  lockedUntil: Date | null
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  try {
    // Validate password
    const passwordValidation = validatePassword(input.password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `Invalid password: ${passwordValidation.errors.join(', ')}`,
      }
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.email.toLowerCase())
      .single()

    if (existing) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Hash password
    const passwordHash = await hashPassword(input.password)

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
        name: input.name,
        role: input.role || 'admin',
        email_verified: false,
        is_active: true,
        failed_login_attempts: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return { success: false, error: 'Failed to create user' }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.USER_CREATED,
      category: AuditEventCategory.USER_MANAGEMENT,
      userId: input.createdBy,
      userEmail: input.createdBy ? await getUserEmail(input.createdBy) : undefined,
      targetUserEmail: input.email,
      eventData: {
        userName: input.name,
        role: input.role || 'admin',
      },
    })

    return {
      success: true,
      user: mapDbUserToUser(data),
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'Failed to create user' }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return null
    }

    return mapDbUserToUser(data)
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return null
    }

    return mapDbUserToUser(data)
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Get user by email with password hash (for authentication)
 */
export async function getUserWithPasswordByEmail(email: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * List all users
 */
export async function listUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error listing users:', error)
      return []
    }

    return (data || []).map(mapDbUserToUser)
  } catch (error) {
    console.error('Error listing users:', error)
    return []
  }
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  try {
    // Get current user
    const currentUser = await getUserById(userId)
    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    // Build update object
    const updateData: any = {}
    if (input.email) updateData.email = input.email.toLowerCase()
    if (input.name) updateData.name = input.name
    if (input.role) updateData.role = input.role
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return { success: false, error: 'Failed to update user' }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.USER_UPDATED,
      category: AuditEventCategory.USER_MANAGEMENT,
      userId: input.updatedBy,
      userEmail: input.updatedBy ? await getUserEmail(input.updatedBy) : undefined,
      targetUserEmail: currentUser.email,
      eventData: {
        changes: Object.keys(updateData),
      },
    })

    return {
      success: true,
      user: mapDbUserToUser(data),
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(
  userId: string,
  deletedBy: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getUserById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Soft delete
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Failed to delete user' }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.USER_DELETED,
      category: AuditEventCategory.USER_MANAGEMENT,
      userId: deletedBy,
      userEmail: await getUserEmail(deletedBy),
      targetUserEmail: user.email,
      eventData: {
        deletedUserName: user.name,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

/**
 * Change user password
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getUserById(input.userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get user with password
    const { data: userWithPassword } = await supabase
      .from('users')
      .select('*')
      .eq('id', input.userId)
      .single()

    if (!userWithPassword) {
      return { success: false, error: 'User not found' }
    }

    // Verify current password
    const isValid = await verifyPassword(input.currentPassword, userWithPassword.password_hash)
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Validate new password
    const passwordValidation = validatePassword(input.newPassword)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `Invalid password: ${passwordValidation.errors.join(', ')}`,
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(input.newPassword)

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', input.userId)

    if (error) {
      console.error('Error changing password:', error)
      return { success: false, error: 'Failed to change password' }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.PASSWORD_CHANGE,
      category: AuditEventCategory.AUTH,
      userId: input.changedBy || input.userId,
      userEmail: await getUserEmail(input.changedBy || input.userId),
      eventData: {
        passwordChangedFor: user.email,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Failed to change password' }
  }
}

/**
 * Lock user account
 */
export async function lockUserAccount(
  userId: string,
  durationMinutes: number,
  lockedBy: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getUserById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const lockedUntil = new Date(Date.now() + durationMinutes * 60000)

    const { error } = await supabase
      .from('users')
      .update({ locked_until: lockedUntil.toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error locking user:', error)
      return { success: false, error: 'Failed to lock user' }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.USER_LOCKED,
      category: AuditEventCategory.USER_MANAGEMENT,
      userId: lockedBy,
      userEmail: await getUserEmail(lockedBy),
      targetUserEmail: user.email,
      eventData: {
        durationMinutes,
        lockedUntil: lockedUntil.toISOString(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error locking user:', error)
    return { success: false, error: 'Failed to lock user' }
  }
}

/**
 * Unlock user account
 */
export async function unlockUserAccount(
  userId: string,
  unlockedBy: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getUserById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { error } = await supabase
      .from('users')
      .update({
        locked_until: null,
        failed_login_attempts: 0,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error unlocking user:', error)
      return { success: false, error: 'Failed to unlock user' }
    }

    // Log the event
    await createAuditLog({
      eventType: AuditEventType.USER_UNLOCKED,
      category: AuditEventCategory.USER_MANAGEMENT,
      userId: unlockedBy,
      userEmail: await getUserEmail(unlockedBy),
      targetUserEmail: user.email,
    })

    return { success: true }
  } catch (error) {
    console.error('Error unlocking user:', error)
    return { success: false, error: 'Failed to unlock user' }
  }
}

/**
 * Record failed login attempt
 */
export async function recordFailedLoginAttempt(
  userId: string,
  ipAddress: string
): Promise<{
  success: boolean
  isLocked: boolean
  lockedUntil?: Date
}> {
  try {
    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: false, isLocked: false }
    }

    const newAttemptCount = (user.failed_login_attempts || 0) + 1
    const updateData: any = {
      failed_login_attempts: newAttemptCount,
    }

    let isLocked = false
    let lockedUntil: Date | undefined

    // Lock account after 5 failed attempts
    if (newAttemptCount >= 5) {
      // Progressive lockout: 15 min, 30 min, 1 hour, 2 hours, etc.
      const lockDuration = Math.min(15 * Math.pow(2, newAttemptCount - 5), 1440) // Max 24 hours
      lockedUntil = new Date(Date.now() + lockDuration * 60000)
      updateData.locked_until = lockedUntil.toISOString()
      isLocked = true

      // Log security event
      await createAuditLog({
        eventType: AuditEventType.BRUTE_FORCE_DETECTED,
        category: AuditEventCategory.SECURITY,
        userId,
        userEmail: user.email,
        eventData: {
          failedAttempts: newAttemptCount,
          lockDuration,
          ipAddress,
        },
      })
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error recording failed login:', error)
    }

    return {
      success: !error,
      isLocked,
      lockedUntil,
    }
  } catch (error) {
    console.error('Error recording failed login:', error)
    return { success: false, isLocked: false }
  }
}

/**
 * Reset failed login attempts (after successful login)
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', userId)
  } catch (error) {
    console.error('Error resetting failed login attempts:', error)
  }
}

/**
 * Check if user account is locked
 */
export async function isUserLocked(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('users')
      .select('locked_until')
      .eq('id', userId)
      .single()

    if (!data || !data.locked_until) {
      return false
    }

    return new Date(data.locked_until) > new Date()
  } catch (error) {
    console.error('Error checking user lock status:', error)
    return false
  }
}

/**
 * Helper function to get user email by ID
 */
async function getUserEmail(userId: string): Promise<string | undefined> {
  try {
    const { data } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    return data?.email
  } catch (error) {
    return undefined
  }
}

/**
 * Map database user to User type
 */
function mapDbUserToUser(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    emailVerified: dbUser.email_verified,
    isActive: dbUser.is_active,
    twoFactorEnabled: dbUser.two_factor_enabled,
    createdAt: new Date(dbUser.created_at),
    lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : null,
    failedLoginAttempts: dbUser.failed_login_attempts || 0,
    lockedUntil: dbUser.locked_until ? new Date(dbUser.locked_until) : null,
  }
}
