'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Check, Maximize2, Search, Upload } from 'lucide-react'
import { useMedia } from '../providers/MediaProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { cn } from '@/src/lib/utils'

interface MediaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  selectedUrl?: string
  title?: string
  description?: string
  confirmLabel?: string
  applyOnPick?: boolean
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedUrl,
  title = 'Select Media',
  description = 'Browse and pick from your media library.',
  confirmLabel = 'Use image',
  applyOnPick = true,
}: MediaPickerModalProps) {
  const { media, isLoading, refresh } = useMedia()
  const { toast } = useToast()

  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<string>(selectedUrl || '')
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const itemsRef = React.useRef<
    Array<{ src: string; msrc?: string; width: number; height: number; alt?: string }>
  >([])

  React.useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setSelected(selectedUrl || '')
  }, [isOpen, selectedUrl])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return media
    return media.filter((item) =>
      String(item?.name || '').toLowerCase().includes(q)
    )
  }, [media, query])

  React.useEffect(() => {
    itemsRef.current = filtered.map((item) => ({
      src: item.url,
      msrc: item.url,
      width: 1600,
      height: 1067,
      alt: item.name,
    }))
  }, [filtered])

  React.useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const openPreview = async (index: number) => {
    const items = itemsRef.current
    if (!items.length) return
    const safeIndex = Math.max(0, Math.min(index, items.length - 1))
    const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')
    const lightbox = new PhotoSwipeLightbox({
      dataSource: items,
      pswpModule: () => import('photoswipe'),
    })
    lightbox.init()
    lightbox.loadAndOpen(safeIndex)
    lightbox.on('close', () => lightbox.destroy())
  }

  const apply = () => {
    if (!selected) return
    onSelect(selected)
    onClose()
  }

  const uploadToMedia = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/admin/media-library', {
      method: 'POST',
      body: formData,
    })

    const json = await response.json()
    if (!response.ok) {
      throw new Error(json?.error || json?.message || 'Upload failed')
    }

    const item = json?.item
    if (!item?.url) {
      throw new Error('Upload did not return a media item')
    }

    return item as { url: string }
  }

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const item = await uploadToMedia(file)
      await refresh()
      setSelected(item.url)
      if (applyOnPick) {
        onSelect(item.url)
        onClose()
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.message || 'Unable to upload the image',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_120px_rgba(2,6,23,0.35)]">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full max-w-[420px]">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search files…"
                      className="h-9 pl-9"
                    />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {isLoading
                      ? 'Loading…'
                      : `${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {isUploading ? 'Uploading…' : 'Upload image'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void handleUpload(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </Button>
            </div>
          </div>

          <Separator />

          <div className="max-h-[70vh] overflow-auto p-5">
            {isLoading ? (
              <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
                <Spinner className="size-5 text-primary" />
                <div className="text-sm font-medium text-gray-700">Loading…</div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item, index) => {
                const isSelected = selected === item.url
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group overflow-hidden rounded-xl border bg-background text-left shadow-sm transition cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(64,21,63,0.10)]',
                      isSelected
                        ? 'border-primary'
                        : 'border-border/70 hover:border-primary/50'
                    )}
                    onClick={() => {
                      setSelected(item.url)
                      if (applyOnPick) {
                        onSelect(item.url)
                        onClose()
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-40 w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />

                      <div className="absolute right-2 top-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 gap-1 rounded-full bg-black/55 px-2 text-white hover:bg-black/70"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void openPreview(index)
                          }}
                        >
                          <Maximize2 size={12} />
                          Preview
                        </Button>
                        {isSelected ? (
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(64,21,63,0.32)]">
                            <Check size={14} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="truncate text-xs font-semibold text-foreground/90">
                        {item.name}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {!isLoading && filtered.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-sm font-semibold text-foreground">
                  No results
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Try a different search.
                </div>
              </div>
            ) : null}
          </div>

          {!applyOnPick ? (
            <>
              <Separator />
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="text-sm text-muted-foreground">
                  {selected ? '1 selected' : 'No selection'}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={apply} disabled={!selected}>
                    {confirmLabel}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}
