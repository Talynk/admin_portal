'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/**
 * Horizontal scroll + min width for dense admin tables.
 * Keeps empty/loading states from collapsing the layout.
 */
export function DataTableShell({
  children,
  className,
  minWidth = '720px',
  loading,
  empty,
  emptyMessage = 'No results',
}: {
  children: ReactNode
  className?: string
  minWidth?: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  if (empty) {
    return (
      <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-md border', className)}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

/** Truncate with native tooltip for full value. */
export function TruncateCell({
  children,
  className,
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span className={cn('block truncate max-w-[14rem]', className)} title={title}>
      {children}
    </span>
  )
}
