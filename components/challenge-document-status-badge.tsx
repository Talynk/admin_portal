import { Badge } from '@/components/ui/badge'
import type { DocumentStatus } from '@/lib/types/challenge'
import { cn } from '@/lib/utils'

export function ChallengeDocumentStatusBadge({
  status,
  className,
}: {
  status?: DocumentStatus | string | null
  className?: string
}) {
  switch (status) {
    case 'pending':
      return (
        <Badge
          className={cn(
            'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
            className
          )}
        >
          Pending
        </Badge>
      )
    case 'approved':
      return (
        <Badge
          className={cn(
            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100',
            className
          )}
        >
          Approved
        </Badge>
      )
    case 'rejected':
      return (
        <Badge
          className={cn(
            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
            className
          )}
        >
          Rejected
        </Badge>
      )
    case 'none':
      return <Badge variant="secondary" className={className}>None</Badge>
    default:
      return <Badge variant="secondary" className={className}>{status || '—'}</Badge>
  }
}
