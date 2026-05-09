'use client'

import * as React from 'react'
import { ArrowLeft, Lock, RefreshCw, Trash2, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { formatAdminDate } from '@/src/admin/utils/formatDate'

type User = {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  lockedUntil: string | null
  createdAt?: string
  lastLoginAt?: string | null
}

function isLocked(user: User | null) {
  return !!user?.lockedUntil && new Date(user.lockedUntil) > new Date()
}

export function UsersEditorPage({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isLocking, setIsLocking] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)
  const [form, setForm] = React.useState({ email: '', name: '', role: 'admin', isActive: true })
  const [lockDuration, setLockDuration] = React.useState(15)

  const loadUser = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load user')
      const nextUser = json.user as User
      setUser(nextUser)
      setForm({
        email: nextUser.email || '',
        name: nextUser.name || '',
        role: nextUser.role || 'admin',
        isActive: !!nextUser.isActive,
      })
    } catch (error) {
      toast({
        title: 'Failed to load user',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
      router.push('/admin/users')
    } finally {
      setIsLoading(false)
    }
  }, [id, router, toast])

  React.useEffect(() => {
    void loadUser()
  }, [loadUser])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update user')
      toast({ title: 'User updated', variant: 'success', duration: 2500 })
      await loadUser()
    } catch (error) {
      toast({
        title: 'Failed to update user',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    if (!window.confirm(`Delete ${user.name}?`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete user')
      toast({ title: 'User deleted', variant: 'success', duration: 2500 })
      router.push('/admin/users')
    } catch (error) {
      toast({
        title: 'Failed to delete user',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleLock = async () => {
    if (!user) return
    setIsLocking(true)
    try {
      if (isLocked(user)) {
        const res = await fetch(`/api/admin/users/${user.id}/lock`, { method: 'DELETE' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to unlock user')
        toast({ title: 'User unlocked', variant: 'success', duration: 2500 })
      } else {
        const res = await fetch(`/api/admin/users/${user.id}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationMinutes: lockDuration }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to lock user')
        toast({ title: 'User locked', variant: 'success', duration: 2500 })
      }
      await loadUser()
    } catch (error) {
      toast({
        title: 'Failed to update lock state',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsLocking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-muted-foreground">Loading user…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-[0_18px_54px_rgba(64,21,63,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="font-serif text-2xl font-semibold text-foreground">Edit User</div>
            <div className="mt-1 text-sm text-muted-foreground">Update account details and access settings.</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void loadUser()} disabled={isLoading || isSaving || isDeleting || isLocking}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleToggleLock} disabled={isLocking}>
            {isLocked(user) ? <Unlock size={16} className="mr-2" /> : <Lock size={16} className="mr-2" />}
            {isLocked(user) ? 'Unlock' : 'Lock'}
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

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <Select value={form.isActive ? 'true' : 'false'} onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value === 'true' }))}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.id || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Created At</Label>
              <Input value={user?.createdAt ? formatAdminDate(user.createdAt) : '—'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Last Login</Label>
              <Input value={user?.lastLoginAt ? formatAdminDate(user.lastLoginAt) : 'Never'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Lock Duration (minutes)</Label>
              <Input
                type="number"
                min={1}
                max={43200}
                value={lockDuration}
                onChange={(e) => setLockDuration(parseInt(e.target.value, 10) || 15)}
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Locking or unlocking affects access immediately after saving.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
