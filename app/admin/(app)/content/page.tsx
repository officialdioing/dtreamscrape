'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/src/lib/utils'
import {
  ADVANCED_CONTENT_PAGE,
  CONTENT_PAGES,
  type ContentPageConfig,
} from '@/src/admin/content/content-dashboard'

function toneClasses(tone: string) {
  switch (tone) {
    case 'violet':
      return 'bg-violet-50 text-violet-700 ring-violet-200'
    case 'sky':
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 'amber':
      return 'bg-amber-50 text-amber-800 ring-amber-200'
    case 'rose':
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 'teal':
      return 'bg-teal-50 text-teal-700 ring-teal-200'
    case 'cyan':
      return 'bg-cyan-50 text-cyan-700 ring-cyan-200'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200'
  }
}

function PageCard({ page }: { page: ContentPageConfig }) {
  const router = useRouter()
  const Icon = page.icon
  const previewSections = page.sections.slice(0, 4)
  const remainingCount = Math.max(page.sections.length - previewSections.length, 0)

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_rgba(64,21,63,0.08)]"
      onClick={() => router.push(`/admin/content/${page.id}`)}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition-transform group-hover:scale-[1.02]',
              toneClasses(page.tone)
            )}
          >
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-foreground sm:text-lg">
                  {page.label}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {page.description}
                </div>
              </div>
              <ChevronRight size={18} className="flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset',
                  toneClasses(page.tone)
                )}
              >
                Easy editor
              </span>
              {previewSections.map((section) => (
                <span
                  key={section.id}
                  className="inline-flex rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {section.label}
                </span>
              ))}
              {remainingCount > 0 ? (
                <span className="inline-flex rounded-full border border-dashed border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  +{remainingCount} more
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContentRoute() {
  const router = useRouter()

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(64,21,63,0.05)_0%,rgba(201,168,76,0.06)_100%)] shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
        <CardContent className="flex flex-col gap-5 px-5 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={12} />
              Site Content
            </div>
            <div className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Parent Dashboard
            </div>
            <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Choose a page to open its child dashboard, then use the section shortcuts to jump
              straight into the content group you want to edit.
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            <div className="grid min-w-0 rounded-2xl border border-border/70 bg-background px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Pages
              </span>
              <span className="mt-1 text-lg font-semibold text-foreground">
                {CONTENT_PAGES.length}
              </span>
            </div>
            <div className="grid min-w-0 rounded-2xl border border-border/70 bg-background px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Editors
              </span>
              <span className="mt-1 text-lg font-semibold text-foreground">
                {CONTENT_PAGES.length}
              </span>
            </div>
            <div className="grid min-w-0 rounded-2xl border border-border/70 bg-background px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Advanced
              </span>
              <span className="mt-1 text-lg font-semibold text-foreground">
                1
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CONTENT_PAGES.map((page) => (
          <PageCard key={page.id} page={page} />
        ))}

        <Card
          className="cursor-pointer overflow-hidden border-dashed border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/20 hover:shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          onClick={() => router.push('/admin/content/advanced')}
        >
          <CardContent className="flex h-full flex-col justify-between p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
                <ADVANCED_CONTENT_PAGE.icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-base font-semibold text-foreground sm:text-lg">
                    {ADVANCED_CONTENT_PAGE.label}
                  </div>
                  <ChevronRight size={18} className="flex-shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {ADVANCED_CONTENT_PAGE.description}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 ring-1 ring-inset ring-slate-200">
                For advanced users
              </span>
              <span className="inline-flex rounded-full border border-dashed border-border/80 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Table view
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

