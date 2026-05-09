import * as React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/src/lib/utils'

interface LoadingStateProps {
  title?: string
  message?: string
  className?: string
  skeletonRows?: number
  compact?: boolean
}

export function LoadingState({
  title = 'Loading',
  message = 'Loading data…',
  className,
  skeletonRows = 3,
  compact = false,
}: LoadingStateProps) {
  return (
    <Card className={cn('overflow-hidden border-border/70 bg-card p-0 shadow-[0_18px_54px_rgba(64,21,63,0.06)]', className)}>
      <CardContent className={cn('p-0', compact ? 'p-5' : '')}>
        <div className={cn('flex items-center gap-3 border-b border-border/70 px-6 py-6', compact && 'border-b-0 px-0 py-0')}>
          <Spinner className="size-5 text-primary" />
          <div>
            <div className="text-lg font-semibold text-foreground">{title}</div>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>

        {!compact && (
          <div className="px-6 py-6">
            <div className="space-y-4">
              {Array.from({ length: skeletonRows }).map((_, index) => (
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
                  <div className="mt-4 space-y-2">
                    <div className="h-10 w-full rounded-xl bg-muted/80 animate-pulse" />
                    <div className="h-10 w-full rounded-xl bg-muted/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
