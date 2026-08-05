'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Loader2, Video, Image as ImageIcon } from 'lucide-react'
import type { ChallengePendingPost } from '@/lib/types/challenge'
import { ChallengeContextBadge } from '@/components/challenge-context-badge'
import { getFileUrl, getThumbnailUrl } from '@/lib/file-utils'

export function ChallengePendingPostCard({
  post,
  onApprove,
  onReject,
  linkChallengeToAdmin = false,
  actionLoading,
}: {
  post: ChallengePendingPost
  onApprove: (post: ChallengePendingPost, notes?: string) => Promise<void>
  onReject: (post: ChallengePendingPost, notes: string) => Promise<void>
  linkChallengeToAdmin?: boolean
  actionLoading?: boolean
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const thumb =
    getFileUrl(post.thumbnail_url) ||
    (post.video_url ? getThumbnailUrl(post.video_url) : null)
  const isVideo = post.type === 'video' || !!post.video_url

  const openAction = (type: 'approve' | 'reject') => {
    setActionType(type)
    setNotes('')
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!actionType) return
    setSubmitting(true)
    try {
      if (actionType === 'approve') {
        await onApprove(post, notes || undefined)
      } else {
        await onReject(post, notes || 'Rejected')
      }
      setDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const busy = submitting || actionLoading

  return (
    <>
      <Card className="overflow-hidden border bg-card hover:shadow-sm transition-shadow">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-40 h-32 sm:h-auto shrink-0 bg-muted flex items-center justify-center">
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : isVideo ? (
              <Video className="h-10 w-10 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <CardContent className="flex-1 p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{post.title || post.caption || 'Untitled'}</p>
                {post.user ? (
                  <p className="text-sm text-muted-foreground">@{post.user.username}</p>
                ) : null}
              </div>
              <Badge variant="secondary">{post.status}</Badge>
            </div>
            {post.challenge_context ? (
              <ChallengeContextBadge
                context={post.challenge_context}
                linkToAdminChallenge={linkChallengeToAdmin}
              />
            ) : null}
            {post.description || post.caption ? (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.description || post.caption}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {post.createdAt || post.uploadDate
                ? new Date(post.createdAt || post.uploadDate!).toLocaleString()
                : null}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={() => openAction('approve')} disabled={busy}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => openAction('reject')} disabled={busy}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve post' : 'Reject post'}</DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Post will become active and visible on the challenge feed.'
                : 'Post will be suspended. Notes are sent to the creator.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="post-notes">Notes {actionType === 'reject' ? '(recommended)' : '(optional)'}</Label>
            <Textarea
              id="post-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'reject' ? 'Reason for rejection…' : 'Optional notes…'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={() => void handleConfirm()}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
