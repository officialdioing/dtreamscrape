'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/src/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  helpText?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({
  title,
  value,
  helpText,
  icon: Icon,
  trend = 'neutral',
}: StatCardProps) {
  const trendClass =
    trend === 'up'
      ? 'text-emerald-600'
      : trend === 'down'
        ? 'text-rose-600'
        : 'text-muted-foreground'

  return (
    <Card className="border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(16,24,40,0.12)] dark:border-border/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div className="mt-1 text-3xl font-bold text-foreground">{value}</div>
          {helpText ? (
            <div className={cn('mt-2 text-sm', trendClass)}>{helpText}</div>
          ) : null}
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-primary">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  )
}
