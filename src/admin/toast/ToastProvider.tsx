'use client'

import * as React from 'react'
import { toast as sonnerToast } from 'sonner'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = React.useCallback((input: ToastInput) => {
    const options = {
      description: input.description,
      duration: input.duration ?? 2600,
    }

    switch (input.variant ?? 'info') {
      case 'success':
        sonnerToast.success(input.title, options)
        break
      case 'error':
        sonnerToast.error(input.title, options)
        break
      case 'warning':
        sonnerToast.warning(input.title, options)
        break
      case 'info':
      default:
        sonnerToast(input.title, options)
        break
    }
  }, [])

  return <ToastContext.Provider value={{ toast }}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (ctx) return ctx

  return {
    toast: (input: ToastInput) => {
      if (typeof window !== 'undefined') {
        console.warn('[admin toast] ToastProvider missing:', input)
      }
    },
  }
}
