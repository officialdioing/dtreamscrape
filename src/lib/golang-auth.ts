/**
 * Golang Backend Authentication Helpers
 * OAuth 2.0 integration with Golang backend
 */

export interface GolangUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'user' | 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GolangSession {
  user: GolangUser
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_at: string
  user: GolangUser
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080'

// Log warning in development if using localhost
if (typeof window !== 'undefined' && BACKEND_URL.includes('localhost')) {
  console.warn('⚠️ Using localhost backend URL. Ensure NEXT_PUBLIC_BACKEND_API_URL is set in production.')
}

/**
 * OAuth 2.0 Login Functions
 */
export const oauthLogin = {
  google: () => {
    window.location.href = `${BACKEND_URL}/api/auth/google/login`
  },
  facebook: () => {
    window.location.href = `${BACKEND_URL}/api/auth/facebook/login`
  },
  apple: () => {
    window.location.href = `${BACKEND_URL}/api/auth/apple/login`
  }
}

/**
 * Traditional Login (username/password)
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }

  const data = await response.json()

  // Store session data
  if (data.data?.access_token) {
    setSession(data.data)
  }

  return data.data
}

/**
 * Register new user
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Registration failed')
  }

  const data = await response.json()

  if (data.data?.access_token) {
    setSession(data.data)
  }

  return data.data
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })

  clearSession()
}

/**
 * Change password for authenticated user
 */
export async function changePassword(passwords: ChangePasswordRequest): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(passwords)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to change password')
  }
}

/**
 * Get current user session (cached to prevent infinite loops)
 */
let sessionCache: GolangSession | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5000 // 5 seconds

export async function getSession(): Promise<GolangSession | null> {
  try {
    const now = Date.now()

    // Return cached session if available and fresh
    if (sessionCache && (now - lastFetchTime) < CACHE_DURATION) {
      return sessionCache
    }

    // First try to get session from localStorage
    const storedSession = getSessionFromStorage()
    if (storedSession) {
      // Check if token is expired
      const expiresAt = new Date(storedSession.expires_at)
      if (expiresAt > new Date()) {
        sessionCache = storedSession
        lastFetchTime = now
        return storedSession
      }
      // Token expired, try to refresh
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        const refreshedSession = getSessionFromStorage()
        sessionCache = refreshedSession
        lastFetchTime = now
        return refreshedSession
      }
    }

    // If no stored session, try to get from server
    const token = getAccessToken()
    if (!token) {
      sessionCache = null
      lastFetchTime = now
      return null
    }

    const headers: Record<string, string> = {}
    headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      headers
    })

    if (!response.ok) {
      sessionCache = null
      lastFetchTime = now
      return null
    }

    const data = await response.json()
    // GetMe returns user directly, not wrapped in data
    if (data.success && data.data) {
      // Only update storage if token is different to avoid infinite loops
      const currentSession = getSessionFromStorage()
      if (currentSession?.access_token !== token) {
        setSession({
          user: data.data,
          access_token: token,
          refresh_token: currentSession?.refresh_token || '',
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
        })
      }
      const resultSession = {
        user: data.data,
        access_token: token,
        refresh_token: currentSession?.refresh_token || '',
        expires_at: currentSession?.expires_at || new Date(Date.now() + 3600 * 1000).toISOString()
      }
      sessionCache = resultSession
      lastFetchTime = now
      return resultSession
    }

    sessionCache = null
    lastFetchTime = now
    return null
  } catch {
    sessionCache = null
    return null
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })

    if (!response.ok) {
      clearSession()
      return null
    }

    const data = await response.json()
    if (data.data?.access_token) {
      updateSessionTokens(data.data)
      return data.data.access_token
    }

    return null
  } catch {
    clearSession()
    return null
  }
}

/**
 * Session Storage Helpers
 */
const SESSION_KEY = 'golang_session'
const TOKEN_EXPIRY_KEY = 'golang_token_expiry'

function setSession(authResponse: AuthResponse): void {
  const sessionData = {
    user: authResponse.user,
    access_token: authResponse.access_token,
    refresh_token: authResponse.refresh_token,
    expires_at: authResponse.expires_at
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  localStorage.setItem(TOKEN_EXPIRY_KEY, authResponse.expires_at)
}

function getSessionFromStorage(): GolangSession | null {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY)
    if (!sessionStr) return null

    return JSON.parse(sessionStr)
  } catch {
    return null
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

function updateSessionTokens(authResponse: Partial<AuthResponse>): void {
  const current = getSessionFromStorage()
  if (!current) return

  const updated = {
    ...current,
    access_token: authResponse.access_token || current.access_token,
    refresh_token: authResponse.refresh_token || current.refresh_token,
    expires_at: authResponse.expires_at || current.expires_at
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  if (authResponse.expires_at) {
    localStorage.setItem(TOKEN_EXPIRY_KEY, authResponse.expires_at)
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return true

  return new Date(expiry) < new Date()
}

/**
 * Get access token from storage
 */
export function getAccessToken(): string | null {
  const session = getSessionFromStorage()
  return session?.access_token || null
}

/**
 * Authenticated fetch wrapper
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken()

  // Check if token needs refresh
  if (token && isTokenExpired()) {
    token = await refreshAccessToken()
  }

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}