'use client'

import * as React from 'react'
import { ChevronDown, Pencil, Plus, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/src/lib/utils'

type PreviewSection = {
  id: string
  label: string
  description: string
  count: number
  firstItemId: string
}

export function ContentPreviewRail({
  page,
  title,
  description,
  sections,
}: {
  page: string
  title: string
  description: string
  sections: PreviewSection[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:bottom-auto sm:right-4 sm:top-24 sm:w-[320px]">
      <Card className="overflow-hidden border-border/70 bg-background/95 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur">
        <CardContent className="p-0">
          <div className="border-b border-border/70 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Sparkles size={12} />
                  Admin edit mode
                </div>
                <div className="mt-3 font-serif text-xl font-semibold text-foreground">
                  {title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
                <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
              </Button>
            </div>
          </div>

          {open ? (
            <div className="max-h-[55vh] overflow-auto p-4">
              <div className="space-y-2">
                {sections.map((section) => {
                  const hasItems = Boolean(section.firstItemId)
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          hasItems
                            ? `/admin/content/${page}/${section.firstItemId}/edit`
                            : `/admin/content/${page}/new?section=${encodeURIComponent(section.id)}`
                        )
                      }
                      className="group flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-background px-3 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div
                        className={cn(
                          'mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset',
                          hasItems ? 'bg-primary/10 text-primary ring-primary/15' : 'bg-amber-50 text-amber-800 ring-amber-200'
                        )}
                      >
                        <Pencil size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {section.label}
                          </div>
                          <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            {section.count}
                          </span>
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {section.description}
                        </div>
                        <div className="mt-2 inline-flex rounded-full border border-border/70 bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
                          {hasItems ? 'Edit section' : 'Create first item'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/content')}
                  className="justify-start"
                >
                  <Plus size={16} />
                  Back to Content Hub
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  )
}

