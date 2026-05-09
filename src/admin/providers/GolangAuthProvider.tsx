'use client'

import { getBackendUrl } from '@/src/lib/backend-url';

/**
 * Golang Backend Authentication Provider
 * Replaces NextAuth with Golang backend OAuth 2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  GolangUser,
  getSession,
  logout as golangLogout,
  refreshAccessToken,
  getAccessToken,
  isTokenExpired
} from '@/src/lib/golang-auth'

interface AuthContextType {
  user: GolangUser | null
  loading: boolean
  isLoading: boolean
  error: string | null
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateUser: (user: GolangUser) => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function GolangAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GolangUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    // Immediate check from localStorage for faster UI response
    const immediateCheck = () => {
      try {
        const sessionStr = localStorage.getItem('golang_session')
        if (sessionStr) {
          const session = JSON.parse(sessionStr)
          // Check if token is not expired (with 5min buffer)
          const expiresAt = new Date(session.expires_at)
          const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

          if (session?.user && expiresAt > fiveMinutesFromNow) {
            console.log('✅ Found valid session in localStorage')
            setUser(session.user)
            setLoading(false)
            // Don't do background check that might interfere
            return
          } else {
            console.warn('⚠️ Session expired, removing from storage')
            localStorage.removeItem('golang_session')
            localStorage.removeItem('golang_token_expiry')
          }
        }
      } catch (err) {
        console.error('Failed to parse session from localStorage:', err)
        localStorage.removeItem('golang_session')
        localStorage.removeItem('golang_token_expiry')
      }

      // If no valid session in localStorage, do full auth check
      checkAuth()
    }

    immediateCheck()
  }, [])

  // Token refresh interval
  useEffect(() => {
    if (!user) return

    // Check token expiry every minute
    const interval = setInterval(async () => {
      const token = getAccessToken()
      if (token && isTokenExpired()) {
        await refreshAccessToken()
      }
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [user])

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const session = await getSession()

      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setError('Failed to check authentication status')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for storage changes (for multi-tab login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only trigger if the change came from a different tab/window
      // AND only for meaningful auth state changes
      if (e.key === 'golang_session' || e.key === 'golang_token_expiry') {
        // Check if this is actually an auth state change (login/logout)
        // by comparing the old value with the current state
        const hadSessionBefore = !!e.oldValue
        const hasSessionNow = !!e.newValue

        // Only recheck if there was an actual login/logout event
        // (session appeared or disappeared, not just a refresh)
        if (hadSessionBefore !== hasSessionNow) {
          console.log('🔄 Auth state changed, refreshing...')
          checkAuth()
        } else {
          console.log('ℹ️  Session refreshed but auth state unchanged, skipping recheck')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const logout = async () => {
    try {
      await golangLogout()
      setUser(null)
      router.push('/admin/login')
    } catch (err) {
      console.error('Logout failed:', err)
      // Force logout even if API call fails
      setUser(null)
      router.push('/admin/login')
    }
  }

  const refreshSession = async () => {
    await checkAuth()
  }

  const updateUser = (updatedUser: GolangUser) => {
    setUser(updatedUser)
    // Also update localStorage to keep in sync
    try {
      const sessionStr = localStorage.getItem('golang_session')
      if (sessionStr) {
        const session = JSON.parse(sessionStr)
        session.user = updatedUser
        localStorage.setItem('golang_session', JSON.stringify(session))
      }
    } catch (err) {
      console.error('Failed to update session in localStorage:', err)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    error,
    logout,
    refreshSession,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a GolangAuthProvider')
  }
  return context
}