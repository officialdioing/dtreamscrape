'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Bell, LayoutGrid, LogOut, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useAuth } from '@/src/admin/providers/GolangAuthProvider'
import { ThemeToggle } from './ThemeToggle'

function getPageTitle(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const section = segments[1] || 'dashboard'
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    events: 'Events',
    services: 'Services',
    blog: 'Blog',
    inquiries: 'Inquiries',
    media: 'Media',
    content: 'Site Content',
    settings: 'Settings',
    users: 'Users',
  }
  return labels[section] || section.charAt(0).toUpperCase() + section.slice(1)
}

interface TopBarProps {
  onMobileMenuToggle?: () => void
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const pageTitle = getPageTitle(pathname)

  // Get first name from metadata first, then fallback to user property
  const firstName = user?.metadata?.first_name || user?.first_name
  const lastName = user?.metadata?.last_name || user?.last_name

  const userName = firstName && lastName
    ? `${firstName} ${lastName}`
    : user?.email?.split('@')[0] || 'Admin'

  const greetingName = firstName?.trim() || 'there'
  const userEmail = user?.email || 'admin@dreamscape.com'
  const userInitials = React.useMemo(() => {
    const names = [firstName, lastName].filter(Boolean) as string[]
    if (names.length) {
      return names
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    }

    return userEmail.slice(0, 2).toUpperCase()
  }, [firstName, lastName, userEmail])

  const handleLogout = async () => {
    try {
      await logout()
      toast({ title: 'Logged out', variant: 'success', duration: 2000 })
    } catch {
      toast({ title: 'Error logging out', variant: 'error', duration: 3000 })
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-[96px] items-center gap-3 px-4 sm:px-5 md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            className="flex-shrink-0 rounded-full text-foreground hover:bg-muted md:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu size={20} />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden md:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-pink/10 text-brand-pink">
              <LayoutGrid size={18} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-lg font-semibold text-foreground md:text-xl">
                Hi {greetingName}
              </div>
            </div>
          </div>

          <div className="relative hidden min-w-[220px] flex-1 lg:flex lg:max-w-[360px] xl:max-w-[420px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={`Search ${pageTitle.toLowerCase()}...`}
              className="h-11 rounded-full border-border/70 bg-background pl-10 pr-4 shadow-inner"
              aria-label="Search"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="h-10 w-10 rounded-full border border-border/70 bg-background text-foreground shadow-sm hover:bg-muted"
            >
              <Bell size={18} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-11 rounded-full border border-border/70 bg-background p-0 text-foreground shadow-sm hover:bg-muted"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-brand-pink/10 font-semibold text-brand-pink">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">{userName}</div>
                    <div className="text-xs text-muted-foreground">{userEmail}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </div>
    </header>
  )
}
