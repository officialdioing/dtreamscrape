'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Image as ImageIcon,
  Layout as LayoutIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ADVANCED_CONTENT_PAGE,
  CONTENT_PAGES,
} from '@/src/admin/content/content-dashboard'
import { cn } from '@/src/lib/utils'

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Services', path: '/admin/services', icon: Briefcase },
  { name: 'Blog Posts', path: '/admin/blog', icon: FileText },
  { name: 'Bookings', path: '/admin/booking-management', icon: CalendarClock },
  { name: 'Media', path: '/admin/media', icon: ImageIcon },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
] as const

const CONTENT_NAV_ITEMS = [
  { name: 'Content Hub', path: '/admin/content', icon: LayoutIcon },
  ...CONTENT_PAGES.map((page) => ({
    name: page.label,
    path: `/admin/content/${page.id}`,
    icon: page.icon,
  })),
  {
    name: ADVANCED_CONTENT_PAGE.label,
    path: '/admin/content/advanced',
    icon: ADVANCED_CONTENT_PAGE.icon,
  },
] as const

function isRouteActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

function isChildRouteActive(pathname: string, path: string) {
  return path === '/admin/content' ? pathname === path : isRouteActive(pathname, path)
}

function SidebarNavLink({
  href,
  active,
  icon: Icon,
  children,
  onClick,
  title,
  compact = false,
}: {
  href: string
  active: boolean
  icon: React.ComponentType<{ size?: number }>
  children: React.ReactNode
  onClick?: () => void
  title?: string
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition',
        compact ? 'min-h-11' : 'min-h-12',
        active
          ? 'border-primary/20 bg-[linear-gradient(135deg,rgba(64,21,63,0.14)_0%,rgba(201,168,76,0.12)_100%)] text-primary shadow-[0_12px_30px_rgba(64,21,63,0.08)]'
          : 'border-transparent text-foreground/80 hover:border-border/70 hover:bg-muted hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-lg transition',
          compact ? 'h-8 w-8' : 'h-[34px] w-[34px]',
          active
            ? 'bg-background/90 text-primary ring-1 ring-inset ring-primary/15'
            : 'bg-muted text-foreground/80 group-hover:text-primary'
        )}
      >
        <Icon size={compact ? 16 : 18} />
      </span>
      <span className={cn('min-w-0 flex-1 truncate text-left', compact ? 'text-[0.8rem]' : 'text-sm')}>
        {children}
      </span>
      {active ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_rgba(64,21,63,0.08)]" /> : null}
    </Link>
  )
}

interface SidebarProps {
  onLogout: () => void
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  onLogout,
  isCollapsed = false,
  onToggleCollapsed,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname()
  const [isContentGroupOpen, setIsContentGroupOpen] = React.useState(pathname.startsWith('/admin/content'))

  React.useEffect(() => {
    if (pathname.startsWith('/admin/content')) {
      setIsContentGroupOpen(true)
    }
  }, [pathname])

