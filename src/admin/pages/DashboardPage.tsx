'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Calendar,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '../components/StatCard'
import { formatAdminDate } from '@/src/admin/utils/formatDate'
import { StatusBadge } from '../components/shared'
import { DataTable } from '../components/shared'
import { useInquiries } from '@/src/admin/providers/InquiriesProvider'
import { useEvents } from '@/src/admin/providers/EventsProvider'
import { useBlogPosts } from '@/src/admin/providers/BlogPostsProvider'
import { useMedia } from '@/src/admin/providers/MediaProvider'
import { useToast } from '@/src/admin/toast/ToastProvider'

export function DashboardPage() {
  const router = useRouter()
  const { inquiries, refresh: refreshInquiries } = useInquiries()
  const { events, refresh: refreshEvents } = useEvents()
  const { posts, refresh: refreshPosts } = useBlogPosts()
  const { media, refresh: refreshMedia } = useMedia()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refreshInquiries(),
        refreshEvents(),
        refreshPosts(),
        refreshMedia(),
      ])
      toast({ title: 'Dashboard refreshed', variant: 'success', duration: 1500 })
    } catch (error) {
      toast({
        title: 'Failed to refresh',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const recentInquiries = (Array.isArray(inquiries) ? inquiries : []).slice(0, 5)
  const [now, setNow] = React.useState<Date | null>(null)

  React.useEffect(() => {
    setNow(new Date())
  }, [])

  const upcomingEvents = React.useMemo(() => {
    const cutoff = now ?? new Date(0)
    const list = Array.isArray(events) ? events : []
    return list
      .filter((e: any) => {
        const date = e?.event_date || e?.date
        if (!date) return false
        const parsed = new Date(date)
        return Number.isFinite(parsed.getTime()) && parsed > cutoff
      })
      .slice(0, 3)
      .map((e: any) => ({
        id: String(e?.id || ''),
        title: String(e?.title || ''),
        date: String(e?.event_date || e?.date || ''),
        category: String(e?.event_type || e?.category || ''),
        image: String(e?.featured_image || e?.image || ''),
      }))
  }, [events, now])

  const inquiryColumns = [
    {
      key: 'name',
      header: 'Name',
      cell: (inquiry: any) => <div className="font-medium">{inquiry.name}</div>,
    },
    {
      key: 'eventType',
      header: 'Event Type',
      cell: (inquiry: any) => inquiry.eventType,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (inquiry: any) => formatAdminDate(inquiry.date),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inquiry: any) => <StatusBadge status={inquiry.status} />,
    },
    {
      key: 'open',
      header: '',
      className: 'text-right',
      cell: (inquiry: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/inquiries/${inquiry.id}/edit`)}
        >
          Open
          <ArrowUpRight size={14} />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(64,21,63,0.14)_0%,rgba(201,168,76,0.12)_100%)] text-primary">
              <Sparkles size={16} className="sm:size-[18px]" />
            </div>
            <div className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
              Dashboard
            </div>
          </div>
          <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Quick overview and recent activity.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/blog')}>
            Manage Blog
          </Button>
          <Button size="sm" onClick={() => router.push('/admin/events/new')}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Event</span>
            <span className="sm:hidden">Event</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={Array.isArray(events) ? events.length : 0}
          icon={Calendar}
        />
        <StatCard
          title="Pending Inquiries"
          value={Array.isArray(inquiries) ? inquiries.length : 0}
          icon={MessageSquare}
          helpText="Recent submissions"
        />
        <StatCard
          title="Blog Posts"
          value={Array.isArray(posts) ? posts.length : 0}
          icon={FileText}
        />
        <StatCard
          title="Media Items"
          value={Array.isArray(media) ? media.length : 0}
          icon={ImageIcon}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="border-border/70 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2 sm:gap-4">
            <div>
              <CardTitle className="font-serif text-base sm:text-lg">Recent Inquiries</CardTitle>
            </div>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => router.push('/admin/inquiries')}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={recentInquiries}
              columns={inquiryColumns}
              keyExtractor={(inquiry) => inquiry.id}
              className="border-none shadow-none"
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex-row items-center justify-between gap-2 sm:gap-4">
            <CardTitle className="font-serif text-base sm:text-lg">Upcoming Events</CardTitle>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => router.push('/admin/events')}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs sm:text-sm font-semibold">
                      {event.title}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatAdminDate(event.date)}
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2 py-1 text-[0.65rem] sm:text-[0.7rem] font-semibold text-primary flex-shrink-0">
                    {event.category}
                  </span>
                </div>
              ))}
            </div>

            <Separator />
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/admin/events/new')}>
              Add event
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
