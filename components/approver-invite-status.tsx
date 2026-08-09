import { Badge } from '@/components/ui/badge'
import type { ApproverInvite, ApproverInviteState } from '@/lib/types/admin'

const STATE_BADGE: Record<ApproverInviteState, { label: string; className: string }> = {
  accepted: {
    label: 'Accepted',
    className:
      'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200',
  },
  pending: {
    label: 'Invited',
    className:
      'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200',
  },
  expired: {
    label: 'Expired',
    className:
      'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100',
  },
  none: {
    label: 'No active invitation',
    className:
      'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
  },
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ApproverInviteStatus({ invite }: { invite?: ApproverInvite | null }) {
  if (!invite) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const badge = STATE_BADGE[invite.state] ?? STATE_BADGE.none
  const sentAt = formatDate(invite.sentAt)
  const expiresAt = formatDate(invite.expiresAt)
  const acceptedAt = formatDate(invite.acceptedAt)

  return (
    <div className="space-y-1">
      <Badge className={badge.className}>{badge.label}</Badge>
      <div className="text-xs text-muted-foreground leading-relaxed">
        {invite.state === 'accepted' && acceptedAt ? <p>Joined {acceptedAt}</p> : null}
        {invite.state === 'pending' ? (
          <>
            {sentAt ? <p>Sent {sentAt}</p> : null}
            {expiresAt ? <p>Expires {expiresAt}</p> : null}
          </>
        ) : null}
        {invite.state === 'expired' ? (
          <p>{expiresAt ? `Expired ${expiresAt}` : 'Invitation expired'}</p>
        ) : null}
        {invite.state === 'none' ? <p>Needs a fresh link</p> : null}
      </div>
    </div>
  )
}
