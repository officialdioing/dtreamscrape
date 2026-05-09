'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useInquiries } from '@/src/admin/providers/InquiriesProvider'

export default function NewInquiryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { inquiries, setInquiries } = useInquiries()

  const [draft, setDraft] = React.useState<any>({
    name: '',
    email: '',
    eventType: 'Wedding',
    date: '',
    status: 'New',
  })

  React.useEffect(() => {
    setDraft((prev: any) => {
      if (prev?.date) return prev
      return { ...prev, date: new Date().toISOString().slice(0, 10) }
    })
  }, [])

  const handleCreate = () => {
    if (!draft.name || !draft.email) {
      toast({
        title: 'Name and email are required',
        variant: 'error',
        duration: 2000,
      })
      return
    }
    const next = { ...draft, id: Date.now().toString() }
    setInquiries([next, ...inquiries])
    toast({ title: 'Inquiry created', variant: 'success', duration: 2000 })
    router.push('/admin/inquiries')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/admin/inquiries')}>
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="font-serif text-2xl font-semibold text-foreground">
            New Inquiry
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Save size={16} />
          Create
        </Button>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Input
                value={draft.eventType}
                onChange={(e) =>
                  setDraft({ ...draft, eventType: e.target.value })
                }
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Submitted</Label>
              <Input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Booked">Booked</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
