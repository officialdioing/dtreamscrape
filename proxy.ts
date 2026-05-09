import { NextResponse } from 'next/server'

/**
 * Golang Backend Authentication Middleware
 * Replaces NextAuth with Golang backend session validation
 */

export async function proxy(request: any) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Public paths that don't require authentication
  const publicPaths = ['/admin/setup', '/admin/login', '/admin/forgot-password', '/auth/callback']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // API routes that don't need auth check
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/debug')) {
    return NextResponse.next()
  }

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  try {
    // Check for Golang backend session cookies
    const accessToken = request.cookies.get('access_token')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value

    // If no session cookies, redirect to login
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Optionally validate token with backend (adds latency, so disabled by default)
    // Uncomment if you want server-side token validation
    /*
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080'
    const validationResult = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include'
    })

    if (!validationResult.ok) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    const userData = await validationResult.json()
    if (!userData.data || userData.data.role === 'user') {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    */

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch (error) {
    console.error('Proxy auth error:', error)
    // On auth errors, redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}