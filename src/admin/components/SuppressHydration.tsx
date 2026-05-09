'use client'

import { useEffect } from 'react'

/**
 * Component to suppress hydration warnings caused by browser extensions
 * Place this at the root of your app to ignore hydration mismatches
 */
export function SuppressHydrationWarnings({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalWarn = console.warn
    const originalError = console.error

    const shouldSuppress = (message: string) =>
      message.includes('hydration') ||
      message.includes('Hydration') ||
      message.includes('text content did not match') ||
      message.includes('bis_skin_checked')

    console.warn = (...args) => {
      const message = args[0]?.toString?.() || ''
      if (shouldSuppress(message)) return
      originalWarn.apply(console, args as any)
    }

    console.error = (...args) => {
      const message = args[0]?.toString?.() || ''
      if (shouldSuppress(message)) return
      originalError.apply(console, args as any)
    }

    return () => {
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  return <>{children}</>
}
