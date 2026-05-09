'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * OAuth Callback Handler
 * Handles OAuth redirects from Golang backend
 */
export default function OAuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    // The Golang backend sets HTTP-only cookies during OAuth flow
    // We just need to redirect to the admin dashboard
    const timer = setTimeout(() => {
      setStatus('success')
      router.push('/admin')
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-800">Completing sign in...</h2>
            <p className="text-gray-600">Please wait while we verify your account</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-green-500 text-5xl">✓</div>
            <h2 className="text-xl font-semibold text-gray-800">Successfully signed in!</h2>
            <p className="text-gray-600">Redirecting you to the dashboard...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-red-500 text-5xl">✕</div>
            <h2 className="text-xl font-semibold text-gray-800">Authentication failed</h2>
            <p className="text-gray-600">Please try signing in again</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}