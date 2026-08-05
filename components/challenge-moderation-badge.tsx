import { Badge } from '@/components/ui/badge'
import type { ModerationMode } from '@/lib/types/challenge'
import { cn } from '@/lib/utils'

export function ChallengeModerationBadge({
  mode,
  className,
}: {
  mode?: ModerationMode | string | null
  className?: string
}) {
  if (!mode) return <Badge variant="secondary" className={className}>—</Badge>
  if (mode === 'open') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200',
          className
        )}
      >
        Open
      </Badge>
    )
  }
  return (
    <Badge
      className={cn(
        'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100',
        className
      )}
    >
      Moderated
    </Badge>
  )
}
