import { NextRequest, NextResponse } from 'next/server'
import { getSession as getGolangSession } from '@/src/lib/golang-auth'

/**
 * Server-side authentication utilities for API routes
 */

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

/**
 * Get the current session from the request
 */
export async function getSession() {
  return await getGolangSession()
}

/**
 * Get the current admin user from the request
 * @returns Admin user if authenticated and is admin, null otherwise
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getGolangSession()

  const role = session?.user?.role
  if (!session?.user || (role !== 'admin' && role !== 'super_admin')) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: `${session.user.first_name} ${session.user.last_name}`,
    role: session.user.role,
  }
}

/**
 * Require admin authentication - throws error if not admin
 * @returns Admin user if authenticated
 * @throws Error if not authenticated or not admin
 */
export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser()

  if (!user) {
    throw new Error('Admin authentication required')
  }

  return user
}

/**
 * Create a standardized unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Create a standardized forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Middleware helper to protect API routes
 * @returns Response if error, null if authenticated
 */
export async function protectAdminRoute(): Promise<NextResponse | null> {
  const user = await getAdminUser()

  if (!user) {
    return unauthorizedResponse('Admin authentication required')
  }

  return null
}
