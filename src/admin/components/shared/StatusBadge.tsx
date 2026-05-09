import * as React from 'react'
import { cn } from '@/src/lib/utils'

export type StatusType = 'published' | 'draft' | 'new' | 'contacted' | 'booked' | 'closed' | 'active' | 'inactive'

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

const statusVariants: Record<StatusType, string> = {
  published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  draft: 'border-amber-200 bg-amber-50 text-amber-900',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  inactive: 'border-slate-200 bg-slate-50 text-slate-700',
  new: 'border-sky-200 bg-sky-50 text-sky-700',
  contacted: 'border-amber-200 bg-amber-50 text-amber-800',
  booked: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  closed: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as StatusType
  const classes = statusVariants[normalizedStatus] || statusVariants.inactive

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide',
        classes,
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
