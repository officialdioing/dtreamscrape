import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export interface AdminUser {
  email: string;
  name: string;
  role: string;
}

/**
 * Verify admin authentication from request headers
 * @returns Admin user if authenticated, null otherwise
 */
export async function getAdminUser(request: NextRequest): Promise<AdminUser | null> {
  try {
    // Check for admin auth cookie
    const adminAuthCookie = request.cookies.get('dreamscape_admin_auth')?.value;
    if (adminAuthCookie !== '1') {
      return null;
    }

    // Verify JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Middleware helper to require admin authentication
 * @returns Admin user or throws error
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminUser> {
  const admin = await getAdminUser(request);

  if (!admin) {
    throw new Error('Unauthorized');
  }

  return admin;
}
