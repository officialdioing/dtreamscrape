import * as React from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  editLabel?: string
  deleteLabel?: string
  viewLabel?: string
  deleteConfirmMessage?: string
}

export function ActionButtons({
  onEdit,
  onDelete,
  onView,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  viewLabel = 'View',
  deleteConfirmMessage = 'Are you sure you want to delete this item?',
}: ActionButtonsProps) {
  const handleDelete = React.useCallback(() => {
    if (onDelete && window.confirm(deleteConfirmMessage)) {
      onDelete()
    }
  }, [onDelete, deleteConfirmMessage])

  return (
    <div className="flex items-center gap-1.5">
      {onView && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={viewLabel}
          onClick={onView}
        >
          <Eye size={14} />
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={editLabel}
          onClick={onEdit}
          >
          <Pencil size={14} />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={deleteLabel}
          onClick={handleDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  )
}
