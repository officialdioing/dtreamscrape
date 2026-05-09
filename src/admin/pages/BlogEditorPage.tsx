'use client'

/* eslint-disable @next/next/no-img-element */

import * as React from 'react'
import { ArrowLeft, Eye, Save, ImagePlus, Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/src/lib/utils'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { MediaPickerModal } from '../components/MediaPickerModal'
import { useDisclosure } from '@/src/admin/hooks/useDisclosure'
import { useBlogPosts } from '../providers/BlogPostsProvider'
import type { BlogPost as PublicPost } from '@/src/lib/blog-posts'
import { BlogStoryPage } from '@/src/components/pages/BlogStoryPage'

type EditorBlock =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'heading'; content: string; level?: 'h2' | 'h3' }
  | { id: string; type: 'quote'; content: string }
  | { id: string; type: 'image'; content: string; caption?: string }

type EditorPost = {
  id: string
  title: string
  subtitle: string
  author: string
  date: string
  status: 'Draft' | 'Published'
  category: string
  location: string
  excerpt: string
  image: string
  contentBlocks: EditorBlock[]
  __raw?: any
}

function safeBlocks(blocks: unknown): EditorBlock[] {
  return Array.isArray(blocks) ? (blocks as any) : []
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `b_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function createBlock(type: EditorBlock['type']): EditorBlock {
  const id = makeId()
  switch (type) {
    case 'heading':
      return { id, type: 'heading', level: 'h2', content: '' }
    case 'quote':
      return { id, type: 'quote', content: '' }
    case 'image':
      return { id, type: 'image', content: '', caption: '' }
    case 'text':
    default:
      return { id, type: 'text', content: '' }
  }
}

export function BlogEditorPage({
  mode = 'create',
  postId,
}: {
  mode?: 'create' | 'edit'
  postId?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { posts, savePost, getPost } = useBlogPosts()

  const normalizedId = (postId || 'new').trim().replace(/\s+/g, '')
  const isNew = mode === 'create' || normalizedId === 'new'

  const existing = React.useMemo(() => {
    if (isNew) return null
    return posts.find((p: any) => p.id === normalizedId || p.__raw?.slug === normalizedId) || null
  }, [posts, normalizedId, isNew])

  const emptyPost = React.useMemo<EditorPost>(
    () => ({
      id: '',
      title: '',
      subtitle: '',
      author: 'Dreamscape Team',
      date: '',
      status: 'Draft',
      category: 'Wedding',
      location: '',
      excerpt: '',
      image: '',
      contentBlocks: [],
    }),
    []
  )

  const [post, setPost] = React.useState<EditorPost>(emptyPost)
  const [mounted, setMounted] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const mediaModal = useDisclosure(false)
  const [mediaTarget, setMediaTarget] = React.useState<
    { kind: 'featured' } | { kind: 'block'; index: number } | null
  >(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isNew) return
    if (existing) return
    if (!normalizedId || normalizedId === 'new') return

    let cancelled = false
    const load = async () => {
      setIsFetching(true)
      try {
        const loaded = await getPost(normalizedId)
        if (cancelled || !loaded) return
        setPost((prev) => ({
          ...prev,
          id: loaded.id || '',
          title: loaded.title || '',
          subtitle: loaded.subtitle || '',
          author: loaded.author || 'Dreamscape Team',
          date: loaded.date || '',
          status: loaded.status === 'Published' ? 'Published' : 'Draft',
          category: loaded.category || 'Wedding',
          location: loaded.location || '',
          excerpt: loaded.excerpt || '',
          image: loaded.image || '',
          contentBlocks: safeBlocks(loaded.contentBlocks),
          __raw: loaded.__raw,
        }))
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: 'Failed to load post',
            description: e?.message,
            variant: 'error',
            duration: 3500,
          })
        }
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [existing, getPost, isNew, normalizedId, toast])

  React.useEffect(() => {
    if (!existing) {
      setPost((prev) => {
        const base = { ...emptyPost, id: prev.id || '' }
        if (!mounted) return base
        if (base.date) return base
        return { ...base, date: new Date().toISOString().slice(0, 10) }
      })
      return
    }

    const next: EditorPost = {
      id: existing.id || '',
      title: existing.title || '',
      subtitle: existing.subtitle || '',
      author: existing.author || 'Dreamscape Team',
      date: existing.date || '',
      status: existing.status === 'Published' ? 'Published' : 'Draft',
      category: existing.category || 'Wedding',
      location: existing.location || '',
      excerpt: existing.excerpt || '',
      image: existing.image || '',
      contentBlocks: safeBlocks(existing.contentBlocks),
      __raw: existing.__raw,
    }
    setPost(next)
  }, [existing, emptyPost, mounted])

  const updateBlock = React.useCallback((index: number, next: Partial<EditorBlock>) => {
    setPost((prev) => {
      const blocks = prev.contentBlocks.slice()
      const current = blocks[index]
      if (!current) return prev
      blocks[index] = { ...(current as any), ...(next as any) }
      return { ...prev, contentBlocks: blocks }
    })
  }, [])

  const deleteBlock = React.useCallback((index: number) => {
    setPost((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((_, i) => i !== index),
    }))
  }, [])

  const moveBlock = React.useCallback((from: number, to: number) => {
    setPost((prev) => {
      const blocks = prev.contentBlocks.slice()
      if (from < 0 || from >= blocks.length) return prev
      if (to < 0 || to >= blocks.length) return prev
      const [item] = blocks.splice(from, 1)
      blocks.splice(to, 0, item)
      return { ...prev, contentBlocks: blocks }
    })
  }, [])

  const insertBlockAfter = React.useCallback((index: number, type: EditorBlock['type']) => {
    setPost((prev) => {
      const blocks = prev.contentBlocks.slice()
      blocks.splice(index + 1, 0, createBlock(type))
      return { ...prev, contentBlocks: blocks }
    })
  }, [])

  const routeId = (post.__raw?.slug || post.id || normalizedId || 'new').trim()

  const publicPreviewPost = React.useMemo<PublicPost>(() => {
    const blocks = Array.isArray(post.contentBlocks) ? post.contentBlocks : []
    const heroImage =
      post.image ||
      blocks.find((b) => b.type === 'image' && String((b as any).content || '').trim())?.content ||
      ''

    const fullStory = blocks
      .filter((b) => b.type === 'text' || b.type === 'heading' || b.type === 'quote')
      .map((b) => b.content)
      .filter(Boolean) as string[]

    const gallery = blocks
      .filter((b) => b.type === 'image' && String((b as any).content || '').trim())
      .map((b: any) => b.content)
      .filter(Boolean) as string[]

    const firstText = blocks.find((b) => b.type === 'text' && String(b.content || '').trim())?.content || ''

    return {
      id: routeId || 'new',
      title: post.title || 'Untitled Post',
      location: post.location || '',
      category: post.category || 'Wedding',
      date: post.date || '',
      img: heroImage,
      desc: post.excerpt || post.subtitle || firstText || '',
      fullStory,
      gallery,
      contentBlocks: blocks as any,
    }
  }, [post, routeId])

  const handleSave = async () => {
    try {
      if (!post.title.trim()) {
        toast({
          title: 'Missing title',
          description: 'Please add a title before saving.',
          variant: 'error',
          duration: 3000,
        })
        return
      }

      setIsSaving(true)

      const toSave = {
        ...post,
        contentBlocks: Array.isArray(post.contentBlocks) ? post.contentBlocks : [],
      }

      const saved = await savePost(toSave, isNew ? 'create' : 'update')
      toast({
        title: isNew ? 'Post created' : 'Post updated',
        variant: 'success',
        duration: 2500,
      })

      // Update local state silently instead of reloading
      if (isNew) {
        setPost((prev) => ({
          ...prev,
          id: saved.id || prev.id,
          __raw: saved.__raw || prev.__raw,
        }))
      }
    } catch (error) {
      toast({
        title: 'Failed to save post',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner className="size-8 text-primary" />
        <div className="text-sm font-medium text-gray-700">Loading post…</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Loading overlay */}
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
          <Button
            variant="outline"
            onClick={() => router.push('/admin/blog')}
            className="h-11 rounded-full border-border/70 bg-background px-4 text-sm font-medium shadow-[0_8px_24px_rgba(64,21,63,0.04)] hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{isNew ? 'New Blog Post' : 'Edit Blog Post'}</h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? 'Create a new blog post' : 'Edit existing blog post'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/blog')} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/blog/${routeId}/preview`)}
            disabled={isNew || isSaving}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
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

      <Tabs defaultValue="basic" className={cn("space-y-6", isSaving && "pointer-events-none opacity-50")}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="story">Story Blocks</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={post.title}
                      onChange={(e) => setPost({ ...post, title: e.target.value })}
                      placeholder="Post title"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={post.status}
                        onChange={(e) =>
                          setPost({ ...post, status: e.target.value as 'Draft' | 'Published' })
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={post.date}
                        onChange={(e) => setPost({ ...post, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={post.category}
                      onChange={(e) => setPost({ ...post, category: e.target.value })}
                      placeholder="e.g., Wedding, Celebration"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={post.location}
                      onChange={(e) => setPost({ ...post, location: e.target.value })}
                      placeholder="e.g., Toronto, Ontario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={post.author}
                      onChange={(e) => setPost({ ...post, author: e.target.value })}
                      placeholder="Author name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Textarea
                      id="subtitle"
                      value={post.subtitle}
                      onChange={(e) => setPost({ ...post, subtitle: e.target.value })}
                      rows={2}
                      placeholder="Brief subtitle or description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={post.excerpt}
                      onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                      rows={3}
                      placeholder="Short excerpt for previews"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.image ? (
                    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                      <img src={post.image} alt="Featured" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMediaTarget({ kind: 'featured' })
                      mediaModal.onOpen()
                    }}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {post.image ? 'Change Image' : 'Select Image'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Content Blocks</span>
                    <span className="font-medium">{post.contentBlocks.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{post.status}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="story" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <Card>
              <CardHeader>
                <CardTitle>Story Blocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPost((prev) => ({
                        ...prev,
                        contentBlocks: [...prev.contentBlocks, createBlock('text')],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPost((prev) => ({
                        ...prev,
                        contentBlocks: [...prev.contentBlocks, createBlock('heading')],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Heading
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPost((prev) => ({
                        ...prev,
                        contentBlocks: [...prev.contentBlocks, createBlock('quote')],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Quote
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPost((prev) => ({
                        ...prev,
                        contentBlocks: [...prev.contentBlocks, createBlock('image')],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Image
                  </Button>
                </div>

                {post.contentBlocks.length ? (
                  <div className="space-y-3">
                    {post.contentBlocks.map((block, index) => (
                      <div key={block.id} className="rounded-xl border border-border/70 bg-background p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {block.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveBlock(index, index - 1)}
                              disabled={index === 0}
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => moveBlock(index, index + 1)}
                              disabled={index === post.contentBlocks.length - 1}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBlock(index)}
                              aria-label="Delete block"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {block.type === 'heading' ? (
                          <div className="space-y-2">
                            <Label>Heading</Label>
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(index, { content: e.target.value })}
                              placeholder="Heading text"
                            />
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Level</Label>
                                <select
                                  value={(block.level || 'h2') as any}
                                  onChange={(e) =>
                                    updateBlock(index, { level: e.target.value as any } as any)
                                  }
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="h2">H2</option>
                                  <option value="h3">H3</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : block.type === 'quote' ? (
                          <div className="space-y-2">
                            <Label>Quote</Label>
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateBlock(index, { content: e.target.value })}
                              rows={3}
                              placeholder="Quote text"
                            />
                          </div>
                        ) : block.type === 'image' ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Image URL</Label>
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlock(index, { content: e.target.value })}
                                placeholder="https://..."
                              />
                            </div>
                            {block.content ? (
                              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                                <img
                                  src={block.content}
                                  alt={block.caption || 'Block image'}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setMediaTarget({ kind: 'block', index })
                                mediaModal.onOpen()
                              }}
                            >
                              <ImagePlus className="mr-2 h-4 w-4" />
                              Select from Media Library
                            </Button>
                            <div className="space-y-2">
                              <Label>Caption (optional)</Label>
                              <Input
                                value={(block.caption || '') as any}
                                onChange={(e) => updateBlock(index, { caption: e.target.value } as any)}
                                placeholder="Caption text"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Text</Label>
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateBlock(index, { content: e.target.value })}
                              rows={5}
                              placeholder="Write paragraph text…"
                            />
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => insertBlockAfter(index, 'text')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Text below
                          </Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => insertBlockAfter(index, 'image')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Image below
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                    Add blocks above to build your story. Images can go between text blocks.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border/70 bg-muted/10">
                  <div className="max-h-[62vh] overflow-auto pointer-events-none">
                    <BlogStoryPage post={publicPreviewPost} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
          if (mediaTarget.kind === 'featured') {
            setPost((prev) => ({ ...prev, image: url }))
            return
          }
          if (mediaTarget.kind === 'block') {
            updateBlock(mediaTarget.index, { content: url })
          }
        }}
      />
    </div>
  )
}
