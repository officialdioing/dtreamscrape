'use client'

import * as React from 'react'
import { Plus, Trash2, Pencil, AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useMedia } from '../providers/MediaProvider'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { formatAdminDate } from '@/src/admin/utils/formatDate'

export function MediaPage() {
  const router = useRouter()
  const { media, deleteMedia, isLoading, error, refresh } = useMedia()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this media item?')) return
    try {
      await deleteMedia(id)
      toast({ title: 'Image deleted', variant: 'info', duration: 2000 })
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
        duration: 3000
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
      toast({ title: 'Refreshed', variant: 'success', duration: 1500 })
    } catch (err) {
      toast({
        title: 'Failed to refresh',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
            Media Library
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => router.push('/admin/media/new')}>
              <Plus size={14} />
              <span className="hidden sm:inline">Add Media</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <div className="font-semibold text-foreground">Failed to load media</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
            Media Library
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled title="Refresh">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </Button>
            <Button size="sm" onClick={() => router.push('/admin/media/new')}>
              <Plus size={14} />
              <span className="hidden sm:inline">Add Media</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading media library…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
            Media Library
          </div>
          <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {media.length} {media.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => router.push('/admin/media/new')}>
            <Plus size={14} />
            <span className="hidden sm:inline">Add Media</span>
          </Button>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/50 p-8 sm:p-12 text-center">
          <div className="text-5xl sm:text-6xl">📷</div>
          <div>
            <div className="font-semibold text-foreground">No media yet</div>
            <div className="text-sm text-muted-foreground">
              Add your first image to get started
            </div>
          </div>
          <Button size="sm" onClick={() => router.push('/admin/media/new')}>
            <Plus size={14} />
            Add Media
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                className="h-[150px] sm:h-[200px] w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />

              <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 opacity-0 transition group-hover:opacity-100">
                <div className="flex justify-end gap-1.5 sm:gap-2">
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="bg-card/90 hover:bg-card"
                    onClick={() => router.push(`/admin/media/${item.id}/edit`)}
                    aria-label="Edit image"
                  >
                    <Pencil size={12} className="sm:size-[14px]" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete image"
                  >
                    <Trash2 size={12} className="sm:size-[14px]" />
                  </Button>
                </div>

                <div className="text-white">
                  <div className="truncate text-xs sm:text-sm font-semibold">{item.name}</div>
                  <div className="text-[10px] sm:text-xs text-white/80">
                    {item.size ? `${item.size}` : '—'} •{' '}
                    {formatAdminDate(item.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
