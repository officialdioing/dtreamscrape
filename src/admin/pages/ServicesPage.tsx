'use client'

import * as React from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useServices } from '../providers/ServicesProvider'
import { formatAdminDate } from '@/src/admin/utils/formatDate'
import { DataTable, StatusBadge } from '@/src/admin/components/shared'

export function ServicesPage() {
  const router = useRouter()
  const { services, deleteService, isLoading, refresh } = useServices()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const handleBulkDelete = async (selectedServices: any[]) => {
    if (!window.confirm(`Delete ${selectedServices.length} selected ${selectedServices.length === 1 ? 'service' : 'services'}?`)) return

    try {
      await Promise.all(selectedServices.map((service) => deleteService(service.id)))
      toast({
        title: `${selectedServices.length} ${selectedServices.length === 1 ? 'service' : 'services'} deleted`,
        variant: 'success',
        duration: 2500,
      })
      setSelectedIds(new Set())
      void refresh()
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to delete',
        variant: 'error',
        duration: 2000,
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
      toast({ title: 'Refreshed', variant: 'success', duration: 1500 })
    } catch (error) {
      toast({
        title: 'Failed to refresh',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredServices = React.useMemo(
    () =>
      services.filter((service: any) => {
        const haystack = [
          service.title,
          service.description,
          service.category,
          service.slug,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(searchQuery.toLowerCase())
      }),
    [searchQuery, services]
  )

  const columns = [
    {
      key: 'title',
      header: 'Title',
      cell: (service: any) => (
        <div>
          <div className="font-medium text-foreground">{service.title}</div>
          <div className="mt-1 line-clamp-1 max-w-[520px] text-xs text-muted-foreground">
            {service.description}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (service: any) => service.category || '—',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (service: any) => (
        <StatusBadge status={(service.status || 'draft') as any} />
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (service: any) => formatAdminDate(service.updated_at),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-serif text-2xl font-semibold text-foreground">
            Service Offerings
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Manage your service packages
            <span className="ml-2 text-muted-foreground/70">
              ({filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/admin/services/new')}>
            <Plus size={16} />
            Add Service
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search services…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      <DataTable
        data={filteredServices}
        columns={columns}
        keyExtractor={(service: any) => service.id}
        isLoading={isLoading}
        emptyMessage={searchQuery ? 'No services match your search.' : 'No services yet.'}
        loadingMessage="Loading services…"
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(service: any) => router.push(`/admin/services/${service.id}/edit`)}
        bulkActions={(selectedServices) => (
          <Button variant="destructive" size="sm" onClick={() => handleBulkDelete(selectedServices)}>
            Delete {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'}
          </Button>
        )}
      />
    </div>
  )
}
