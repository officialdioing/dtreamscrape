'use client'

/* eslint-disable @next/next/no-img-element */

import * as React from 'react'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/src/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { MediaPickerModal } from '@/src/admin/components/MediaPickerModal'
import { useDisclosure } from '@/src/admin/hooks/useDisclosure'

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringifyFieldValue(value: any) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

function parseFieldValue(nextValue: string, currentValue: any) {
  if (typeof currentValue === 'number') {
    const parsed = Number(nextValue)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof currentValue === 'boolean') {
    return nextValue === 'true'
  }

  if (Array.isArray(currentValue) || isPlainObject(currentValue)) {
    try {
      return JSON.parse(nextValue)
    } catch {
      return nextValue
    }
  }

  return nextValue
}

type SectionFieldItem = {
  id?: string
  content_key: string
  content_type: string
  content: any
  content_json: any
  content_number: any
  display_order: number
  is_active: boolean
}

export function ContentEditPage({ page, id, initialSection }: { page: string; id: string; initialSection?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [item, setItem] = React.useState<any>(null)
  const [sectionItems, setSectionItems] = React.useState<SectionFieldItem[]>([])
  const mediaModal = useDisclosure(false)
  const [mediaTarget, setMediaTarget] = React.useState<
    { kind: 'image' } | { kind: 'slide'; index: number } | null
  >(null)
  const isBrandIntroSectionEditor = page === 'home' && id === 'brand_intro'

  React.useEffect(() => {
    const loadItem = async () => {
      if (isBrandIntroSectionEditor) {
        setIsLoading(true)
        try {
          const res = await fetch(`/api/admin/content?page=${encodeURIComponent(page)}&section=brand_intro`, {
            cache: 'no-store',
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Failed to load content')
          setSectionItems(Array.isArray(json.items) ? json.items : [])
          setItem({
            page,
            section: 'brand_intro',
            content_key: 'brand_intro',
            content_type: 'json',
            content: null,
            content_json: null,
            display_order: 0,
            is_active: true,
          })
        } catch (error: any) {
          toast({
            title: 'Failed to load brand intro',
            description: error?.message,
            variant: 'error',
            duration: 3000,
          })
          router.push(`/admin/content/${page}`)
        } finally {
          setIsLoading(false)
        }
        return
      }

      if (id === 'new') {
        setItem({
          page,
          section: initialSection || '',
          content_key: '',
          content_type: 'text',
          content: '',
          content_json: null,
          display_order: 0,
          is_active: true,
        })
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/content/${id}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load content')
        setItem(json.item)
      } catch (error: any) {
        toast({
          title: 'Failed to load content',
          description: error?.message,
          variant: 'error',
          duration: 3000,
        })
        router.push(`/admin/content/${page}`)
      } finally {
        setIsLoading(false)
      }
    }

    void loadItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, initialSection, isBrandIntroSectionEditor])

  const handleSave = async () => {
    if (isBrandIntroSectionEditor) {
      setIsSaving(true)
      try {
        const updates = sectionItems.map((field) => ({
          page,
          section: 'brand_intro',
          content_key: field.content_key,
          content_type: field.content_type,
          content: field.content_type === 'json' ? null : field.content ?? '',
          content_json: field.content_type === 'json' ? field.content_json ?? null : null,
          content_number: field.content_type === 'number' ? field.content_number ?? null : null,
          display_order: field.display_order ?? 0,
          is_active: field.is_active !== false,
        }))

        for (const update of updates) {
          if (update.content_key === 'image' && typeof update.content === 'string' && update.content) {
            update.content = update.content.trim()
          }
          const existing = sectionItems.find((field) => field.content_key === update.content_key)
          const method = existing?.id ? 'PUT' : 'POST'
          const url = existing?.id ? `/api/admin/content/${existing.id}` : '/api/admin/content'
          const body = existing?.id
            ? update
            : {
                ...update,
                section: 'brand_intro',
              }

          const res = await fetch(url, {
            method,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || `Failed to save ${update.content_key}`)
        }

        toast({ title: 'Brand intro saved', variant: 'success', duration: 1800 })
        router.push(`/admin/content/${page}`)
      } catch (error: any) {
        toast({
          title: error?.message || 'Failed to save brand intro',
          variant: 'error',
          duration: 3000,
        })
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (!item?.content_key || !item?.section || !item?.content_type) {
      toast({
        title: 'Section, Key, and Type are required',
        variant: 'error',
        duration: 2000,
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        page,
        section: item.section,
        content_key: item.content_key,
        content_type: item.content_type,
        display_order: parseInt(String(item.display_order), 10) || 0,
        is_active: item.is_active !== false,
      }

      if (item.content_type === 'json') {
        payload.content_json = item.content_json
        payload.content = null
      } else if (item.content_type === 'number') {
        payload.content_number = item.content
        payload.content = null
      } else {
        payload.content = item.content
        payload.content_json = null
        payload.content_number = null
      }

      const method = id === 'new' ? 'POST' : 'PUT'
      const url = id === 'new' ? '/api/admin/content' : `/api/admin/content/${id}`

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save content')

      toast({ title: 'Saved', variant: 'success', duration: 1800 })
      router.push(`/admin/content/${page}`)
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to save content',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const pageTitle = page.charAt(0).toUpperCase() + page.slice(1)

  const isHeroSlidesKey =
    page === 'home' && item?.section === 'hero' && item?.content_key === 'slides'

  const isHeroSlidesEditor = isHeroSlidesKey && item?.content_type === 'json'

  const isFeaturedEventsKey =
    page === 'home' &&
    item?.section === 'featuredEvents' &&
    item?.content_key === 'events'

  const isFeaturedEventsEditor = isFeaturedEventsKey && item?.content_type === 'json'

  React.useEffect(() => {
    if (!isHeroSlidesKey) return
    if (!item) return

    // If slides were stored in `content` (text) previously, auto-convert to json editor.
    if (item.content_type !== 'json') {
      const raw = item.content
      let parsed: any = []
      if (typeof raw === 'string' && raw.trim()) {
        try {
          parsed = JSON.parse(raw)
        } catch {
          parsed = []
        }
      }
      const arrayValue = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as any).slides)
          ? (parsed as any).slides
          : null
      if (arrayValue) {
        setItem((prev: any) => ({
          ...prev,
          content_type: 'json',
          content_json: arrayValue,
          content: null,
          content_number: null,
        }))
      }
      return
    }

    // Parse stringified json -> object/array for editing UI.
    if (typeof item.content_json === 'string') {
      try {
        const parsed = JSON.parse(item.content_json)
        if (parsed && typeof parsed === 'object') {
          setItem((prev: any) => ({ ...prev, content_json: parsed }))
        }
      } catch {
        // ignore parse errors (user may be editing raw JSON)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHeroSlidesKey, item?.content_type, item?.content, item?.content_json])

  const slides: Array<{ id?: string; image: string }> = React.useMemo(() => {
    if (!isHeroSlidesKey) return []
    const value = item?.content_json
    const arrayValue = Array.isArray(value)
      ? value
      : value && typeof value === 'object' && Array.isArray((value as any).slides)
        ? (value as any).slides
        : null
    if (arrayValue) {
      return arrayValue
        .map((s: any, idx: number) => ({
          id: typeof s?.id === 'string' ? s.id : `slide_${idx + 1}`,
          image:
            typeof s === 'string'
              ? s
              : typeof s?.image === 'string'
                ? s.image
                : '',
        }))
        .filter((s) => s.image || s.id)
    }
    return []
  }, [isHeroSlidesKey, item?.content_json])

  const setSlides = (next: Array<{ id?: string; image: string }>) => {
    // Persist as array of objects { id, image } for consistency.
    setItem((prev: any) => ({ ...prev, content_json: next.map((s, idx) => ({
      id: s.id || `slide_${idx + 1}`,
      image: s.image,
    })) }))
  }

  const addSlide = () => {
    const next = slides.slice()
    next.push({ id: `slide_${next.length + 1}`, image: '' })
    setSlides(next)
  }

  const updateSlide = (index: number, patch: Partial<{ id: string; image: string }>) => {
    const next = slides.slice()
    const current = next[index]
    if (!current) return
    next[index] = { ...current, ...(patch as any) }
    setSlides(next)
  }

  const deleteSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index))
  }

  const moveSlide = (from: number, to: number) => {
    if (from < 0 || from >= slides.length) return
    if (to < 0 || to >= slides.length) return
    const next = slides.slice()
    const [picked] = next.splice(from, 1)
    next.splice(to, 0, picked)
    setSlides(next)
  }

  const featuredEvents: Array<{ id?: string; title: string; location: string; image: string }> = React.useMemo(() => {
    if (!isFeaturedEventsKey) return []
    const value = item?.content_json
    const arrayValue = Array.isArray(value)
      ? value
      : value && typeof value === 'object' && Array.isArray((value as any).events)
        ? (value as any).events
        : null
    if (!arrayValue) return []
    return arrayValue.map((e: any, idx: number) => ({
      id: typeof e?.id === 'string' ? e.id : `event_${idx + 1}`,
      title: typeof e?.title === 'string' ? e.title : '',
      location: typeof e?.location === 'string' ? e.location : '',
      image: typeof e?.image === 'string' ? e.image : '',
    }))
  }, [isFeaturedEventsKey, item?.content_json])

  const setFeaturedEvents = (next: Array<{ id?: string; title: string; location: string; image: string }>) => {
    setItem((prev: any) => ({ ...prev, content_json: next.map((e, idx) => ({
      id: e.id || `event_${idx + 1}`,
      title: e.title,
      location: e.location,
      image: e.image,
    })) }))
  }

  const addFeaturedEvent = () => {
    const next = featuredEvents.slice()
    next.push({ id: `event_${next.length + 1}`, title: '', location: '', image: '' })
    setFeaturedEvents(next)
  }

  const updateFeaturedEvent = (index: number, patch: Partial<{ title: string; location: string; image: string }>) => {
    const next = featuredEvents.slice()
    const current = next[index]
    if (!current) return
    next[index] = { ...current, ...(patch as any) }
    setFeaturedEvents(next)
  }

  const deleteFeaturedEvent = (index: number) => {
    setFeaturedEvents(featuredEvents.filter((_, i) => i !== index))
  }

  const moveFeaturedEvent = (from: number, to: number) => {
    if (from < 0 || from >= featuredEvents.length) return
    if (to < 0 || to >= featuredEvents.length) return
    const next = featuredEvents.slice()
    const [picked] = next.splice(from, 1)
    next.splice(to, 0, picked)
    setFeaturedEvents(next)
  }

  const updateJsonContent = (nextValue: any) => {
    setItem((prev: any) => ({ ...prev, content_json: nextValue }))
  }

  const genericJsonValue = item?.content_json
  const genericJsonArray = Array.isArray(genericJsonValue) ? genericJsonValue : []
  const genericJsonObject = isPlainObject(genericJsonValue) ? genericJsonValue : {}

  const updateJsonArrayItem = (index: number, nextValue: any) => {
    const next = genericJsonArray.slice()
    next[index] = nextValue
    updateJsonContent(next)
  }

  const addJsonArrayItem = () => {
    updateJsonContent([...genericJsonArray, ''])
  }

  const deleteJsonArrayItem = (index: number) => {
    updateJsonContent(genericJsonArray.filter((_, i) => i !== index))
  }

  const moveJsonArrayItem = (from: number, to: number) => {
    if (from < 0 || from >= genericJsonArray.length) return
    if (to < 0 || to >= genericJsonArray.length) return
    const next = genericJsonArray.slice()
    const [picked] = next.splice(from, 1)
    next.splice(to, 0, picked)
    updateJsonContent(next)
  }

  const updateJsonObjectField = (key: string, nextKey: string, nextValue: any) => {
    const next = { ...genericJsonObject }
    if (nextKey !== key) {
      delete next[key]
    }
    if (nextKey.trim()) {
      next[nextKey.trim()] = nextValue
    }
    updateJsonContent(next)
  }

  const addJsonObjectField = () => {
    const nextKey = `field_${Object.keys(genericJsonObject).length + 1}`
    updateJsonContent({ ...genericJsonObject, [nextKey]: '' })
  }

  const deleteJsonObjectField = (key: string) => {
    const next = { ...genericJsonObject }
    delete next[key]
    updateJsonContent(next)
  }

  const sectionTitle = item?.section
    ? item.section.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
    : 'Content'

  const contentKeyLabel = item?.content_key || 'Untitled'
  const canPreview = id !== 'new' && Boolean(item?.id)
  const showSetupPanel = id === 'new'
  const firstTabLabel = isHeroSlidesEditor
    ? 'Slides'
    : isFeaturedEventsEditor
      ? 'Events'
      : 'Value'
  const secondTabLabel = 'Preview'
  const contentValue = typeof item?.content === 'string' ? item.content.trim() : ''
  const imageKey = String(item?.content_key || '').toLowerCase().includes('image')
  const looksLikeImageUrl = /^(https?:)?\/\/|^data:image\//i.test(contentValue)
  const shouldShowImagePreview =
    Boolean(contentValue) && (item?.content_type === 'image' || imageKey || looksLikeImageUrl)

  const getSectionField = (contentKey: string) =>
    sectionItems.find((field) => field.content_key === contentKey)

  const setSectionField = (contentKey: string, nextValue: any) => {
    setSectionItems((prev) =>
      prev.map((field) => {
        if (field.content_key !== contentKey) return field
        if (field.content_type === 'json') {
          return { ...field, content_json: nextValue }
        }
        if (field.content_type === 'number') {
          return { ...field, content_number: nextValue }
        }
        return { ...field, content: nextValue }
      })
    )
  }

  const renderGenericArrayEditor = () => (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">List Items</div>
          <div className="text-xs text-muted-foreground">Edit each value directly.</div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addJsonArrayItem}>
          <Plus size={16} />
          Add item
        </Button>
      </div>

      {genericJsonArray.length ? (
        <div className="space-y-3">
          {genericJsonArray.map((entry, index) => {
            const entryValue = stringifyFieldValue(entry)
            const isObjectEntry = isPlainObject(entry)
            return (
              <div key={`${index}`} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Item {index + 1}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveJsonArrayItem(index, index - 1)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveJsonArrayItem(index, index + 1)}
                      disabled={index === genericJsonArray.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteJsonArrayItem(index)}
                      aria-label="Delete item"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {isObjectEntry ? (
                  <div className="space-y-3">
                    {Object.entries(entry).map(([key, value]) => (
                      <div key={key} className="grid gap-2 md:grid-cols-[160px_1fr]">
                        <Input value={key} readOnly className="h-10 font-mono" />
                        {typeof value === 'boolean' ? (
                          <select
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
                            value={value ? 'true' : 'false'}
                            onChange={(e) => {
                              const next = { ...(entry as Record<string, any>) }
                              next[key] = e.target.value === 'true'
                              updateJsonArrayItem(index, next)
                            }}
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : typeof value === 'number' ? (
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => {
                              const next = { ...(entry as Record<string, any>) }
                              next[key] = Number(e.target.value)
                              updateJsonArrayItem(index, next)
                            }}
                            className="h-10"
                          />
                        ) : typeof value === 'object' && value !== null ? (
                          <Textarea
                            value={stringifyFieldValue(value)}
                            onChange={(e) => {
                              const next = { ...(entry as Record<string, any>) }
                              try {
                                next[key] = JSON.parse(e.target.value)
                              } catch {
                                next[key] = e.target.value
                              }
                              updateJsonArrayItem(index, next)
                            }}
                            rows={4}
                            className="font-mono text-sm"
                          />
                        ) : (
                          <Input
                            value={stringifyFieldValue(value)}
                            onChange={(e) => {
                              const next = { ...(entry as Record<string, any>) }
                              next[key] = e.target.value
                              updateJsonArrayItem(index, next)
                            }}
                            className="h-10"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input
                    value={entryValue}
                    onChange={(e) => updateJsonArrayItem(index, parseFieldValue(e.target.value, entry))}
                    className="h-10"
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
          No items yet. Add one to start.
        </div>
      )}
    </div>
  )

  const renderGenericObjectEditor = () => (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Fields</div>
          <div className="text-xs text-muted-foreground">Edit each property directly.</div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addJsonObjectField}>
          <Plus size={16} />
          Add field
        </Button>
      </div>

      {Object.entries(genericJsonObject).length ? (
        <div className="space-y-3">
          {Object.entries(genericJsonObject).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-border/70 bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {key}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteJsonObjectField(key)}
                  aria-label="Delete field"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-[160px_1fr]">
                  <Label className="md:pt-3">Field name</Label>
                  <Input
                    value={key}
                    onChange={(e) => updateJsonObjectField(key, e.target.value, value)}
                    className="h-10 font-mono"
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-[160px_1fr]">
                  <Label className="md:pt-3">Value</Label>
                  {typeof value === 'boolean' ? (
                    <select
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
                      value={value ? 'true' : 'false'}
                      onChange={(e) => updateJsonObjectField(key, key, e.target.value === 'true')}
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : typeof value === 'number' ? (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateJsonObjectField(key, key, Number(e.target.value))}
                      className="h-10"
                    />
                  ) : typeof value === 'object' && value !== null ? (
                    <Textarea
                      value={stringifyFieldValue(value)}
                      onChange={(e) => {
                        try {
                          updateJsonObjectField(key, key, JSON.parse(e.target.value))
                        } catch {
                          updateJsonObjectField(key, key, e.target.value)
                        }
                      }}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <Input
                      value={stringifyFieldValue(value)}
                      onChange={(e) => updateJsonObjectField(key, key, e.target.value)}
                      className="h-10"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
          No fields yet. Add one to start.
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading content…</div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Content not found.</div>
        <Button variant="outline" onClick={() => router.push(`/admin/content/${page}`)}>
          Back
        </Button>
      </div>
    )
  }

  if (isBrandIntroSectionEditor) {
    const labelField = getSectionField('label')
    const headlineField = getSectionField('headline')
    const paragraph1Field = getSectionField('paragraph1')
    const paragraph2Field = getSectionField('paragraph2')
    const locationNoteField = getSectionField('locationNote')
    const imageField = getSectionField('image')
    const brandIntroImage = String(
      imageField?.content || imageField?.content_json || imageField?.content_number || ''
    ).trim()

    return (
      <div className="space-y-6 relative">
        {isSaving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border/70 bg-background p-8 shadow-lg">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold">Saving...</p>
                <p className="text-sm text-muted-foreground">Please wait while we save your changes</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/content/${page}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Edit Brand Intro</h1>
              <p className="text-sm text-muted-foreground">Home Page · Brand Intro</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap gap-10 bg-transparent p-0">
            <TabsTrigger
              value="content"
              className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
            >
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Brand Intro Fields</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={stringifyFieldValue(labelField?.content ?? labelField?.content_json ?? '')}
                      onChange={(e) => setSectionField('label', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={stringifyFieldValue(headlineField?.content ?? headlineField?.content_json ?? '')}
                      onChange={(e) => setSectionField('headline', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Paragraph 1</Label>
                    <Textarea
                      value={stringifyFieldValue(paragraph1Field?.content ?? paragraph1Field?.content_json ?? '')}
                      onChange={(e) => setSectionField('paragraph1', e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Paragraph 2</Label>
                    <Textarea
                      value={stringifyFieldValue(paragraph2Field?.content ?? paragraph2Field?.content_json ?? '')}
                      onChange={(e) => setSectionField('paragraph2', e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location Note</Label>
                    <Input
                      value={stringifyFieldValue(locationNoteField?.content ?? locationNoteField?.content_json ?? '')}
                      onChange={(e) => setSectionField('locationNote', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={brandIntroImage}
                      onChange={(e) => setSectionField('image', e.target.value)}
                      className="h-10"
                    />
                    {brandIntroImage ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMediaTarget({ kind: 'image' })
                          mediaModal.onOpen()
                        }}
                      >
                        <ImagePlus size={16} />
                        Replace from Media Library
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMediaTarget({ kind: 'image' })
                          mediaModal.onOpen()
                        }}
                      >
                        <ImagePlus size={16} />
                        Select from Media Library
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                    {brandIntroImage ? (
                      <img src={brandIntroImage} alt="Brand intro" className="aspect-[3/4] w-full object-cover" />
                    ) : (
                      <div className="grid aspect-[3/4] place-items-center text-sm text-muted-foreground">
                        No image selected
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {stringifyFieldValue(labelField?.content ?? labelField?.content_json ?? '')}
                    </div>
                    <div className="font-serif text-3xl font-semibold text-foreground">
                      {stringifyFieldValue(headlineField?.content ?? headlineField?.content_json ?? '')}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {stringifyFieldValue(paragraph1Field?.content ?? paragraph1Field?.content_json ?? '')}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {stringifyFieldValue(paragraph2Field?.content ?? paragraph2Field?.content_json ?? '')}
                    </p>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {stringifyFieldValue(locationNoteField?.content ?? locationNoteField?.content_json ?? '')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Brand Intro Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                  {brandIntroImage ? (
                    <img src={brandIntroImage} alt="Brand intro preview" className="aspect-[3/4] w-full object-cover" />
                  ) : (
                    <div className="grid aspect-[3/4] place-items-center text-sm text-muted-foreground">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {stringifyFieldValue(labelField?.content ?? labelField?.content_json ?? '')}
                  </div>
                  <div className="font-serif text-3xl font-semibold text-foreground">
                    {stringifyFieldValue(headlineField?.content ?? headlineField?.content_json ?? '')}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {stringifyFieldValue(paragraph1Field?.content ?? paragraph1Field?.content_json ?? '')}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {stringifyFieldValue(paragraph2Field?.content ?? paragraph2Field?.content_json ?? '')}
                  </p>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {stringifyFieldValue(locationNoteField?.content ?? locationNoteField?.content_json ?? '')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <MediaPickerModal
          isOpen={mediaModal.isOpen}
          onClose={() => {
            mediaModal.onClose()
            setMediaTarget(null)
          }}
          onSelect={(url) => {
            if (mediaTarget?.kind === 'image') {
              setSectionField('image', url)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/70 bg-background p-8 shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">Saving...</p>
              <p className="text-sm text-muted-foreground">Please wait while we save your changes</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/content/${page}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {id === 'new' ? `Add ${pageTitle} Content` : 'Edit Content'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sectionTitle} · {contentKeyLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/content/${page}`)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          {canPreview ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/content/${page}/${item.id}`)}
              disabled={isSaving}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {showSetupPanel ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Setup</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Section</Label>
              <Input
                value={item.section}
                onChange={(e) => setItem({ ...item, section: e.target.value })}
                placeholder="e.g., hero, brand_intro, statistics"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Content Key</Label>
              <Input
                value={item.content_key}
                onChange={(e) => setItem({ ...item, content_key: e.target.value })}
                placeholder="e.g., headline, paragraph1, image"
                className="h-10 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={item.content_type}
                onChange={(e) => setItem({ ...item, content_type: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="richtext">Rich Text</option>
                <option value="image">Image URL</option>
                <option value="number">Number</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={item.display_order}
                  onChange={(e) =>
                    setItem({
                      ...item,
                      display_order: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={item.is_active ? 'true' : 'false'}
                  onChange={(e) => setItem({ ...item, is_active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        defaultValue="value"
        className={cn('space-y-6', isSaving && 'pointer-events-none opacity-50')}
      >
        <TabsList className="flex h-auto w-full flex-wrap gap-10 bg-transparent p-0">
          <TabsTrigger
            value="value"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
          >
            {firstTabLabel}
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
          >
            {secondTabLabel}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="value" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                {isHeroSlidesEditor
                  ? 'Slides'
                  : isFeaturedEventsEditor
                    ? 'Events'
                    : 'Value'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.content_type === 'json' ? (
                <div className="space-y-2">
                  {isHeroSlidesEditor ? (
                    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-foreground">Hero Slides</div>
                        <Button type="button" variant="outline" size="sm" onClick={addSlide}>
                          <Plus size={16} />
                          Add slide
                        </Button>
                      </div>

                      {slides.length ? (
                        <div className="space-y-3">
                          {slides.map((slide, index) => (
                            <div
                              key={slide.id || `${index}`}
                              className="rounded-xl border border-border/70 bg-background p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Slide {index + 1}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveSlide(index, index - 1)}
                                    disabled={index === 0}
                                    aria-label="Move up"
                                  >
                                    <ArrowUp size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveSlide(index, index + 1)}
                                    disabled={index === slides.length - 1}
                                    aria-label="Move down"
                                  >
                                    <ArrowDown size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteSlide(index)}
                                    aria-label="Delete slide"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                                <div className="overflow-hidden rounded-lg bg-muted">
                                  {slide.image ? (
                                    <img
                                      src={slide.image}
                                      alt={`Slide ${index + 1}`}
                                      className="h-28 w-full object-cover"
                                    />
                                  ) : (
                                    <div className="grid h-28 place-items-center text-xs text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <Input
                                      value={slide.image}
                                      onChange={(e) => updateSlide(index, { image: e.target.value })}
                                      placeholder="https://..."
                                      className="h-10"
                                    />
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setMediaTarget({ kind: 'slide', index })
                                      mediaModal.onOpen()
                                    }}
                                  >
                                    <ImagePlus size={16} />
                                    Select from Media Library
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
                          No hero slides yet. Add a slide to start.
                        </div>
                      )}
                    </div>
                  ) : isFeaturedEventsEditor ? (
                    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-foreground">Featured Events</div>
                        <Button type="button" variant="outline" size="sm" onClick={addFeaturedEvent}>
                          <Plus size={16} />
                          Add event
                        </Button>
                      </div>

                      {featuredEvents.length ? (
                        <div className="space-y-3">
                          {featuredEvents.map((ev, index) => (
                            <div
                              key={ev.id || `${index}`}
                              className="rounded-xl border border-border/70 bg-background p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Event {index + 1}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveFeaturedEvent(index, index - 1)}
                                    disabled={index === 0}
                                    aria-label="Move up"
                                  >
                                    <ArrowUp size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveFeaturedEvent(index, index + 1)}
                                    disabled={index === featuredEvents.length - 1}
                                    aria-label="Move down"
                                  >
                                    <ArrowDown size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteFeaturedEvent(index)}
                                    aria-label="Delete event"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                                <div className="overflow-hidden rounded-lg bg-muted">
                                  {ev.image ? (
                                    <img
                                      src={ev.image}
                                      alt={ev.title || `Event ${index + 1}`}
                                      className="h-28 w-full object-cover"
                                    />
                                  ) : (
                                    <div className="grid h-28 place-items-center text-xs text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Title</Label>
                                      <Input
                                        value={ev.title}
                                        onChange={(e) => updateFeaturedEvent(index, { title: e.target.value })}
                                        placeholder="Event title"
                                        className="h-10"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Location</Label>
                                      <Input
                                        value={ev.location}
                                        onChange={(e) => updateFeaturedEvent(index, { location: e.target.value })}
                                        placeholder="Event location"
                                        className="h-10"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <Input
                                      value={ev.image}
                                      onChange={(e) => updateFeaturedEvent(index, { image: e.target.value })}
                                      placeholder="https://..."
                                      className="h-10"
                                    />
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setMediaTarget({ kind: 'slide', index })
                                      mediaModal.onOpen()
                                    }}
                                  >
                                    <ImagePlus size={16} />
                                    Select from Media Library
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
                          No featured events yet. Add one to start.
                        </div>
                      )}
                    </div>
                  ) : genericJsonArray.length ? (
                    renderGenericArrayEditor()
                  ) : isPlainObject(genericJsonValue) ? (
                    renderGenericObjectEditor()
                  ) : (
                    <div className="space-y-3">
                      <Label>Content Value</Label>
                      {item.content_type === 'richtext' ? (
                        <Textarea
                          value={item.content || ''}
                          onChange={(e) => setItem({ ...item, content: e.target.value })}
                          placeholder="Enter content…"
                          rows={8}
                        />
                      ) : (
                        <div className="space-y-3">
                          <Input
                            value={item.content || ''}
                            onChange={(e) => setItem({ ...item, content: e.target.value })}
                            placeholder={
                              item.content_type === 'image'
                                ? 'https://example.com/image.jpg'
                                : item.content_type === 'number'
                                  ? '123'
                                  : 'Enter content…'
                            }
                            type={item.content_type === 'number' ? 'number' : 'text'}
                            className="h-10"
                          />

                          {shouldShowImagePreview ? (
                            <div className="space-y-3">
                              {item.content ? (
                                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                                  <img
                                    src={item.content}
                                    alt="Selected"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : null}
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setMediaTarget({ kind: 'image' })
                                    mediaModal.onOpen()
                                  }}
                                >
                                  <ImagePlus size={16} />
                                  Select from Media Library
                                </Button>
                                {contentValue ? (
                                  <span className="text-xs text-muted-foreground">
                                    Preview shown because this looks like an image URL.
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">{secondTabLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.content_type === 'json' ? (
                isHeroSlidesEditor ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id || `${index}`}
                        className="overflow-hidden rounded-2xl border border-border/70 bg-background"
                      >
                        <div className="aspect-[4/5] bg-muted">
                          {slide.image ? (
                            <img
                              src={slide.image}
                              alt={`Slide ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-sm font-semibold text-foreground">Slide {index + 1}</div>
                          <div className="mt-1 break-all text-xs text-muted-foreground">
                            {slide.image || 'No URL set'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isFeaturedEventsEditor ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {featuredEvents.map((ev, index) => (
                      <div
                        key={ev.id || `${index}`}
                        className="rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                          {ev.image ? (
                            <img
                              src={ev.image}
                              alt={ev.title || `Event ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="mt-4 space-y-1">
                          <div className="text-sm font-semibold text-foreground">{ev.title || `Event ${index + 1}`}</div>
                          <div className="text-xs text-muted-foreground">{ev.location || 'No location set'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(genericJsonValue) ? (
                  <div className="space-y-3">
                    {genericJsonArray.map((entry, index) => (
                      <div
                        key={`${index}`}
                        className="rounded-2xl border border-border/70 bg-background p-4 text-sm text-foreground"
                      >
                        {typeof entry === 'object' && entry !== null ? (
                          <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                            {JSON.stringify(entry, null, 2)}
                          </pre>
                        ) : (
                          stringifyFieldValue(entry)
                        )}
                      </div>
                    ))}
                  </div>
                ) : isPlainObject(genericJsonValue) ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(genericJsonObject).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-border/70 bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {key}
                        </div>
                        <div className="mt-2 text-sm text-foreground">
                          {typeof value === 'object' && value !== null ? (
                            <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            stringifyFieldValue(value)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
                    Nothing to preview yet.
                  </div>
                )
              ) : item.content_type === 'richtext' ? (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-sm leading-relaxed text-foreground">
                  {item.content ? item.content : 'No content yet.'}
                </div>
              ) : item.content_type === 'image' || shouldShowImagePreview ? (
                <div className="space-y-3">
                  {item.content ? (
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                      <img
                        src={item.content}
                        alt={item.content_key || 'Preview'}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
                      No image preview available.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-sm leading-relaxed text-foreground">
                  {item.content || '(empty)'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MediaPickerModal
        isOpen={mediaModal.isOpen}
        onClose={() => {
          mediaModal.onClose()
          setMediaTarget(null)
        }}
        onSelect={(url) => {
          if (!mediaTarget) return
          if (mediaTarget.kind === 'image') {
            setItem((prev: any) => ({ ...prev, content: url }))
            return
          }
          if (mediaTarget.kind === 'slide') {
            if (isFeaturedEventsKey) {
              updateFeaturedEvent(mediaTarget.index, { image: url })
            } else {
              updateSlide(mediaTarget.index, { image: url })
            }
          }
        }}
      />
    </div>
  )
}
