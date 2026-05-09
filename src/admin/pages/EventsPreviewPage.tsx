'use client'

import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useEvents } from '../providers/EventsProvider'
import { formatAdminDate } from '@/src/admin/utils/formatDate'

type ContentBlock = {
  id?: string
  type: 'text' | 'heading' | 'quote' | 'image'
  content: string
  level?: 'h2' | 'h3' | string
  caption?: string
}

export function EventsPreviewPage() {
  const router = useRouter()
  const params = useParams()
  const id = ((params?.id as string) || '').trim().replace(/\s+/g, '')
  const { events } = useEvents()
  const [event, setEvent] = React.useState<any | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    const fromStore = events.find((e: any) => e.id === id || e.slug === id)
    if (fromStore) {
      setEvent(fromStore)
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/events/${id}`, { cache: 'no-store' })
        const json = await res.json()
        if (res.ok && json?.item) setEvent(json.item)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [id, events])

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading preview…</div>
        </div>
      </div>
    )
  }
  if (!event) return <div className="p-8 text-sm text-muted-foreground">Event not found.</div>

  const routeId = event.slug || event.id
  const blocks: ContentBlock[] = Array.isArray(event.images) ? event.images : []

  return (
    <div className="min-h-screen -m-8 bg-background">
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/75 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/events/${routeId}/edit`)}
          >
            <ArrowLeft size={16} />
            Back to Editor
          </Button>
          <div className="text-sm text-muted-foreground">Preview</div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="font-serif text-3xl font-semibold text-foreground">
              {event.title}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {formatAdminDate(event.event_date)} •{' '}
              {event.event_type || 'Event'}
              {event.location ? ` • ${event.location}` : ''}
            </div>

            {event.featured_image ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.featured_image}
                  alt={event.title}
                  className="h-[320px] w-full object-cover"
                />
              </div>
            ) : null}

            {event.description ? (
              <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {event.description}
              </div>
            ) : null}

            <div className="mt-10 space-y-6">
              {blocks.map((b, idx) => {
                const key = b.id || `${b.type}_${idx}`
                if (b.type === 'heading') {
                  const isH3 = b.level === 'h3'
                  const Tag = (isH3 ? 'h3' : 'h2') as any
                  return (
                    <Tag
                      key={key}
                      className={isH3 ? 'text-xl font-semibold' : 'text-2xl font-semibold'}
                    >
                      {b.content}
                    </Tag>
                  )
                }
                if (b.type === 'quote') {
                  return (
                    <blockquote
                      key={key}
                      className="rounded-2xl border border-border/70 bg-muted/20 px-6 py-6 text-base italic text-foreground shadow-sm"
                    >
                      “{b.content}”
                    </blockquote>
                  )
                }
                if (b.type === 'image') {
                  return (
                    <figure key={key} className="overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.content} alt={b.caption || event.title} className="w-full object-cover" />
                      {b.caption ? (
                        <figcaption className="px-5 py-3 text-sm text-muted-foreground">
                          {b.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  )
                }
                return (
                  <p key={key} className="text-sm leading-relaxed text-foreground/90">
                    {b.content}
                  </p>
                )
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-border/70 bg-muted/15 p-5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Preview Notes
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              This preview shows the content blocks rendered as a simple story layout.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
