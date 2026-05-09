'use client'

import * as React from 'react'

export function AdminThemeCleanup() {
  React.useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.style.colorScheme = ''
    }
  }, [])

  return null
}
