'use client'

/* eslint-disable @next/next/no-img-element */

import * as React from 'react'
import { ArrowLeft, ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getContentPageConfig } from '@/src/admin/content/content-dashboard'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { MediaPickerModal } from '@/src/admin/components/MediaPickerModal'
import { useDisclosure } from '@/src/admin/hooks/useDisclosure'
import { Spinner } from '@/components/ui/spinner'

type SectionItem = {
  id: string
  content_key: string
  content_type: string
  content: any
  content_json: any
  content_number: any
  display_order: number
  is_active: boolean
  updated_at?: string
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringifyValue(value: any) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function ContentSectionEditPage({ page, section }: { page: string; section: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const mediaModal = useDisclosure(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [items, setItems] = React.useState<SectionItem[]>([])
  const [initialItems, setInitialItems] = React.useState<SectionItem[]>([])
  const mediaApplyRef = React.useRef<((url: string) => void) | null>(null)
  const isBrandIntroSection = page === 'home' && section === 'brand_intro'
  const isStatisticsSection = page === 'home' && section === 'statistics'

  const fetchSection = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/admin/content?page=${encodeURIComponent(page)}&section=${encodeURIComponent(section)}`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load section')
      const nextItems = Array.isArray(json.items) ? json.items : []
      setItems(nextItems)
      setInitialItems(nextItems)
    } catch (error: any) {
      toast({
        title: 'Failed to load section',
        description: error?.message,
        variant: 'error',
        duration: 3000,
      })
      router.push(`/admin/content/${page}`)
    } finally {
      setIsLoading(false)
    }
  }, [page, router, section, toast])

  React.useEffect(() => {
    void fetchSection()
  }, [fetchSection])

  const updateItem = (itemId: string, patch: Partial<SectionItem>) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)))
  }

  const setItemValue = (itemId: string, nextValue: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        if (item.content_type === 'json') return { ...item, content_json: nextValue }
        if (item.content_type === 'number') return { ...item, content_number: nextValue }
        return { ...item, content: nextValue }
      })
    )
  }

  const getSectionField = (contentKey: string) => items.find((field) => field.content_key === contentKey)

  const isImageFieldKey = (key: string) => /(^|_)(img|image)(_|$)/i.test(key) || key.toLowerCase().includes('image')

  const openMediaPicker = (apply: (url: string) => void) => {
    mediaApplyRef.current = apply
    mediaModal.onOpen()
  }

  const inferSectionFieldType = (contentKey: string, nextValue: any) => {
    if (contentKey.toLowerCase().includes('image')) return 'text'
    if (typeof nextValue === 'number') return 'number'
    if (typeof nextValue === 'boolean') return 'text'
    if (Array.isArray(nextValue) || isPlainObject(nextValue)) return 'json'
    return 'text'
  }

  const setSectionField = (contentKey: string, nextValue: any) => {
    setItems((prev) => {
      const existing = prev.find((field) => field.content_key === contentKey)
      const contentType = existing?.content_type || inferSectionFieldType(contentKey, nextValue)

      if (!existing) {
        return [
          ...prev,
          {
            id: '',
            content_key: contentKey,
            content_type: contentType,
            content: contentType === 'json' || contentType === 'number' ? null : nextValue,
            content_json: contentType === 'json' ? nextValue : null,
            content_number: contentType === 'number' ? nextValue : null,
            display_order: prev.length,
            is_active: true,
          },
        ]
      }

      return prev.map((field) => {
        if (field.content_key !== contentKey) return field
        if (field.content_type === 'json') {
          return { ...field, content_json: nextValue }
        }
        if (field.content_type === 'number') {
          return { ...field, content_number: nextValue }
        }
        return { ...field, content: nextValue }
      })
    })
  }

  const getJsonArrayValue = (contentKey: string) => {
    const field = getSectionField(contentKey)
    const raw = field?.content_json ?? field?.content ?? []
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).items)) return (raw as any).items
    return []
  }

  const setJsonArrayValue = (contentKey: string, nextValue: any[]) => {
    setSectionField(contentKey, nextValue)
  }

  const normalizeItem = (item: SectionItem) => ({
    id: item.id || '',
    content_key: item.content_key,
    content_type: item.content_type,
    content: item.content ?? null,
    content_json: item.content_json ?? null,
    content_number: item.content_number ?? null,
    display_order: item.display_order ?? 0,
    is_active: item.is_active !== false,
  })

  const isDirty =
    JSON.stringify(items.map(normalizeItem)) !== JSON.stringify(initialItems.map(normalizeItem))
  const saveButtonClassName = isSaving ? 'cursor-wait' : ''

  const getFieldText = (contentKey: string) =>
    String(getSectionField(contentKey)?.content ?? getSectionField(contentKey)?.content_json ?? getSectionField(contentKey)?.content_number ?? '')

  const renderTextField = (label: string, contentKey: string, options?: { multiline?: boolean; rows?: number }) => {
    const value = getFieldText(contentKey)
    if (options?.multiline) {
      return (
        <div key={contentKey} className="space-y-2">
          <Label>{label}</Label>
          <Textarea value={value} onChange={(e) => setSectionField(contentKey, e.target.value)} rows={options.rows || 4} />
        </div>
      )
    }

    return (
      <div key={contentKey} className="space-y-2">
        <Label>{label}</Label>
        <Input value={value} onChange={(e) => setSectionField(contentKey, e.target.value)} className="h-10" />
      </div>
    )
  }

  const renderImageField = (label: string, contentKey: string) => {
    const value = getFieldText(contentKey)
    return (
      <div key={contentKey} className="space-y-2">
        <Label>{label}</Label>
        <Input value={value} onChange={(e) => setSectionField(contentKey, e.target.value)} className="h-10" />
        {value ? (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
            <img src={value} alt={label} className="aspect-[4/3] w-full object-cover" />
          </div>
        ) : null}
        {value ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openMediaPicker((url) => setSectionField(contentKey, url))}
            >
              <ImagePlus size={16} />
              Replace from Media Library
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openMediaPicker((url) => setSectionField(contentKey, url))}
            >
              <Plus size={16} />
              Open Media Library
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openMediaPicker((url) => setSectionField(contentKey, url))}
            >
              <ImagePlus size={16} />
              Select from Media Library
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openMediaPicker((url) => setSectionField(contentKey, url))}
            >
              <Plus size={16} />
              Open Media Library
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderSectionShell = (args: {
    heading: string
    subtitle: string
    left: React.ReactNode
    preview: React.ReactNode
    previewTitle?: string
  }) => {
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

        <Card>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push(`/admin/content/${page}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{args.heading}</h1>
                <p className="text-sm text-muted-foreground">{args.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving || !isDirty} className={saveButtonClassName}>
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
          </CardContent>
        </Card>

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
                  <CardTitle className="font-serif text-lg">{args.heading} Fields</CardTitle>
                </CardHeader>
                <CardContent>{args.left}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">{args.previewTitle || 'Live Preview'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">{args.preview}</CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">{args.previewTitle || args.heading} Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">{args.preview}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <MediaPickerModal
          isOpen={mediaModal.isOpen}
          onClose={() => {
            mediaModal.onClose()
            mediaApplyRef.current = null
          }}
          onSelect={(url) => {
            mediaApplyRef.current?.(url)
            mediaApplyRef.current = null
          }}
        />
      </div>
    )
  }

  const saveOne = async (item: SectionItem) => {
    const payload: any = {
      page,
      section,
      content_key: item.content_key,
      content_type: item.content_type,
      display_order: item.display_order || 0,
      is_active: item.is_active !== false,
    }
    if (item.content_type === 'json') {
      payload.content_json = item.content_json
      payload.content = null
      payload.content_number = null
    } else if (item.content_type === 'number') {
      payload.content_number = item.content_number ?? item.content
      payload.content = null
      payload.content_json = null
    } else {
      payload.content = item.content
      payload.content_json = null
      payload.content_number = null
    }

    const method = item.id ? 'PUT' : 'POST'
    const url = item.id ? `/api/admin/content/${item.id}` : '/api/admin/content'
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || `Failed to save ${item.content_key}`)
    return json.item
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      for (const item of items) {
        await saveOne(item)
      }
      toast({ title: 'Saved', variant: 'success', duration: 1800 })
      setInitialItems(items.map((item) => ({ ...item })))
      router.push(`/admin/content/${page}`)
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to save section',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const sectionTitle = titleCase(section)
  const pageConfig = getContentPageConfig(page)
  const pageTitle = pageConfig?.label || titleCase(page)
  const sectionConfig = pageConfig?.sections.find((entry) => entry.id === section)
  const sectionLabel = sectionConfig?.label || sectionTitle
  const sectionDescription = sectionConfig?.description || `${pageTitle} content section`

  if (isBrandIntroSection) {
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
            <Button variant="outline" onClick={() => router.push(`/admin/content/${page}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Edit Brand Intro</h1>
              <p className="text-sm text-muted-foreground">Home Page · Brand Intro</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving || !isDirty} className={saveButtonClassName}>
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
                      value={stringifyValue(labelField?.content ?? labelField?.content_json ?? '')}
                      onChange={(e) => setSectionField('label', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={stringifyValue(headlineField?.content ?? headlineField?.content_json ?? '')}
                      onChange={(e) => setSectionField('headline', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Paragraph 1</Label>
                    <Textarea
                      value={stringifyValue(paragraph1Field?.content ?? paragraph1Field?.content_json ?? '')}
                      onChange={(e) => setSectionField('paragraph1', e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Paragraph 2</Label>
                    <Textarea
                      value={stringifyValue(paragraph2Field?.content ?? paragraph2Field?.content_json ?? '')}
                      onChange={(e) => setSectionField('paragraph2', e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location Note</Label>
                    <Input
                      value={stringifyValue(locationNoteField?.content ?? locationNoteField?.content_json ?? '')}
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
                        onClick={() => openMediaPicker((url) => setSectionField('image', url))}
                      >
                        <ImagePlus size={16} />
                        Replace from Media Library
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openMediaPicker((url) => setSectionField('image', url))}
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
                      {stringifyValue(labelField?.content ?? labelField?.content_json ?? '')}
                    </div>
                    <div className="font-serif text-3xl font-semibold text-foreground">
                      {stringifyValue(headlineField?.content ?? headlineField?.content_json ?? '')}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {stringifyValue(paragraph1Field?.content ?? paragraph1Field?.content_json ?? '')}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {stringifyValue(paragraph2Field?.content ?? paragraph2Field?.content_json ?? '')}
                    </p>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {stringifyValue(locationNoteField?.content ?? locationNoteField?.content_json ?? '')}
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
                    {stringifyValue(labelField?.content ?? labelField?.content_json ?? '')}
                  </div>
                  <div className="font-serif text-3xl font-semibold text-foreground">
                    {stringifyValue(headlineField?.content ?? headlineField?.content_json ?? '')}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {stringifyValue(paragraph1Field?.content ?? paragraph1Field?.content_json ?? '')}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {stringifyValue(paragraph2Field?.content ?? paragraph2Field?.content_json ?? '')}
                  </p>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {stringifyValue(locationNoteField?.content ?? locationNoteField?.content_json ?? '')}
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
            mediaApplyRef.current = null
          }}
          onSelect={(url) => {
            mediaApplyRef.current?.(url)
            mediaApplyRef.current = null
          }}
        />
      </div>
    )
  }

  if (isStatisticsSection) {
    const statistics = getJsonArrayValue('stats')

    const updateStat = (index: number, patch: Partial<{ id: string; value: string; label: string }>) => {
      const next = statistics.slice()
      const current = next[index]
      if (!current) return
      next[index] = { ...current, ...(patch as any) }
      setJsonArrayValue('stats', next)
    }

    const addStat = () => {
      const next = statistics.slice()
      next.push({ id: `stat_${next.length + 1}`, value: '', label: '' })
      setJsonArrayValue('stats', next)
    }

    const moveStat = (from: number, to: number) => {
      if (from < 0 || from >= statistics.length) return
      if (to < 0 || to >= statistics.length) return
      const next = statistics.slice()
      const [picked] = next.splice(from, 1)
      next.splice(to, 0, picked)
      setJsonArrayValue('stats', next)
    }

    const deleteStat = (index: number) => {
      setJsonArrayValue('stats', statistics.filter((_, i) => i !== index))
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
            <Button variant="outline" onClick={() => router.push(`/admin/content/${page}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Edit Statistics</h1>
              <p className="text-sm text-muted-foreground">Home Page · Statistics</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving || !isDirty} className={saveButtonClassName}>
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
                  <CardTitle className="font-serif text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Statistics Items</div>
                      <div className="text-xs text-muted-foreground">Edit each stat directly.</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addStat}>
                      <Plus size={16} />
                      Add stat
                    </Button>
                  </div>

                  {statistics.length ? (
                    <div className="space-y-3">
                      {statistics.map((stat, index) => (
                        <div key={stat?.id || `stat_${index}`} className="space-y-3 rounded-xl border border-border/70 bg-background p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Stat {index + 1}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="icon" onClick={() => moveStat(index, index - 1)} disabled={index === 0}>
                                <ArrowUp size={16} />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => moveStat(index, index + 1)} disabled={index === statistics.length - 1}>
                                <ArrowDown size={16} />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => deleteStat(index)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Value</Label>
                              <Input
                                value={String((stat as any)?.value ?? '')}
                                onChange={(e) => updateStat(index, { value: e.target.value })}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Label</Label>
                              <Input
                                value={String((stat as any)?.label ?? '')}
                                onChange={(e) => updateStat(index, { label: e.target.value })}
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
                      No statistics yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {statistics.map((stat, index) => (
                      <div key={stat?.id || `preview_${index}`} className="rounded-xl bg-brand-purple px-4 py-5 text-center text-white shadow-sm">
                        <p className="font-serif text-2xl">{String((stat as any)?.value ?? '') || '—'}</p>
                        <p className="mt-2 text-[0.66rem] uppercase tracking-[0.16em] text-white/70">
                          {String((stat as any)?.label ?? '') || 'Label'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {!statistics.length ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
                      Add stats to see the preview.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Statistics Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {statistics.map((stat, index) => (
                    <div key={stat?.id || `preview_only_${index}`} className="rounded-xl bg-brand-purple px-4 py-5 text-center text-white shadow-sm">
                      <p className="font-serif text-2xl">{String((stat as any)?.value ?? '') || '—'}</p>
                      <p className="mt-2 text-[0.66rem] uppercase tracking-[0.16em] text-white/70">
                        {String((stat as any)?.label ?? '') || 'Label'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <MediaPickerModal
          isOpen={mediaModal.isOpen}
          onClose={() => {
            mediaModal.onClose()
            mediaApplyRef.current = null
          }}
          onSelect={(url) => {
            mediaApplyRef.current?.(url)
            mediaApplyRef.current = null
          }}
        />
      </div>
    )
  }

  if (page === 'home' && section === 'hero') {
    const slidesField = getSectionField('slides')
    const slides = getJsonArrayValue('slides')

    return renderSectionShell({
      heading: 'Edit Hero Slides',
      subtitle: 'Home Page · Hero Slides',
      left: (
        <div className="space-y-5">
          {renderTextField('Headline', 'headline')}
          {renderTextField('Subheadline', 'subheadline')}
          {renderTextField('Description', 'description', { multiline: true, rows: 5 })}
          {renderTextField('Booking Note', 'bookingNote')}
          {slidesField ? renderArrayEditor(slidesField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          {slides.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {slides.map((slide: any, index: number) => (
                <div key={slide?.id || index} className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                  <img
                    src={typeof slide === 'string' ? slide : slide?.image || ''}
                    alt={`Slide ${index + 1}`}
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
              No slides yet.
            </div>
          )}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Headline</div>
            <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
            <div className="text-sm text-muted-foreground">{getFieldText('subheadline')}</div>
            <div className="text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{getFieldText('bookingNote')}</div>
          </div>
        </div>
      ),
      previewTitle: 'Hero Preview',
    })
  }

  if (page === 'home' && section === 'services_preview') {
    const servicesField = getSectionField('services')
    const servicesPreview = getJsonArrayValue('services')

    return renderSectionShell({
      heading: 'Edit Services Preview',
      subtitle: 'Home Page · Services Preview',
      left: (
        <div className="space-y-5">
          {renderTextField('Label', 'label')}
          {renderTextField('Headline', 'headline')}
          {renderTextField('CTA Text', 'ctaText')}
          {renderTextField('CTA Link', 'ctaLink')}
          {servicesField ? renderArrayEditor(servicesField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getFieldText('label')}</div>
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
          <div className="grid gap-4 md:grid-cols-2">
            {servicesPreview.map((service: any, index: number) => (
              <div key={service?.id || index} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="font-semibold text-foreground">{service?.title || 'Untitled service'}</div>
                <div className="mt-2 text-sm text-muted-foreground">{service?.description || 'No description yet.'}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      previewTitle: 'Services Preview',
    })
  }

  if (page === 'home' && section === 'featured_events') {
    const eventsField = getSectionField('events')
    const events = getJsonArrayValue('events')

    return renderSectionShell({
      heading: 'Edit Featured Events',
      subtitle: 'Home Page · Featured Events',
      left: (
        <div className="space-y-5">
          {renderTextField('Label', 'label')}
          {renderTextField('Headline', 'headline')}
          {renderTextField('Description', 'description', { multiline: true, rows: 4 })}
          {renderTextField('View All Text', 'viewAllText')}
          {renderTextField('View All Link', 'viewAllLink')}
          {eventsField ? renderArrayEditor(eventsField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getFieldText('label')}</div>
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
          <div className="text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event: any, index: number) => (
              <div key={event?.id || index} className="overflow-hidden rounded-xl border border-border/70 bg-background">
                {event?.image ? <img src={event.image} alt={event.title || 'Featured event'} className="aspect-[4/3] w-full object-cover" /> : null}
                <div className="p-4">
                  <div className="font-semibold text-foreground">{event?.title || 'Untitled event'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{event?.location || 'No location yet.'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      previewTitle: 'Featured Events Preview',
    })
  }

  if (page === 'home' && section === 'why_dreamscape') {
    const featuresField = getSectionField('features')
    const features = getJsonArrayValue('features')

    return renderSectionShell({
      heading: 'Edit Why Dreamscape',
      subtitle: 'Home Page · Why Dreamscape',
      left: (
        <div className="space-y-5">
          {renderTextField('Label', 'label')}
          {renderTextField('Headline', 'headline')}
          {featuresField ? renderArrayEditor(featuresField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getFieldText('label')}</div>
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
          <ul className="space-y-3">
            {features.map((feature: any, index: number) => (
              <li key={index} className="rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                {typeof feature === 'string' ? feature : stringifyValue(feature)}
              </li>
            ))}
          </ul>
        </div>
      ),
      previewTitle: 'Why Dreamscape Preview',
    })
  }

  if (page === 'home' && section === 'cta') {
    return renderSectionShell({
      heading: 'Edit Call To Action',
      subtitle: 'Home Page · CTA',
      left: (
        <div className="space-y-5">
          {renderTextField('Headline', 'headline', { multiline: true, rows: 4 })}
          {renderTextField('Subheadline', 'subheadline', { multiline: true, rows: 3 })}
          {renderTextField('Description', 'description', { multiline: true, rows: 4 })}
          {renderTextField('Details', 'details', { multiline: true, rows: 4 })}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
          <div className="text-sm text-muted-foreground">{getFieldText('subheadline')}</div>
          <div className="text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
          <div className="text-sm leading-relaxed text-muted-foreground">{getFieldText('details')}</div>
        </div>
      ),
      previewTitle: 'CTA Preview',
    })
  }

  if (page === 'home' && section === 'footer') {
    const exploreLinks = getSectionField('exploreLinks')
    const companyLinks = getSectionField('companyLinks')
    const connectLinks = getSectionField('connectLinks')

    return renderSectionShell({
      heading: 'Edit Footer',
      subtitle: 'Home Page · Footer',
      left: (
        <div className="space-y-5">
          {renderTextField('Copyright', 'copyright')}
          {exploreLinks ? renderArrayEditor(exploreLinks) : null}
          {companyLinks ? renderArrayEditor(companyLinks) : null}
          {connectLinks ? renderArrayEditor(connectLinks) : null}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Copyright</div>
          <div className="text-sm text-foreground">{getFieldText('copyright')}</div>
          <div className="grid gap-4 md:grid-cols-3">
            {[exploreLinks, companyLinks, connectLinks].filter(Boolean).map((field, index) => (
              <div key={field?.content_key || index} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {titleCase(field?.content_key || 'Links')}
                </div>
                <div className="space-y-2">
                  {getJsonArrayValue(field?.content_key || '').map((link: any, linkIndex: number) => (
                    <div key={linkIndex} className="text-sm text-muted-foreground">
                      {link?.label || 'Link'} {link?.href ? `· ${link.href}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      previewTitle: 'Footer Preview',
    })
  }

  if (page === 'about' && section === 'founder') {
    return renderSectionShell({
      heading: 'Edit Founder',
      subtitle: 'About Page · Founder',
      left: (
        <div className="space-y-5">
          {renderTextField('Label', 'label')}
          {renderTextField('Name', 'name')}
          {renderTextField('Role', 'role')}
          {renderTextField('Bio 1', 'bio1', { multiline: true, rows: 4 })}
          {renderTextField('Bio 2', 'bio2', { multiline: true, rows: 4 })}
          {renderTextField('Quote', 'quote', { multiline: true, rows: 3 })}
          {renderImageField('Image URL', 'image')}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          {getFieldText('image') ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
              <img src={getFieldText('image')} alt="Founder" className="aspect-[3/4] w-full object-cover" />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getFieldText('label')}</div>
            <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('name')}</div>
            <div className="text-sm uppercase tracking-[0.16em] text-brand-pink">{getFieldText('role')}</div>
            <div className="text-sm leading-relaxed text-muted-foreground">{getFieldText('bio1')}</div>
            <div className="text-sm leading-relaxed text-muted-foreground">{getFieldText('bio2')}</div>
            <div className="font-serif text-xl italic text-foreground">{getFieldText('quote')}</div>
          </div>
        </div>
      ),
      previewTitle: 'Founder Preview',
    })
  }

  if (page === 'about' && section === 'story') {
    return renderSectionShell({
      heading: 'Edit Story',
      subtitle: 'About Page · Story',
      left: (
        <div className="space-y-5">
          {renderTextField('Title', 'title')}
          {renderTextField('Content', 'content', { multiline: true, rows: 10 })}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('content')}</div>
        </div>
      ),
      previewTitle: 'Story Preview',
    })
  }

  if (page === 'about' && section === 'philosophy') {
    return renderSectionShell({
      heading: 'Edit Philosophy',
      subtitle: 'About Page · Philosophy',
      left: (
        <div className="space-y-5">
          {renderTextField('Title', 'title')}
          {renderTextField('Content', 'content', { multiline: true, rows: 10 })}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('content')}</div>
        </div>
      ),
      previewTitle: 'Philosophy Preview',
    })
  }

  if (page === 'about' && section === 'team') {
    return renderSectionShell({
      heading: 'Edit Team Information',
      subtitle: 'About Page · Team Information',
      left: (
        <div className="space-y-5">
          {renderTextField('Title', 'title')}
          {renderTextField('Description', 'description', { multiline: true, rows: 6 })}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
        </div>
      ),
      previewTitle: 'Team Preview',
    })
  }

  if (page === 'services' && section === 'page_intro') {
    return renderSectionShell({
      heading: 'Edit Services Intro',
      subtitle: 'Services Page · Page Intro',
      left: (
        <div className="space-y-5">
          {renderTextField('Headline', 'headline')}
          {renderTextField('Description', 'description', { multiline: true, rows: 8 })}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
        </div>
      ),
      previewTitle: 'Services Intro Preview',
    })
  }

  if (page === 'services' && ['weddings', 'private_events', 'corporate_events', 'special_events', 'destination'].includes(section)) {
    const listKey =
      section === 'weddings'
        ? 'planning_options'
        : section === 'private_events'
          ? 'includes_list'
          : section === 'corporate_events'
            ? 'services_list'
            : ''
    const listField = listKey ? getSectionField(listKey) : undefined
    const listItems = listKey ? getJsonArrayValue(listKey) : []

    return renderSectionShell({
      heading: `Edit ${sectionLabel}`,
      subtitle: `Services Page · ${sectionLabel}`,
      left: (
        <div className="space-y-5">
          {renderTextField('Label', 'label')}
          {renderTextField('Title', 'title')}
          {renderImageField('Image URL', 'image')}
          {renderTextField('Description', 'description', { multiline: true, rows: 8 })}
          {listField ? renderArrayEditor(listField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-4">
          {getFieldText('image') ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
              <img src={getFieldText('image')} alt={sectionLabel} className="aspect-[4/5] w-full object-cover" />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getFieldText('label')}</div>
            <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
          </div>
          {listItems.length ? (
            <div className="space-y-2">
              {listItems.map((item: any, index: number) => (
                <div key={index} className="rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                  {typeof item === 'string' ? item : stringifyValue(item)}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ),
      previewTitle: `${sectionLabel} Preview`,
    })
  }

  if (page === 'services' && section === 'final_cta') {
    return renderSectionShell({
      heading: 'Edit Final CTA',
      subtitle: 'Services Page · Final CTA',
      left: (
        <div className="space-y-5">
          {renderTextField('Headline', 'headline', { multiline: true, rows: 4 })}
          {renderTextField('Button Text', 'button_text')}
          {renderTextField('Button Link', 'button_link')}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
          <div className="inline-flex rounded-full border border-border/70 bg-background px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {getFieldText('button_text')}
          </div>
        </div>
      ),
      previewTitle: 'CTA Preview',
    })
  }

  if (page === 'contact' && section === 'contact_info') {
    const cardsField = getSectionField('cards')
    const cards = getJsonArrayValue('cards')

    return renderSectionShell({
      heading: 'Edit Contact Information',
      subtitle: 'Contact Page · Contact Information',
      left: (
        <div className="space-y-5">
          {cardsField ? renderArrayEditor(cardsField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          {cards.map((card: any, index: number) => (
            <div key={card?.id || index} className="rounded-xl border border-border/70 bg-background p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{card?.label || 'Label'}</div>
              <div className="mt-2 text-sm text-foreground">{card?.value || 'Value'}</div>
            </div>
          ))}
        </div>
      ),
      previewTitle: 'Contact Preview',
    })
  }

  if (page === 'contact' && section === 'forms') {
    return renderSectionShell({
      heading: 'Edit Forms',
      subtitle: 'Contact Page · Forms',
      left: (
        <div className="space-y-5">
          {renderTextField('Title', 'title')}
          {renderTextField('Description', 'description', { multiline: true, rows: 6 })}
          {renderTextField('Button Text', 'button_text')}
          {renderTextField('Helper Text', 'helper_text', { multiline: true, rows: 3 })}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
          <div className="inline-flex rounded-full border border-border/70 bg-background px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {getFieldText('button_text')}
          </div>
        </div>
      ),
      previewTitle: 'Forms Preview',
    })
  }

  if (page === 'love_notes' && section === 'testimonials') {
    const itemsField = getSectionField('items')
    const testimonials = getJsonArrayValue('items')

    return renderSectionShell({
      heading: 'Edit Testimonials',
      subtitle: 'Love Notes Page · Testimonials',
      left: (
        <div className="space-y-5">
          {itemsField ? renderArrayEditor(itemsField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          {testimonials.map((item: any, index: number) => (
            <div key={item?.id || index} className="rounded-xl border border-border/70 bg-background p-4">
              <div className="font-semibold text-foreground">{item?.name || 'Client Name'}</div>
              <div className="mt-2 text-sm italic text-muted-foreground">{item?.quote || 'Testimonial quote'}</div>
            </div>
          ))}
        </div>
      ),
      previewTitle: 'Testimonials Preview',
    })
  }

  if (page === 'consultation' && section === 'event_types') {
    const optionsField = getSectionField('options')
    const options = getJsonArrayValue('options')

    return renderSectionShell({
      heading: 'Edit Event Types',
      subtitle: 'Consultation Page · Event Types',
      left: <div className="space-y-5">{optionsField ? renderArrayEditor(optionsField) : null}</div>,
      preview: (
        <div className="space-y-3">
          {options.map((option: any, index: number) => (
            <div key={option?.id || index} className="rounded-xl border border-border/70 bg-background p-4">
              <div className="font-semibold text-foreground">{option?.label || 'Label'}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{option?.id || 'id'}</div>
            </div>
          ))}
        </div>
      ),
      previewTitle: 'Event Types Preview',
    })
  }

  if (page === 'consultation' && section === 'consultation_types') {
    const typesField = getSectionField('types')
    return renderSectionShell({
      heading: 'Edit Consultation Types',
      subtitle: 'Consultation Page · Consultation Types',
      left: (
        <div className="space-y-5">
          {typesField ? renderObjectEditor(typesField) : null}
        </div>
      ),
      preview: (
        <div className="space-y-3">
          {Object.entries(isPlainObject(typesField?.content_json) ? typesField.content_json : {}).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-border/70 bg-background p-4">
              <div className="font-semibold text-foreground">{key}</div>
              <div className="mt-2 text-sm text-muted-foreground">{String(value)}</div>
            </div>
          ))}
        </div>
      ),
      previewTitle: 'Consultation Types Preview',
    })
  }

  if (page === 'consultation_editorial') {
    if (section === 'overview') {
      return renderSectionShell({
        heading: 'Edit Overview',
        subtitle: 'Consultation Editorial Page · Overview',
        left: (
          <div className="space-y-5">
            {renderTextField('Title', 'title')}
            {renderTextField('Description', 'description', { multiline: true, rows: 8 })}
            {renderImageField('Image URL', 'image')}
          </div>
        ),
        preview: (
          <div className="space-y-3">
            {getFieldText('image') ? (
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                <img src={getFieldText('image')} alt="Overview" className="aspect-[4/3] w-full object-cover" />
              </div>
            ) : null}
            <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
          </div>
        ),
        previewTitle: 'Overview Preview',
      })
    }

    if (section === 'options') {
      const optionsField = getSectionField('options')
      const options = getJsonArrayValue('options')
      return renderSectionShell({
        heading: 'Edit Options',
        subtitle: 'Consultation Editorial Page · Options',
        left: <div className="space-y-5">{optionsField ? renderArrayEditor(optionsField) : null}</div>,
        preview: (
          <div className="space-y-3">
            {options.map((option: any, index: number) => (
              <div key={option?.id || index} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="font-semibold text-foreground">{option?.title || option?.label || 'Option'}</div>
                <div className="mt-2 text-sm text-muted-foreground">{option?.description || ''}</div>
              </div>
            ))}
          </div>
        ),
        previewTitle: 'Options Preview',
      })
    }

    if (section === 'details') {
      return renderSectionShell({
        heading: 'Edit Editorial Details',
        subtitle: 'Consultation Editorial Page · Details',
        left: (
          <div className="space-y-5">
            {renderTextField('Title', 'title')}
            {renderTextField('Description', 'description', { multiline: true, rows: 8 })}
          </div>
        ),
        preview: (
          <div className="space-y-3">
            <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('title')}</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{getFieldText('description')}</div>
          </div>
        ),
        previewTitle: 'Details Preview',
      })
    }

    if (section === 'cta') {
      return renderSectionShell({
        heading: 'Edit CTA',
        subtitle: 'Consultation Editorial Page · CTA',
        left: (
          <div className="space-y-5">
            {renderTextField('Headline', 'headline')}
            {renderTextField('Button Text', 'button_text')}
            {renderTextField('Button Link', 'button_link')}
          </div>
        ),
        preview: (
          <div className="space-y-3">
            <div className="font-serif text-3xl font-semibold text-foreground">{getFieldText('headline')}</div>
            <div className="inline-flex rounded-full border border-border/70 bg-background px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {getFieldText('button_text')}
            </div>
          </div>
        ),
        previewTitle: 'CTA Preview',
      })
    }
  }

  const topLevelImageField = items.find((item) => {
    const key = String(item.content_key || '').toLowerCase()
    return item.content_type === 'image' || key.includes('image')
  })
  const topLevelImageUrl = String(topLevelImageField?.content || '').trim()

  function renderArrayEditor(item: SectionItem) {
    const raw = Array.isArray(item.content_json)
      ? item.content_json
      : Array.isArray(item.content)
        ? item.content
        : []

    const updateArray = (next: any[]) => setItemValue(item.id, next)

    return (
      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{titleCase(item.content_key)}</div>
            <div className="text-xs text-muted-foreground">Edit each value directly.</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => updateArray([...raw, ''])}>
            <Plus size={16} />
            Add item
          </Button>
        </div>

        {raw.length ? (
          <div className="space-y-3">
            {raw.map((entry: any, index: number) => {
              const isObject = isPlainObject(entry)
              return (
                <div key={`${item.id}_${index}`} className="rounded-xl border border-border/70 bg-background p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Item {index + 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (index === 0) return
                          const next = raw.slice()
                          const [picked] = next.splice(index, 1)
                          next.splice(index - 1, 0, picked)
                          updateArray(next)
                        }}
                        disabled={index === 0}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (index === raw.length - 1) return
                          const next = raw.slice()
                          const [picked] = next.splice(index, 1)
                          next.splice(index + 1, 0, picked)
                          updateArray(next)
                        }}
                        disabled={index === raw.length - 1}
                      >
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => updateArray(raw.filter((_: any, i: number) => i !== index))}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {isObject ? (
                    <div className="space-y-3">
                      {Object.entries(entry).map(([key, value]) => {
                        const currentValue = stringifyValue(value)

                        const updateEntryField = (nextValue: any) => {
                          const next = { ...(entry as any), [key]: nextValue }
                          const copy = raw.slice()
                          copy[index] = next
                          updateArray(copy)
                        }

                        return (
                          <div key={key} className="grid gap-2 md:grid-cols-[160px_1fr]">
                            <Input value={key} readOnly className="h-10 font-mono" />
                            {typeof value === 'boolean' ? (
                              <select
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                value={value ? 'true' : 'false'}
                                onChange={(e) => updateEntryField(e.target.value === 'true')}
                              >
                                <option value="true">True</option>
                                <option value="false">False</option>
                              </select>
                            ) : isImageFieldKey(key) ? (
                              <div className="space-y-3">
                                {currentValue ? (
                                  <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
                                    <img
                                      src={currentValue}
                                      alt={key}
                                      className="aspect-[4/3] w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
                                    No image selected
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openMediaPicker((url) => updateEntryField(url))}
                                    >
                                      <Plus size={16} />
                                      Open Media Library
                                    </Button>
                                </div>
                              </div>
                            ) : (
                              <Input
                                value={currentValue}
                                onChange={(e) => updateEntryField(e.target.value)}
                                className="h-10"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <Input
                      value={stringifyValue(entry)}
                      onChange={(e) => {
                        const copy = raw.slice()
                        copy[index] = e.target.value
                        updateArray(copy)
                      }}
                      className="h-10"
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
            No items yet.
          </div>
        )}
      </div>
    )
  }

  function renderObjectEditor(item: SectionItem) {
    const raw = isPlainObject(item.content_json) ? item.content_json : {}
    return (
      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{titleCase(item.content_key)}</div>
            <div className="text-xs text-muted-foreground">Edit each field directly.</div>
          </div>
        </div>

        {Object.entries(raw).length ? (
          <div className="space-y-3">
            {Object.entries(raw).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {key}
                </div>
                {isImageFieldKey(key) ? (
                  <div className="space-y-3">
                    {stringifyValue(value) ? (
                      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
                        <img
                          src={stringifyValue(value)}
                          alt={key}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
                        No image selected
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openMediaPicker((url) => setItemValue(item.id, { ...raw, [key]: url }))}
                      >
                        <Plus size={16} />
                        Open Media Library
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={stringifyValue(value)}
                    onChange={(e) => {
                      setItemValue(item.id, { ...raw, [key]: e.target.value })
                    }}
                    className="h-10"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
            No fields yet.
          </div>
        )}
      </div>
    )
  }

  const renderSectionFieldEditor = (item: SectionItem) => {
    const value = item.content_type === 'json' ? item.content_json : item.content ?? item.content_number ?? ''
    const contentValue = stringifyValue(value)
    const isImageField = isImageFieldKey(item.content_key) || item.content_type === 'image'
    const imageUrl = isImageField ? contentValue : ''

    return (
      <div key={item.id} className="space-y-4 border-b border-border/60 pb-5 last:border-b-0 last:pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-serif text-[1.05rem] font-semibold text-foreground">{titleCase(item.content_key)}</div>
            <div className="text-xs text-muted-foreground">Edit this value directly.</div>
          </div>
          <span className="rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {item.content_type}
          </span>
        </div>

        {item.content_type === 'json' ? (
          Array.isArray(item.content_json) ? (
            renderArrayEditor(item)
          ) : isPlainObject(item.content_json) ? (
            renderObjectEditor(item)
          ) : (
            <Textarea
              value={contentValue}
              onChange={(e) => {
                try {
                  setItemValue(item.id, JSON.parse(e.target.value))
                } catch {
                  setItemValue(item.id, e.target.value)
                }
              }}
              rows={6}
              className="font-mono text-sm"
            />
          )
        ) : item.content_type === 'richtext' ? (
          <Textarea
            value={String(item.content || '')}
            onChange={(e) => setItemValue(item.id, e.target.value)}
            rows={6}
          />
        ) : item.content_type === 'number' ? (
          <Input
            type="number"
            value={String(item.content_number ?? item.content ?? '')}
            onChange={(e) => setItemValue(item.id, Number(e.target.value))}
            className="h-10"
          />
        ) : isImageField ? (
          <div className="space-y-3">
            <Input
              value={String(item.content || '')}
              onChange={(e) => setItemValue(item.id, e.target.value)}
              className="h-10"
            />
            <div className="space-y-3">
              {imageUrl ? (
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <img src={imageUrl} alt={item.content_key} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-background p-4 text-sm text-muted-foreground">
                  No image selected
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaPicker((url) => setItemValue(item.id, url))}
              >
                <ImagePlus size={16} />
                Select from Media Library
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaPicker((url) => setItemValue(item.id, url))}
              >
                <Plus size={16} />
                Open Media Library
              </Button>
            </div>
          </div>
        ) : (
          <Input
            value={String(item.content || '')}
            onChange={(e) => setItemValue(item.id, e.target.value)}
            className="h-10"
          />
        )}
      </div>
    )
  }

  const renderPreviewBlock = (item: SectionItem) => {
    const value = item.content_type === 'json' ? item.content_json : item.content ?? item.content_number ?? ''
    const contentValue = stringifyValue(value)
    const isImageField = isImageFieldKey(item.content_key) || item.content_type === 'image'
    const imageValue = String(item.content || item.content_json || item.content_number || '').trim()

    return (
      <div key={item.id} className="space-y-3 rounded-xl border border-border/70 bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-foreground">{titleCase(item.content_key)}</div>
          <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {item.content_type}
          </span>
        </div>

        {isImageField && imageValue ? (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
            <img src={imageValue} alt={item.content_key} className="aspect-[4/3] w-full object-cover" />
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-muted-foreground">
            {item.content_type === 'json'
              ? Array.isArray(item.content_json)
                ? `${item.content_json.length} items`
                : isPlainObject(item.content_json)
                  ? `${Object.keys(item.content_json).length} fields`
                  : contentValue
              : contentValue}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading section…</div>
        </div>
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
          <Button variant="outline" onClick={() => router.push(`/admin/content/${page}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{sectionLabel}</h1>
            <p className="text-sm text-muted-foreground">{sectionDescription}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving || !isDirty} className={saveButtonClassName}>
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
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">{sectionLabel} Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {items.length ? (
                  items.map(renderSectionFieldEditor)
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-sm text-muted-foreground">
                    No fields found in this section.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topLevelImageUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                    <img src={topLevelImageUrl} alt={section} className="aspect-[3/4] w-full object-cover" />
                  </div>
                ) : null}
                <div className="space-y-3">{items.map(renderPreviewBlock)}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">{sectionLabel} Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topLevelImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted">
                  <img src={topLevelImageUrl} alt={section} className="aspect-[3/4] w-full object-cover" />
                </div>
              ) : null}
              <div className="space-y-3">{items.map(renderPreviewBlock)}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MediaPickerModal
        isOpen={mediaModal.isOpen}
        onClose={() => {
          mediaModal.onClose()
          mediaApplyRef.current = null
        }}
        onSelect={(url) => {
          mediaApplyRef.current?.(url)
          mediaApplyRef.current = null
        }}
      />
    </div>
  )
}
