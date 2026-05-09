'use client'

import * as React from 'react'
import { ArrowLeft, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

type ContentSection = {
  id: string
  label: string
  description: string
}

type ContentItem = {
  id: string
  section: string
}

export function ContentSectionsPage({
  page,
  title,
  description,
  sections,
}: {
  page: string
  title: string
  description: string
  sections: ContentSection[]
}) {
  const router = useRouter()
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const fetchContent = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/admin/content?page=${encodeURIComponent(page)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load content')
      setItems(
        Array.isArray(json.items)
          ? json.items.map((item: any) => ({ id: item.id, section: item.section }))
          : []
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [page])

  React.useEffect(() => {
    void fetchContent()
  }, [fetchContent])

  const filteredSections = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sections

    return sections.filter((section) => {
      const haystack = `${section.id} ${section.label} ${section.description}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [sections, searchQuery])

  const getSectionCount = (sectionId: string) =>
    items.filter((item) => item.section === sectionId).length

  const openSection = (sectionId: string) => {
    router.push(`/admin/content/${page}/${sectionId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-border/70 px-5 py-5 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Spinner className="size-3.5" />
                Content Sections
              </div>

              <div className="mt-4 h-9 w-3/4 rounded-2xl bg-muted animate-pulse" />
              <div className="mt-3 h-4 w-full rounded-full bg-muted/80 animate-pulse" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-muted/60 animate-pulse" />

              <div className="mt-6 space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 rounded-xl border border-border/60 bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
                  <div className="h-8 w-64 rounded-2xl bg-muted animate-pulse" />
                  <div className="h-4 w-full rounded-full bg-muted/80 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
                  <Spinner className="size-3" />
                  Loading
                </div>
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-border/70 bg-background p-5">
                <div className="h-3 w-40 rounded-full bg-muted animate-pulse" />
                <div className="mt-3 h-4 w-3/5 rounded-full bg-muted/80 animate-pulse" />
                <div className="mt-6 space-y-3">
                  <div className="h-2.5 w-full rounded-full bg-muted/80 animate-pulse" />
                  <div className="h-2.5 w-5/6 rounded-full bg-muted/70 animate-pulse" />
                  <div className="h-2.5 w-4/5 rounded-full bg-muted/60 animate-pulse" />
                </div>
                <div className="mt-6 h-11 w-56 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <CardContent className="border-b border-border/70 px-5 py-5">
            <div className="h-4 w-44 rounded-full bg-muted animate-pulse" />
            <div className="mt-2 h-3 w-60 rounded-full bg-muted/80 animate-pulse" />
          </CardContent>
          <CardContent className="px-5 py-5">
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 rounded-2xl border border-border/60 bg-muted/25 animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(64,21,63,0.04)_0%,rgba(201,168,76,0.05)_100%)] p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
        <CardContent className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={12} />
              Content Sections
            </div>
            <div className="mt-3 font-serif text-3xl font-semibold text-foreground">{title}</div>
            <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/content')}
              className="h-10 rounded-xl"
            >
              <ArrowLeft size={16} />
              Parent Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={fetchContent}
              disabled={isRefreshing}
              className="h-10 rounded-xl"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </CardContent>

        <CardContent className="px-5 py-4 sm:px-6">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections..."
              className="h-11 rounded-full border-border/70 pl-11"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredSections.map((section) => {
          const count = getSectionCount(section.id)
          const hasItems = count > 0

          return (
            <Card
              key={section.id}
              className="group cursor-pointer overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_rgba(64,21,63,0.08)]"
              onClick={() => openSection(section.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      'grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition-transform group-hover:scale-[1.02]',
                      hasItems
                        ? 'bg-primary/10 text-primary ring-primary/15'
                        : 'bg-muted text-muted-foreground ring-border',
                    ].join(' ')}
                  >
                    <Sparkles size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-semibold text-foreground sm:text-base">
                        {section.label}
                      </div>
                      <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground">
                        {count}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {section.description}
                    </div>
                    <div className="mt-4 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset bg-background text-foreground/80">
                      {hasItems ? 'Open editor' : 'Create first item'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!filteredSections.length ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
          No matching sections found.
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          onClick={() => router.push(`/admin/content/${page}/new`)}
          className="h-10 rounded-xl"
        >
          <Plus size={16} />
          Add Item
        </Button>
      </div>
    </div>
  )
}
