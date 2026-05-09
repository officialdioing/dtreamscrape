'use client'

import * as React from 'react'
import { ArrowLeft, Eye, Save, ImagePlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { MediaPickerModal } from '../components/MediaPickerModal'
import { useDisclosure } from '@/src/admin/hooks/useDisclosure'
import { useEvents } from '../providers/EventsProvider'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

type ContentBlock = {
  id: string
  type: 'text' | 'heading' | 'quote' | 'image'
  content: string
  level?: string
  caption?: string
}

export function EventsEditorPage({ id }: { id?: string }) {
  const router = useRouter()
  const params = useParams()
  const routeId = (id || (params?.id as string) || '').toString().trim()
  const isNew = !routeId || routeId === 'new'

  const { events, refresh } = useEvents()
  const { toast } = useToast()

  const mediaModal = useDisclosure(false)
  const [isPickingFeatured, setIsPickingFeatured] = React.useState(true)

  const existing = React.useMemo(() => {
    if (isNew) return null
    return events.find((e: any) => e.id === routeId || e.slug === routeId) || null
  }, [events, routeId, isNew])

  const [draft, setDraft] = React.useState<any>({
    slug: '',
    title: '',
    client_name: '',
    event_date: '',
    event_type: 'Wedding',
    location: '',
    status: 'draft',
    featured_image: '',
    description: '',
    contentBlocks: [] as ContentBlock[],
  })

  const [blocksJson, setBlocksJson] = React.useState<string>('[]')

  React.useEffect(() => {
    if (!existing) return
    const blocks = Array.isArray(existing.images) ? existing.images : []
    setDraft({
      slug: existing.slug || '',
      title: existing.title || '',
      client_name: existing.client_name || '',
      event_date: existing.event_date || '',
      event_type: existing.event_type || 'Wedding',
      location: existing.location || '',
      status: existing.status || 'draft',
      featured_image: existing.featured_image || '',
      description: existing.description || '',
      contentBlocks: blocks,
    })
    setBlocksJson(JSON.stringify(blocks, null, 2))
  }, [existing])

  React.useEffect(() => {
    if (isNew) {
      setBlocksJson('[]')
    }
  }, [isNew])

  const handleMediaSelect = (url: string) => {
    if (isPickingFeatured) {
      setDraft((prev: any) => ({ ...prev, featured_image: url }))
    }
  }

  const handleSave = async () => {
    if (!draft.title) {
      toast({ title: 'Title is required', variant: 'error', duration: 2000 })
      return
    }

    let parsedBlocks: ContentBlock[] = []
    try {
      parsedBlocks = JSON.parse(blocksJson || '[]')
      if (!Array.isArray(parsedBlocks)) throw new Error('Blocks JSON must be an array')
    } catch (error: any) {
      toast({
        title: 'Invalid blocks JSON',
        description: error?.message || 'Please fix the JSON and try again.',
        variant: 'error',
        duration: 3500,
      })
      return
    }

    const payload = {
      slug: draft.slug?.trim() ? draft.slug : slugify(draft.title),
      title: draft.title,
      client_name: draft.client_name || null,
      event_date: draft.event_date || null,
      event_type: draft.event_type,
      location: draft.location || null,
      status: draft.status || 'draft',
      featured_image: draft.featured_image || '',
      description: draft.description || '',
      images: parsedBlocks,
      gallery_images: parsedBlocks
        .filter((b: ContentBlock) => b.type === 'image' && b.content)
        .map((b: ContentBlock) => b.content),
    }

    const url = isNew ? '/api/admin/events' : `/api/admin/events/${routeId}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) {
      toast({
        title: json?.error || 'Failed to save event',
        variant: 'error',
        duration: 2500,
      })
      return
    }

    toast({ title: 'Event saved', variant: 'success', duration: 2000 })
    await refresh()

    if (isNew && json?.item?.id) {
      router.replace(`/admin/events/${json.item.id}/edit`)
    }
  }

  const previewId = draft.slug?.trim() ? draft.slug : routeId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/admin/events')}>
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="font-serif text-2xl font-semibold text-foreground">
            {isNew ? 'New Event' : 'Edit Event'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/events/preview/${previewId}`)}
            >
              <Eye size={16} />
              Preview
            </Button>
          ) : null}
          <Button onClick={handleSave}>
            <Save size={16} />
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Essentials</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder="auto-generated if blank"
                className="h-10 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={draft.client_name}
                onChange={(e) =>
                  setDraft({ ...draft, client_name: e.target.value })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={draft.event_date}
                  onChange={(e) =>
                    setDraft({ ...draft, event_date: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={draft.event_type}
                  onChange={(e) =>
                    setDraft({ ...draft, event_type: e.target.value })
                  }
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Private Events">Private Events</option>
                  <option value="Design">Design</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="e.g. Dallas, TX"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="flex gap-2">
                <Input
                  value={draft.featured_image}
                  onChange={(e) =>
                    setDraft({ ...draft, featured_image: e.target.value })
                  }
                  placeholder="Image URL"
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPickingFeatured(true)
                    mediaModal.onOpen()
                  }}
                >
                  <ImagePlus size={16} />
                  Browse
                </Button>
              </div>
              {draft.featured_image ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.featured_image}
                    alt="Featured"
                    className="h-[160px] w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Content Blocks (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            This is the event content builder data. It must be a JSON array of blocks.
          </div>
          <Textarea
            value={blocksJson}
            onChange={(e) => setBlocksJson(e.target.value)}
            rows={16}
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      <MediaPickerModal
        isOpen={mediaModal.isOpen}
        onClose={mediaModal.onClose}
        onSelect={handleMediaSelect}
      />
    </div>
  )
}