  const isContentActive = pathname.startsWith('/admin/content')

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[280px] flex-col border-r border-border/70 bg-background/95 shadow-xl backdrop-blur-md md:hidden transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative border-b border-border/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Image
                src="/logo-brand.png"
                alt="Dreamscape"
                width={148}
                height={48}
                className="h-auto w-[148px] max-w-full object-contain"
                priority
              />
            </div>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onCloseMobile}
              className="lg:hidden -mr-2 ml-2 inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = isRouteActive(pathname, item.path) || (item.path === '/admin/blog' && pathname.startsWith('/admin/blog/'))
            const Icon = item.icon

            return (
              <SidebarNavLink
                key={item.name}
                href={item.path}
                active={isActive}
                icon={Icon}
                onClick={onCloseMobile}
              >
                {item.name}
              </SidebarNavLink>
            )
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsContentGroupOpen((prev) => !prev)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition min-h-12',
                isContentActive
                  ? 'border-primary/20 bg-[linear-gradient(135deg,rgba(64,21,63,0.14)_0%,rgba(201,168,76,0.12)_100%)] text-primary shadow-[0_12px_30px_rgba(64,21,63,0.08)]'
                  : 'border-transparent text-foreground/80 hover:border-border/70 hover:bg-muted hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'grid h-[34px] w-[34px] place-items-center rounded-lg transition',
                  isContentActive
                    ? 'bg-background/90 text-primary ring-1 ring-inset ring-primary/15'
                    : 'bg-muted text-foreground/80 group-hover:text-primary'
                )}
              >
                <LayoutIcon size={18} />
              </span>
              <span className="flex-1 truncate text-left">Site Content</span>
              {isContentActive ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_rgba(64,21,63,0.08)]" /> : null}
              <ChevronDown size={16} className={cn('shrink-0 transition-transform duration-200', isContentGroupOpen && 'rotate-180')} />
            </button>

            {isContentGroupOpen ? (
              <div className="mt-1 space-y-1 pl-3">
                {CONTENT_NAV_ITEMS.map((item) => {
                  const isActive = isChildRouteActive(pathname, item.path)
                  const Icon = item.icon

                  return (
                    <SidebarNavLink
                      key={item.name}
                      href={item.path}
                      active={isActive}
                      icon={Icon}
                      onClick={onCloseMobile}
                      compact
                    >
                      {item.name}
                    </SidebarNavLink>
                  )
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="p-4">
          <div className="mb-4 h-px w-full bg-border/70" />
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-3 rounded-xl bg-muted text-foreground/80 hover:bg-destructive/10 hover:text-destructive min-h-12"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Log Out
          </Button>
        </div>
      </aside>

      <aside
        className={cn(
          'fixed left-0 top-0 z-20 hidden md:flex h-screen flex-col border-r border-border/70 bg-background/90 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur',
          isCollapsed ? 'w-20' : 'w-[260px]'
        )}
      >
        <div
          className={cn(
            'relative flex h-[96px] items-center border-b border-border/70 px-6',
            isCollapsed && 'px-4'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Image
                src={isCollapsed ? '/logo.png' : '/logo-brand.png'}
                alt="Dreamscape"
                width={isCollapsed ? 42 : 148}
                height={isCollapsed ? 42 : 48}
                className={cn(
                  'h-auto object-contain',
                  isCollapsed ? 'w-10' : 'w-[148px] max-w-full'
                )}
                priority
              />
            </div>
          </div>

          <button
            type="button"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleCollapsed}
            disabled={!onToggleCollapsed}
            className="absolute right-[-14px] top-[88px] grid h-8 w-8 place-items-center rounded-full border border-border bg-background shadow-[0_10px_20px_rgba(15,23,42,0.12)] transition hover:bg-muted disabled:opacity-60 dark:bg-card"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = isRouteActive(pathname, item.path) || (item.path === '/admin/blog' && pathname.startsWith('/admin/blog/'))
            const Icon = item.icon

            return (
              <SidebarNavLink
                key={item.name}
                href={item.path}
                active={isActive}
                icon={Icon}
                title={isCollapsed ? item.name : undefined}
                compact
              >
                {!isCollapsed ? item.name : ''}
              </SidebarNavLink>
            )
          })}

          {!isCollapsed ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsContentGroupOpen((prev) => !prev)}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition',
                  isContentActive
                    ? 'border-primary/20 bg-[linear-gradient(135deg,rgba(64,21,63,0.14)_0%,rgba(201,168,76,0.12)_100%)] text-primary shadow-[0_12px_30px_rgba(64,21,63,0.08)]'
                    : 'border-transparent text-foreground/80 hover:border-border/70 hover:bg-muted hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'grid h-[34px] w-[34px] place-items-center rounded-lg transition',
                    isContentActive
                      ? 'bg-background/90 text-primary ring-1 ring-inset ring-primary/15'
                      : 'bg-muted text-foreground/80 group-hover:text-primary'
                  )}
                >
                  <LayoutIcon size={18} />
                </span>
                <span className="flex-1 truncate text-left">Site Content</span>
                {isContentActive ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_rgba(64,21,63,0.08)]" /> : null}
                <ChevronDown size={16} className={cn('shrink-0 transition-transform duration-200', isContentGroupOpen && 'rotate-180')} />
              </button>

              {isContentGroupOpen ? (
                <div className="mt-1 space-y-1 pl-3">
                  {CONTENT_NAV_ITEMS.map((item) => {
                    const isActive = isChildRouteActive(pathname, item.path)
                    const Icon = item.icon

                    return (
                      <SidebarNavLink
                        key={item.name}
                        href={item.path}
                        active={isActive}
                        icon={Icon}
                        title={item.name}
                        compact
                      >
                        {item.name}
                      </SidebarNavLink>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="p-4">
          <div className="mb-4 h-px w-full bg-border/70" />
          <Button
            type="button"
            variant="secondary"
            className={cn(
              'w-full justify-start gap-3 rounded-xl bg-muted text-foreground/80 hover:bg-destructive/10 hover:text-destructive',
              isCollapsed && 'justify-center'
            )}
            onClick={onLogout}
            title={isCollapsed ? 'Log Out' : undefined}
          >
            <LogOut size={18} />
            {!isCollapsed ? 'Log Out' : null}
          </Button>
        </div>
      </aside>
    </>
  )
}
