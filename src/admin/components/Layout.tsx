'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/src/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

const SIDEBAR_STORAGE_KEY = 'dreamscape_admin_sidebarCollapsed'
const MOBILE_SIDEBAR_OPEN_KEY = 'dreamscape_admin_mobileSidebarOpen'
const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 80

export function Layout({ children, onLogout }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      setIsSidebarCollapsed(raw === 'true')
    } catch {
      // ignore
    }
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const toggleMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(MOBILE_SIDEBAR_OPEN_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const closeMobileSidebar = React.useCallback(() => {
    setIsMobileSidebarOpen(false)
    try {
      window.localStorage.setItem(MOBILE_SIDEBAR_OPEN_KEY, 'false')
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      <Sidebar
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          // Mobile: no margin, sidebar is overlay
          "md:ml-20",
          !isSidebarCollapsed && "md:ml-[260px]"
        )}
        suppressHydrationWarning
      >
        <TopBar onMobileMenuToggle={toggleMobileSidebar} />
        <main className="px-4 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8" suppressHydrationWarning>
          <div className="mx-auto max-w-7xl" suppressHydrationWarning>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl md:rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-5 md:p-8 text-card-foreground shadow-[0_1px_2px_rgba(16,24,40,0.06),0_20px_70px_rgba(16,24,40,0.08)] backdrop-blur"
              suppressHydrationWarning
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
