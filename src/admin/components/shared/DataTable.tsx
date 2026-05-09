import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/src/lib/utils'

interface Column<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  isLoading?: boolean
  emptyMessage?: string
  loadingMessage?: string
  className?: string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  bulkActions?: (selectedItems: T[]) => React.ReactNode
  onRowClick?: (item: T) => void
  pageSize?: number
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  className,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  bulkActions,
  onRowClick,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [currentPageSize, setCurrentPageSize] = React.useState(pageSize)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [data, pageSize])

  React.useEffect(() => {
    setCurrentPageSize(pageSize)
  }, [pageSize])

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * currentPageSize
  const pageData = React.useMemo(
    () => data.slice(pageStart, pageStart + currentPageSize),
    [data, pageStart, currentPageSize]
  )

  React.useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage)
    }
  }, [currentPage, safeCurrentPage])

  const allSelected = pageData.length > 0 && pageData.every(item => selectedIds.has(keyExtractor(item)))
  const someSelected = pageData.some(item => selectedIds.has(keyExtractor(item))) && !allSelected

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection = new Set(selectedIds)
      pageData.forEach((item) => newSelection.add(keyExtractor(item)))
      onSelectionChange?.(newSelection)
    } else {
      const newSelection = new Set(selectedIds)
      pageData.forEach((item) => newSelection.delete(keyExtractor(item)))
      onSelectionChange?.(newSelection)
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedIds)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    onSelectionChange?.(newSelection)
  }

  const handleRowClick = (item: T, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox, button, or link
    if ((e.target as HTMLElement).closest('input, button, a, label')) {
      return
    }
    onRowClick?.(item)
  }

  const getSelectedItems = (): T[] => {
    return data.filter(item => selectedIds.has(keyExtractor(item)))
  }

  const showFooter = totalItems > 0

  const tableColumns = selectable
    ? [
        {
          key: 'select',
          header: '',
          className: 'w-12',
          cell: (item: T) => {
            const id = keyExtractor(item)
            const isSelected = selectedIds.has(id)
            return (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectRow(id, checked === true)}
                aria-label="Select row"
              />
            )
          },
        },
        ...columns,
      ]
    : columns

  const selectedItems = getSelectedItems()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <div className="border-b border-border/70 px-6 py-6">
            <div className="flex items-center gap-3">
              <Spinner className="size-5 text-primary" />
              <div>
                <div className="text-lg font-semibold text-foreground">Loading data</div>
                <div className="text-sm text-muted-foreground">{loadingMessage}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_30px_rgba(64,21,63,0.04)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded-full bg-muted animate-pulse" />
                      <div className="h-3 w-64 rounded-full bg-muted/80 animate-pulse" />
                    </div>
                    <div className="h-9 w-28 rounded-xl bg-muted animate-pulse" />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="h-9 rounded-xl bg-muted/80 animate-pulse" />
                    <div className="h-9 rounded-xl bg-muted/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectable && bulkActions && selectedItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
          <div className="text-sm text-foreground">
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {bulkActions(selectedItems)}
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <Card
        className={cn(
          'hidden overflow-hidden rounded-2xl border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)] sm:block',
          className
        )}
      >
        <Table>
          <TableHeader className="[&_tr]:border-border/70">
              <TableRow className="bg-muted/10">
                {selectable && (
                <TableHead className="w-12 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground',
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((item) => {
                const id = keyExtractor(item)
                const isSelected = selectedIds.has(id)
                return (
                  <TableRow
                    key={id}
                    onClick={(e) => handleRowClick(item, e)}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      'border-border/70 transition-colors hover:bg-muted/20',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {selectable && (
                      <TableCell className="w-12 px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(id, checked === true)}
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn('px-5 py-4 align-middle', column.className)}
                      >
                        {column.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {pageData.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          pageData.map((item) => {
            const id = keyExtractor(item)
            const isSelected = selectedIds.has(id)
            return (
              <Card
                key={id}
                onClick={(e) => handleRowClick(item, e)}
                className={cn(
                  'border-border/70 bg-card shadow-[0_10px_30px_rgba(64,21,63,0.04)]',
                  onRowClick && 'cursor-pointer',
                  isSelected && 'ring-2 ring-primary/20'
                )}
              >
                <div className="p-4 space-y-3">
                  {selectable && (
                    <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(id, checked === true)}
                        aria-label="Select row"
                      />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div key={column.key} className="flex flex-col gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {column.header}
                      </div>
                      <div className="text-sm">{column.cell(item)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {showFooter && !isLoading && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-[0_12px_40px_rgba(64,21,63,0.04)] lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedItems.length} of {totalItems} row(s) selected.
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Rows per page</p>
              <Select
                value={`${currentPageSize}`}
                onValueChange={(value) => {
                  setCurrentPageSize(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[88px] bg-background">
                  <SelectValue placeholder={currentPageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 25, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center text-sm font-medium text-foreground lg:w-[100px]">
              Page {safeCurrentPage} of {totalPages}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
