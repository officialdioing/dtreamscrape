'use client'

import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useServices } from '../providers/ServicesProvider'

export function ServicesPreviewPage() {
  const router = useRouter()
  const params = useParams()
  const id = ((params?.id as string) || '').trim().replace(/\s+/g, '')
  const { services } = useServices()
  const [service, setService] = React.useState<any | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    const fromStore = services.find((s: any) => s.id === id || s.slug === id)
    if (fromStore) {
      setService(fromStore)
      return
    }
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/services/${id}`, { cache: 'no-store' })
        const json = await res.json()
        if (res.ok && json?.item) setService(json.item)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [id, services])

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
  if (!service) return <div className="p-8 text-sm text-muted-foreground">Service not found.</div>

  const routeId = service.slug || service.id
  const listItems: string[] = Array.isArray(service.list_items) ? service.list_items : []

  return (
    <div className="min-h-screen -m-8 bg-background">
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/75 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/services/${routeId}/edit`)}
          >
            <ArrowLeft size={16} />
            Back to Editor
          </Button>
          <div className="text-sm text-muted-foreground">Preview</div>
        </div>
      </div>

      <section className="bg-muted/10 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {service.category || 'Service'}
              </div>
              <div className="mt-4 font-serif text-3xl font-semibold text-foreground md:text-4xl">
                {service.title}
              </div>
              {service.subtitle ? (
                <div className="mt-3 text-lg text-muted-foreground">
                  {service.subtitle}
                </div>
              ) : null}
              <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </div>

              {listItems.length ? (
                <div className="mt-8">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Planning Options (Preview)
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {listItems.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-10">
                <a
                  href={service.cta_link || '/consultation-editorial'}
                  className="inline-flex items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  {service.cta_text || 'Start Planning'}
                </a>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    service.image ||
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'
                  }
                  alt={service.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
