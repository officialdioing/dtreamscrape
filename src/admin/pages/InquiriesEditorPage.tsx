'use client'

import * as React from 'react'
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { Spinner } from '@/components/ui/spinner'

type InquiryRecord = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  event_types?: string[] | null
  consultation_date?: string | null
  consultation_time?: string | null
  event_date?: string | null
  event_location?: string | null
  budget?: string | null
  guests?: string | number | null
  how_did_you_hear?: string | null
  additional_details?: string | null
  file_urls?: string[] | null
  file_names?: string[] | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function InquiriesEditorPage({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [item, setItem] = React.useState<InquiryRecord | null>(null)
  const [status, setStatus] = React.useState('pending')

  const loadInquiry = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/bookings', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load booking')

      const found = (json.items || []).find((entry: any) => entry.id === id)
      if (!found) throw new Error('Booking not found')

      setItem(found)
      setStatus(found.status || 'pending')
    } catch (error) {
      toast({
        title: 'Failed to load booking',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
      router.push('/admin/inquiries')
    } finally {
      setIsLoading(false)
    }
  }, [id, router, toast])

  React.useEffect(() => {
    void loadInquiry()
  }, [loadInquiry])

  const handleSave = async () => {
    if (!item) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/bookings/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update booking')
      toast({ title: 'Booking updated', variant: 'success', duration: 2500 })
      await loadInquiry()
    } catch (error) {
      toast({
        title: 'Failed to update booking',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    if (!window.confirm('Delete this booking?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/bookings/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete booking')
      toast({ title: 'Booking deleted', variant: 'success', duration: 2500 })
      router.push('/admin/inquiries')
    } catch (error) {
      toast({
        title: 'Failed to delete booking',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-muted-foreground">Loading booking…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-[0_18px_54px_rgba(64,21,63,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/inquiries')}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <div className="font-serif text-2xl font-semibold text-foreground">Edit Booking</div>
              <div className="mt-1 text-sm text-muted-foreground">Update the consultation request status and review details.</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadInquiry()} disabled={isLoading || isSaving || isDeleting}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={item?.first_name || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={item?.last_name || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={item?.email || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={item?.phone || ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Consultation Date</Label>
                <Input value={formatDate(item?.consultation_date)} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Consultation Time</Label>
                <Input value={item?.consultation_time || '—'} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input value={formatDate(item?.event_date)} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Event Location</Label>
                <Input value={item?.event_location || '—'} readOnly />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Input value={Array.isArray(item?.event_types) ? item?.event_types?.join(', ') || '—' : '—'} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input value={item?.budget || '—'} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input value={item?.guests ? String(item.guests) : '—'} readOnly />
              </div>
              <div className="space-y-2">
                <Label>How Did You Hear</Label>
                <Input value={item?.how_did_you_hear || '—'} readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Details</Label>
              <div className="min-h-32 rounded-2xl border border-border/70 bg-background p-4 text-sm text-foreground">
                {item?.additional_details || '—'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Created At</Label>
              <Input value={formatDate(item?.created_at)} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Updated At</Label>
              <Input value={formatDate(item?.updated_at)} readOnly />
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Saving updates the booking status only. All other request details are read-only here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
