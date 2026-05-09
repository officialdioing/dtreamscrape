'use client'

import * as React from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Separator } from '@/src/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { formatAdminDateTime } from '@/src/admin/utils/formatDate'

export default function ViewContentRoute({
  paramsPromise,
}: {
  paramsPromise: Promise<{ page: string; id: string }>
}) {
  const router = useRouter()
  const [params, setParams] = React.useState<{ page: string; id: string } | null>(
    null
  )
  const [item, setItem] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const getParams = async () => {
      const p = await paramsPromise
      setParams(p)
    }
    void getParams()
  }, [paramsPromise])

  React.useEffect(() => {
    if (!params) return

    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/admin/content/${params.id}`, {
          cache: 'no-store',
        })
        const json = await res.json()

        if (!res.ok) throw new Error(json.error || 'Failed to load content')
        setItem(json.item)
      } catch (error) {
        console.error('Error loading content:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchItem()
  }, [params])

  if (isLoading || !params) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading…</div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Content not found.</div>
        <Button variant="outline" onClick={() => router.push(`/admin/content/${params.page}`)}>
          Back
        </Button>
      </div>
    )
  }

  const pageTitle = params.page.charAt(0).toUpperCase() + params.page.slice(1)

  const typePill = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-slate-50 text-slate-700 ring-slate-200'
      case 'richtext':
        return 'bg-sky-50 text-sky-800 ring-sky-200'
      case 'image':
        return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      case 'json':
        return 'bg-violet-50 text-violet-800 ring-violet-200'
      case 'number':
        return 'bg-amber-50 text-amber-900 ring-amber-200'
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-200'
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/content/${params.page}`)}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="font-serif text-2xl font-semibold text-foreground">
            {pageTitle} Content
          </div>
        </div>

        <Button onClick={() => router.push(`/admin/content/${params.page}/${params.id}/edit`)}>
          <Pencil size={16} />
          Edit
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">ID</div>
            <code className="rounded-md bg-muted px-2 py-1 text-xs">{item.id}</code>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Page</div>
              <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                {item.page}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Section</div>
              <div className="text-sm font-medium">{item.section}</div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Content Key</div>
              <code className="rounded-md bg-muted px-2 py-1 text-xs">{item.content_key}</code>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Type</div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${typePill(item.content_type)}`}>
                {item.content_type}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 text-sm text-muted-foreground">Value</div>
            {item.content_type === 'json' ? (
              <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs leading-relaxed">
                {JSON.stringify(item.content_json, null, 2)}
              </pre>
            ) : (
              <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs leading-relaxed">
                {item.content || item.content_number || '(empty)'}
              </pre>
            )}
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Display Order</div>
              <div className="text-sm">{item.display_order}</div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Status</div>
              <span
                className={
                  item.is_active
                    ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200'
                    : 'inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200'
                }
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Last updated: {formatAdminDateTime(item.updated_at)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
