'use client'

import * as React from 'react'
import { ArrowLeft, Layers3, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { DataTable, StatusBadge } from '@/src/admin/components/shared'
import {
  ADVANCED_CONTENT_PAGE,
  CONTENT_PAGES,
  getContentPageConfig,
  type ContentPageConfig,
  type ContentSectionConfig,
} from '@/src/admin/content/content-dashboard'
import { cn } from '@/src/lib/utils'

type ContentItem = {
  id: string
  page: string
  section: string
  content_key: string
  content_type: string
  content: string | null
  content_json: any
  display_order: number
  is_active: boolean
  updated_at: string
}

function pagePill(page: string) {
  switch (page) {
    case 'home':
      return 'bg-primary/10 text-primary ring-primary/20'
    case 'about':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'services':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'contact':
      return 'bg-primary/10 text-primary ring-primary/20'
    case 'love_notes':
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 'consultation':
      return 'bg-teal-50 text-teal-700 ring-teal-200'
    case 'consultation_editorial':
      return 'bg-cyan-50 text-cyan-700 ring-cyan-200'
    case 'faq':
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    default:
      return 'bg-muted text-foreground/80 ring-border'
  }
}

function typePill(type: string) {
  switch (type) {
    case 'image':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'richtext':
      return 'bg-primary/10 text-primary ring-primary/20'
    case 'json':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'number':
      return 'bg-primary/10 text-primary ring-primary/20'
    case 'text':
    default:
      return 'bg-muted text-foreground/80 ring-border'
  }
}

function formatContentValue(item: ContentItem) {
  if (item.content_type === 'json') {
    const json = item.content_json
    if (Array.isArray(json)) return `Array (${json.length} items)`
    if (json && typeof json === 'object') {
      const keys = Object.keys(json)
      if (keys.length <= 3) {
        return keys
          .map((k) => `${k}: ${JSON.stringify(json[k]).slice(0, 30)}…`)
          .join(', ')
      }
      return `Object (${keys.length} keys)`
    }
    return `${JSON.stringify(json).slice(0, 50)}…`
  }

  const value = item.content || ''
  return value.slice(0, 60) + (value.length > 60 ? '…' : '')
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function splitAdvancedSectionKey(key: string) {
  const orderedPages = [...CONTENT_PAGES.map((item) => item.id)].sort(
    (a, b) => b.length - a.length
  )

  for (const pageId of orderedPages) {
    const prefix = `${pageId}_`
    if (key.startsWith(prefix)) {
      return {
        pageId,
        sectionId: key.slice(prefix.length),
      }
    }
  }

  const [pageId, ...rest] = key.split('_')
  return {
    pageId,
    sectionId: rest.join('_'),
  }
}

export function ContentListPage({ page }: { page: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeSection, setActiveSection] = React.useState<string>('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const pageConfig = React.useMemo<ContentPageConfig | undefined>(
    () => (page ? getContentPageConfig(page) : undefined),
    [page]
  )
  const requestedSection = searchParams.get('section') ?? ''

  const fetchContent = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const url = page ? `/api/admin/content?page=${page}` : '/api/admin/content'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || 'Failed to load content')
      setItems(json.items || [])
    } catch (error: any) {
      toast({
        title: 'Failed to load content',
        description: error?.message,
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, toast])

  React.useEffect(() => {
    void fetchContent()
  }, [fetchContent])

  const sections = React.useMemo(() => {
    const grouped: Record<string, ContentItem[]> = {}
    for (const item of items) {
      const key = page ? item.section : `${item.page}_${item.section}`
      grouped[key] ||= []
      grouped[key].push(item)
    }
    Object.keys(grouped).forEach((k) =>
      grouped[k].sort((a, b) => a.display_order - b.display_order)
    )
    return grouped
  }, [items, page])

  const sectionKeys = React.useMemo(() => Object.keys(sections).sort(), [sections])

  React.useEffect(() => {
    if (!sectionKeys.length) {
      setActiveSection('')
      return
    }

    if (requestedSection && sectionKeys.includes(requestedSection)) {
      setActiveSection(requestedSection)
      return
    }

    setActiveSection((prev) => (prev && sectionKeys.includes(prev) ? prev : sectionKeys[0]))
  }, [requestedSection, sectionKeys])

  const getSectionLabel = (key: string) => {
    const configLabel = pageConfig?.sections.find((section) => section.id === key)?.label
    if (configLabel) return configLabel

    if (!page) {
      const { pageId, sectionId } = splitAdvancedSectionKey(key)
      return `${titleCase(pageId)} - ${titleCase(sectionId)}`
    }
    return titleCase(key)
  }

  const pageTitle = pageConfig?.label || (page ? titleCase(page) : ADVANCED_CONTENT_PAGE.label)
  const pageDescription = pageConfig?.description || ADVANCED_CONTENT_PAGE.description
  const activeSectionLabel = activeSection ? getSectionLabel(activeSection) : 'All sections'
  const activeCount = items.filter((item) => item.is_active).length
  const sectionConfigs = pageConfig?.sections ?? []
  const quickAccessSections = React.useMemo(
    () => {
      const knownSections = new Set(sectionConfigs.map((section) => section.id))
      const extraSections = sectionKeys
        .filter((key) => !knownSections.has(key))
        .map((key) => ({
          id: key,
          label: getSectionLabel(key),
          description: 'Open this section in the editor.',
          icon: Sparkles,
        }))

      return sectionConfigs.length ? [...sectionConfigs, ...extraSections] : extraSections
    },
    [getSectionLabel, sectionConfigs, sectionKeys]
  )

  const activeTabId =
    activeSection && sectionKeys.includes(activeSection) ? activeSection : sectionKeys[0] || ''
  const createSectionTarget = activeSection && (
    pageConfig?.sections.some((section) => section.id === activeSection) ||
    sectionKeys.includes(activeSection)
  )
    ? activeSection
    : pageConfig?.sections[0]?.id || sectionKeys[0] || ''
  const sectionSearchQuery = searchQuery.trim().toLowerCase()
  const filteredQuickAccessSections = React.useMemo(() => {
    if (!sectionSearchQuery) return quickAccessSections

    return quickAccessSections.filter((section) => {
      const haystack = `${section.id} ${section.label} ${section.description}`.toLowerCase()
      return haystack.includes(sectionSearchQuery)
    })
  }, [quickAccessSections, sectionSearchQuery])

  const openSectionShortcut = (sectionId: string) => {
    const itemsInSection = sections[sectionId] || []
    const firstItem = itemsInSection[0]

    if (firstItem) {
      router.push(`/admin/content/${page}/${firstItem.id}/edit`)
      return
    }

    router.push(`/admin/content/${page}/new?section=${encodeURIComponent(sectionId)}`)
  }

  const handleBulkDelete = async (selectedItems: ContentItem[]) => {
    if (!window.confirm(`Delete ${selectedItems.length} selected ${selectedItems.length === 1 ? 'item' : 'items'}?`)) return

    try {
      await Promise.all(
        selectedItems.map((item) =>
          fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' }).then(async (res) => {
            const json = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(json.error || 'Failed to delete content')
            return json
          })
        )
      )
      toast({
        title: `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} deleted`,
        variant: 'success',
        duration: 2500,
      })
      setSelectedIds(new Set())
      void fetchContent()
    } catch (error) {
      toast({
        title: 'Failed to delete content',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    }
  }

  const handleSectionChange = (value: string) => {
    setActiveSection(value)

    if (!page) return

    router.replace(`${pathname}?section=${encodeURIComponent(value)}`, { scroll: false })
  }

  const renderSectionShortcutCard = (section: ContentSectionConfig & { id: string }) => {
    const count = sections[section.id]?.length || 0
    const isActive = activeSection === section.id
    const hasItems = count > 0

    return (
      <Card
        key={section.id}
        className={cn(
          'group cursor-pointer overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_50px_rgba(64,21,63,0.08)]',
          isActive && 'border-primary/25 bg-primary/5'
        )}
        onClick={() => openSectionShortcut(section.id)}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition-transform group-hover:scale-[1.02]',
                hasItems ? 'bg-primary/10 text-primary ring-primary/15' : 'bg-muted text-muted-foreground ring-border'
              )}
            >
              <section.icon size={16} />
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
              <div className="mt-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset',
                    hasItems
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-amber-50 text-amber-800 ring-amber-200'
                  )}
                >
                  {hasItems ? 'Edit section' : 'Create first item'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTable = (sectionKey: string, sectionItems: ContentItem[]) => {
    const filteredItems = sectionItems.filter((item) =>
      item.content_key.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const columns: any[] = []

    if (!page) {
      columns.push({
        key: 'page',
        header: 'Page',
        cell: (item: ContentItem) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
              pagePill(item.page)
            )}
          >
            {item.page}
          </span>
        ),
      })
    }

    columns.push(
      {
        key: 'section',
        header: 'Section',
        cell: (item: ContentItem) => (
          <span className="text-sm capitalize text-muted-foreground">
            {item.section}
          </span>
        ),
      },
      {
        key: 'content_key',
        header: 'Content Key',
        cell: (item: ContentItem) => (
          <span className="font-mono text-sm font-semibold">
            {item.content_key}
          </span>
        ),
      },
      {
        key: 'content_type',
        header: 'Type',
        cell: (item: ContentItem) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
              typePill(item.content_type)
            )}
          >
            {item.content_type}
          </span>
        ),
      },
      {
        key: 'value',
        header: 'Value',
        cell: (item: ContentItem) => (
          <span className="block max-w-[360px] truncate text-sm text-muted-foreground">
            {formatContentValue(item)}
          </span>
        ),
      },
      {
        key: 'order',
        header: 'Order',
        cell: (item: ContentItem) => item.display_order,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (item: ContentItem) => (
          <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
        ),
      },
    )

    return (
      <DataTable
        className="rounded-none border-0 shadow-none"
        data={filteredItems}
        columns={columns}
        keyExtractor={(item: ContentItem) => item.id}
        emptyMessage={searchQuery ? 'No matching content found.' : 'No items in this section.'}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(item: ContentItem) =>
          router.push(`/admin/content/${page || item.page}/${item.id}/edit`)
        }
        bulkActions={(selectedItems) => (
          <Button variant="destructive" size="sm" onClick={() => handleBulkDelete(selectedItems)}>
            Delete {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
          </Button>
        )}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(64,21,63,0.04)_0%,rgba(201,168,76,0.05)_100%)] p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
        <CardContent className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={12} />
              {pageConfig ? 'Child Dashboard' : 'Advanced View'}
            </div>
            <div className="mt-3 font-serif text-3xl font-semibold text-foreground">
              {pageTitle}
            </div>
            <div className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {pageDescription}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pageConfig ? (
              <Button
                variant="outline"
                onClick={() => router.push('/admin/content')}
                className="h-10 rounded-xl"
              >
                <ArrowLeft size={16} />
                Parent Dashboard
              </Button>
            ) : null}
            <div className="grid min-w-[110px] rounded-2xl border border-border/70 bg-background px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Items
              </span>
              <span className="mt-1 text-lg font-semibold text-foreground">
                {items.length}
              </span>
            </div>
            <div className="grid min-w-[110px] rounded-2xl border border-border/70 bg-background px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Active
              </span>
              <span className="mt-1 text-lg font-semibold text-foreground">
                {activeCount}
              </span>
            </div>
            <div className="grid min-w-[120px] rounded-2xl border border-border/70 bg-background px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sections
              </span>
              <span className="mt-1 text-lg font-semibold text-foreground">
                {sectionKeys.length}
              </span>
            </div>
          </div>
        </CardContent>

        <CardContent className="flex flex-col gap-3 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5">
              <Layers3 size={14} />
              {pageConfig ? (
                <>
                  Sections: <span className="font-semibold text-foreground">{filteredQuickAccessSections.length} visible</span>
                </>
              ) : (
                <>
                  Section: <span className="font-semibold text-foreground">{activeSectionLabel}</span>
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5">
              {pageConfig
                ? `${filteredQuickAccessSections.length} matching sections`
                : `${sections[activeSection]?.length || 0} matching items`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchContent}
              disabled={isLoading}
              className="h-10 rounded-xl"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              onClick={() =>
                router.push(
                  page
                    ? `/admin/content/${page}/new${createSectionTarget ? `?section=${encodeURIComponent(createSectionTarget)}` : ''}`
                    : '/admin/content/home/new'
                )
              }
              className="h-10 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus size={16} />
              Add Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {pageConfig ? (
        <Card className="overflow-hidden border-border/70 bg-background p-0 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <CardContent className="border-b border-border/70 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">Quick Access</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Jump straight to the editor for each section.
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {filteredQuickAccessSections.length} shortcuts
              </div>
            </div>

            <div className="relative mt-4 max-w-xl">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search sections…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full pl-9"
              />
            </div>
          </CardContent>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
            {filteredQuickAccessSections.map((section) =>
              renderSectionShortcutCard(section as ContentSectionConfig)
            )}
          </div>
        </Card>
      ) : null}

      {!pageConfig ? (
        <Card className="overflow-hidden border-border/70 bg-background p-0 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          {sectionKeys.length > 0 ? (
          <Tabs value={activeTabId} onValueChange={handleSectionChange} className="gap-0">
            <div className="border-b border-border/70 bg-muted/20 px-4 pt-4 sm:px-6">
              <TabsList
                variant="line"
                className="h-auto w-full flex-wrap justify-start gap-8 bg-transparent p-0"
              >
                {sectionKeys.map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="h-9 rounded-full border border-transparent px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground data-[state=active]:border-primary/15 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    {getSectionLabel(key)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {sectionKeys.map((key) => (
              <TabsContent key={key} value={key} className="p-0">
                <div className="flex flex-col gap-3 border-b border-border/70 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-sm text-muted-foreground">
                    Viewing section{' '}
                    <span className="font-semibold text-foreground">
                      {getSectionLabel(key)}
                    </span>
                    {' '}with{' '}
                    <span className="font-semibold text-foreground">
                      {sections[key]?.length || 0}
                    </span>{' '}
                    entries
                  </div>
                  <div className="relative w-full sm:w-[300px]">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search keys…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 rounded-full pl-9"
                    />
                  </div>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
                      <Spinner className="size-5 text-primary" />
                      <div className="text-sm font-medium text-gray-700">Loading…</div>
                    </div>
                  </div>
                ) : (
                  renderTable(key, sections[key])
                )}
              </TabsContent>
            ))}
          </Tabs>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center p-12 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border bg-muted text-primary">
                  <Layers3 size={24} />
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  No content sections found for this page yet.
                </div>
                {page ? (
                  <div className="mt-4">
                    <Button
                      onClick={() =>
                        router.push(
                          pageConfig?.sections?.length
                            ? `/admin/content/${page}/new?section=${encodeURIComponent(pageConfig.sections[0].id)}`
                            : `/admin/content/${page}/new`
                        )
                      }
                      className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus size={16} />
                      Add First Content Item
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}
