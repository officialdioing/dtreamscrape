'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Save, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useDisclosure } from '@/src/admin/hooks/useDisclosure'
import { MediaPickerModal } from '../components/MediaPickerModal'
import { useServices } from '../providers/ServicesProvider'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

type EditorProps = { id?: string }

export function ServicesEditorPage({ id }: EditorProps) {
  const router = useRouter()
  const params = useParams()
  const routeId = (id || (params?.id as string) || '').toString().trim()
  const normalizedRouteId = routeId.replace(/\s+/g, '')
  const isNew = !normalizedRouteId || normalizedRouteId === 'new'

  const { toast } = useToast()
  const mediaModal = useDisclosure(false)

  const { services, createService, updateService, isLoading } = useServices()
  const [isFetching, setIsFetching] = React.useState(false)
  const [serviceId, setServiceId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'content' | 'details' | 'media'>('content')

  const existing = React.useMemo(() => {
    if (isNew) return null
    return (
      services.find((s: any) => s.id === normalizedRouteId || s.slug === normalizedRouteId) ||
      null
    )
  }, [normalizedRouteId, services, isNew])

  const [draft, setDraft] = React.useState<any>({
    slug: '',
    category: '',
    title: '',
    subtitle: '',
    description: '',
    image: '',
    listItemsText: '',
    cta_text: '',
    cta_link: '',
    status: 'draft',
    display_order: 0,
  })

  React.useEffect(() => {
    if (!existing) return
    setServiceId(existing.id)
    setDraft({
      slug: existing.slug || '',
      category: existing.category || '',
      title: existing.title || '',
      subtitle: existing.subtitle || '',
      description: existing.description || '',
      image: existing.image || '',
      listItemsText: (existing.list_items || []).join('\n'),
      cta_text: existing.cta_text || '',
      cta_link: existing.cta_link || '',
      status: existing.status || 'draft',
      display_order: existing.display_order ?? 0,
    })
  }, [existing])

  React.useEffect(() => {
    if (isNew || existing || !normalizedRouteId) return
    const load = async () => {
      setIsFetching(true)
      try {
        const res = await fetch(`/api/admin/services/${normalizedRouteId}`, { cache: 'no-store' })
        const json = await res.json()
        if (res.ok && json?.item) {
          const item = json.item
          setServiceId(item.id)
          setDraft({
            slug: item.slug || '',
            category: item.category || '',
            title: item.title || '',
            subtitle: item.subtitle || '',
            description: item.description || '',
            image: item.image || '',
            listItemsText: (item.list_items || []).join('\n'),
            cta_text: item.cta_text || '',
            cta_link: item.cta_link || '',
            status: item.status || 'draft',
            display_order: item.display_order ?? 0,
          })
        }
      } finally {
        setIsFetching(false)
      }
    }
    void load()
  }, [normalizedRouteId, existing, isNew])

  const handleSave = async () => {
    if (!draft.title || !draft.description) {
      toast({
        title: 'Title and description are required',
        variant: 'error',
        duration: 2000,
      })
      return
    }

    const payload = {
      slug: draft.slug?.trim() ? draft.slug : slugify(draft.title),
      category: draft.category || null,
      title: draft.title,
      subtitle: draft.subtitle || null,
      description: draft.description,
      image: draft.image || null,
      list_items: String(draft.listItemsText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      cta_text: draft.cta_text || null,
      cta_link: draft.cta_link || null,
      status: draft.status || 'draft',
      display_order: Number(draft.display_order) || 0,
    }

    try {
      if (isNew) {
        const created = await createService(payload)
        toast({ title: 'Service created', variant: 'success', duration: 2000 })
        router.replace(`/admin/services/${created.id}/edit`)
        return
      }
      const targetId = serviceId || normalizedRouteId
      if (!targetId) return
      await updateService(targetId, payload)
      toast({ title: 'Service updated', variant: 'success', duration: 2000 })
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to save',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const previewId = draft.slug?.trim() ? draft.slug : normalizedRouteId

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
        <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/admin/services')}>
              <ArrowLeft size={16} />
              Back
            </Button>
            <div className="font-serif text-2xl font-semibold text-foreground">
              {isNew ? 'New Service' : 'Edit Service'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNew ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/services/preview/${previewId}`)}
              >
                <Eye size={16} />
                Preview
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={isLoading || isFetching}>
              <Save size={16} />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
        <CardContent className="space-y-6 p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
            <TabsList className="w-full max-w-4xl flex gap-10 bg-transparent h-auto p-0">
              <TabsTrigger
                value="content"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
              >
                Content
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
              >
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card className="border-border/70 shadow-none">
                <CardContent className="grid gap-4 p-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={draft.subtitle}
                      onChange={(e) =>
                        setDraft({ ...draft, subtitle: e.target.value })
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
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>List Items (one per line)</Label>
                    <Textarea
                      value={draft.listItemsText}
                      onChange={(e) =>
                        setDraft({ ...draft, listItemsText: e.target.value })
                      }
                      rows={7}
                      className="font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card className="border-border/70 shadow-none">
                <CardContent className="grid gap-4 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={draft.category}
                        onChange={(e) =>
                          setDraft({ ...draft, category: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={draft.display_order}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            display_order: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="h-10"
                      />
                    </div>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>CTA Text</Label>
                      <Input
                        value={draft.cta_text}
                        onChange={(e) =>
                          setDraft({ ...draft, cta_text: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Link</Label>
                      <Input
                        value={draft.cta_link}
                        onChange={(e) =>
                          setDraft({ ...draft, cta_link: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card className="border-border/70 shadow-none">
                <CardContent className="grid gap-4 p-6">
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <div className="flex gap-2">
                      <Input
                        value={draft.image}
                        onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                        placeholder="Image URL"
                        className="h-10"
                      />
                      <Button variant="outline" onClick={mediaModal.onOpen}>
                        <ImagePlus size={16} />
                        Browse
                      </Button>
                    </div>
                    {draft.image ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draft.image}
                          alt="Service"
                          className="h-[220px] w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                        No image selected yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MediaPickerModal
        isOpen={mediaModal.isOpen}
        onClose={mediaModal.onClose}
        onSelect={(url) => setDraft({ ...draft, image: url })}
      />
    </div>
  )
}
