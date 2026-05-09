'use client'

import * as React from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useDisclosure } from '@/src/admin/hooks/useDisclosure'
import { Modal } from '@/src/admin/components/Modal'
import { formatAdminDate } from '@/src/admin/utils/formatDate'
import { DataTable } from '@/src/admin/components/shared'

interface User {
  id: string
  email: string
  name: string
  role: string
  emailVerified: boolean
  isActive: boolean
  twoFactorEnabled: boolean
  createdAt: string
  lastLoginAt: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
}

function isLocked(user: User) {
  return user.lockedUntil && new Date(user.lockedUntil) > new Date()
}

export function UsersManagementPage() {
  const router = useRouter()
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const { toast } = useToast()

  const createModal = useDisclosure(false)

  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
  })

  React.useEffect(() => {
    void fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (data.success) setUsers(data.users)
      else throw new Error(data.error || 'Failed to fetch users')
    } catch (error) {
      toast({
        title: 'Failed to fetch users',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchUsers()
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: 'User created', variant: 'success', duration: 2500 })
        createModal.onClose()
        setFormData({ email: '', password: '', name: '', role: 'admin' })
        void fetchUsers()
      } else {
        throw new Error(data.error || 'Failed to create user')
      }
    } catch (error) {
      toast({
        title: 'Failed to create user',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    }
  }

  const deleteUserById = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: 'User deleted', variant: 'success', duration: 2500 })
        void fetchUsers()
      } else {
        throw new Error(data.error || 'Failed to delete user')
      }
    } catch (error) {
      toast({
        title: 'Failed to delete user',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 4500,
      })
    }
  }

  const handleBulkDelete = async (selectedUsers: User[]) => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}?`)) return
    try {
      await Promise.all(selectedUsers.map((user) => deleteUserById(user)))
      setSelectedIds(new Set())
    } catch {
      // handleDeleteUser already toasts
    }
  }

  const anyLocked = users.some((u) => isLocked(u))

  const columns = [
    {
      key: 'user',
      header: 'User',
      cell: (user: User) => (
        <div>
          <div className="font-medium text-foreground">{user.name}</div>
          <div className="mt-1 text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user: User) => (
        <span
          className={
            user.role === 'super_admin'
              ? 'inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-200'
              : 'inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-inset ring-sky-200'
          }
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user: User) => (
        <div className="flex flex-wrap items-center gap-2">
          {user.isActive ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              Active
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
              Inactive
            </span>
          )}
          {isLocked(user) ? (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-200">
              Locked
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      cell: (user: User) => (user.lastLoginAt ? formatAdminDate(user.lastLoginAt) : 'Never'),
    },
    {
      key: 'failed',
      header: 'Failed',
      cell: (user: User) =>
        user.failedLoginAttempts > 0 ? (
          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
            {user.failedLoginAttempts}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-serif text-2xl font-semibold text-foreground">
            User Management
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Manage admin user accounts
            <span className="ml-2 text-muted-foreground/70">
              ({users.length} {users.length === 1 ? 'user' : 'users'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void handleRefresh()}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={createModal.onOpen}>
            <Plus size={16} />
            Add User
          </Button>
        </div>
      </div>

      {anyLocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Some user accounts are currently locked.
        </div>
      ) : null}

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(user) => user.id}
        isLoading={isLoading}
        emptyMessage="No users found."
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(user: User) => router.push(`/admin/users/${user.id}/edit`)}
        bulkActions={(selectedUsers) => (
          <Button variant="destructive" size="sm" onClick={() => handleBulkDelete(selectedUsers)}>
            <Trash2 size={16} className="mr-2" />
            Delete {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}
          </Button>
        )}
      />

      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        title="Create New User"
        footer={
          <>
            <Button variant="ghost" onClick={createModal.onClose}>
              Cancel
            </Button>
            <Button type="submit" form="createUserForm">
              Create User
            </Button>
          </>
        }
      >
        <form id="createUserForm" onSubmit={handleCreateUser} className="grid gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="h-10"
            />
            <div className="text-xs text-muted-foreground">
              Min 8 chars; include letters + numbers.
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
