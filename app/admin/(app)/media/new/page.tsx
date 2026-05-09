'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { useMedia } from '@/src/admin/providers/MediaProvider'
import { useToast } from '@/src/admin/toast/ToastProvider'

export default function NewMediaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { refresh } = useMedia()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'Please select a file', variant: 'error', duration: 2000 })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const progressInterval = window.setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            window.clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/admin/media-library', {
        method: 'POST',
        body: formData,
      })

      window.clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      toast({ title: 'File uploaded', variant: 'success', duration: 2000 })
      await refresh()

      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      window.setTimeout(() => {
        router.push('/admin/media')
      }, 500)
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to upload file',
        variant: 'error',
        duration: 2500,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
            Upload Media
          </div>
        </div>
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          <Upload size={16} />
          {isUploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-serif text-lg">File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <button
            type="button"
            className="w-full rounded-xl border-2 border-dashed border-border/80 bg-muted/10 p-8 text-center transition hover:border-primary/40 hover:bg-muted/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.mp4,.webm"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Upload size={24} />
            </div>
            <div className="text-base font-semibold text-foreground">
              {selectedFile ? selectedFile.name : 'Click to select a file'}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Supports: images, PDF, MP4, WebM
            </div>
          </button>

          {selectedFile ? (
            <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {selectedFile.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                    {selectedFile.type || 'Unknown type'}
                  </div>
                </div>
                <Button variant="ghost" onClick={handleRemoveFile}>
                  <X size={16} />
                  Remove
                </Button>
              </div>

              {isUploading ? (
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-[width]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {uploadProgress}%
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

