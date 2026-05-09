'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidthClassName = 'max-w-lg',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidthClassName?: string
}) {
  React.useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_30px_120px_rgba(2,6,23,0.35)] ${maxWidthClassName}`}>
          <div className="flex items-center justify-between gap-4 border-b border-border/70 p-5">
            <div className="truncate font-serif text-lg font-semibold text-foreground">
              {title}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </Button>
          </div>
          <div className="p-5">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/20 p-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}
