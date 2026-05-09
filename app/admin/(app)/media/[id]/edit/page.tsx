'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useMedia } from '@/src/admin/providers/MediaProvider'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'

export default function EditMediaPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : String((params as any)?.id ?? '')
  const { toast } = useToast()
  const { media, updateMedia } = useMedia()

  const existing = React.useMemo(
    () => media.find((m: any) => m.id === id),
    [media, id]
  )
  const [filename, setFilename] = React.useState(() => existing?.name || '')

  React.useEffect(() => {
    if (existing?.name) setFilename(existing.name)
  }, [existing?.name])

  if (!existing) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Media item not found.</div>
        <Button variant="outline" onClick={() => router.push('/admin/media')}>
          Back to Media Library
        </Button>
      </div>
    )
  }

  const handleSave = async () => {
    if (!filename) {
      toast({ title: 'Filename is required', variant: 'error', duration: 2000 })
      return
    }

    const currentExt = String(existing.name).split('.').pop()
    const newFilename = filename.includes('.') ? filename : `${filename}.${currentExt}`

    try {
      await updateMedia(existing.id, {
        name: newFilename,
        url: `/media/${newFilename}`,
        type: existing.type,
        mime_type: existing.mime_type,
        size: existing.size_bytes,
      })
      toast({ title: 'File renamed', variant: 'success', duration: 2000 })
      router.push('/admin/media')
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to rename file',
        variant: 'error',
        duration: 2500,
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/admin/media')}>
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="font-serif text-2xl font-semibold text-foreground">
            Edit Media
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save size={16} />
          Save
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-[420px] rounded-xl bg-muted p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={existing.url}
                alt={existing.name}
                className="max-h-[320px] w-full rounded-lg object-contain"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Current filename:</span>{' '}
              {existing.name}
            </div>
            <div>
              <span className="font-medium text-foreground">Size:</span> {existing.size}
            </div>
            <div>
              <span className="font-medium text-foreground">Type:</span>{' '}
              {existing.mime_type || 'Unknown'}
            </div>
            <div className="break-all">
              <span className="font-medium text-foreground">URL:</span> {existing.url}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Rename</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>New filename</Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter new filename (without extension)"
              className="h-10"
            />
            <div className="text-xs text-muted-foreground">
              The file extension will be preserved automatically.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
