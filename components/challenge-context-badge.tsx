import Link from 'next/link'
import { Trophy } from 'lucide-react'
import type { ChallengeContext } from '@/lib/types/challenge'
import { ChallengeModerationBadge } from '@/components/challenge-moderation-badge'
import { cn } from '@/lib/utils'

export function ChallengeContextBadge({
  context,
  linkToAdminChallenge = false,
  className,
}: {
  context?: ChallengeContext | null
  linkToAdminChallenge?: boolean
  className?: string
}) {
  if (!context?.challenge_id) return null

  const inner = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs',
        className
      )}
    >
      <Trophy className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="font-medium truncate max-w-[160px]">{context.challenge_name}</span>
      <ChallengeModerationBadge mode={context.moderation_mode} />
    </span>
  )

  if (linkToAdminChallenge) {
    return (
      <Link
        href={`/dashboard/challenges/${context.challenge_id}`}
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </Link>
    )
  }

  return inner
}
