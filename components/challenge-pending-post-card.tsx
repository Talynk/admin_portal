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
import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react'
import { ChallengeDocumentStatusBadge } from '@/components/challenge-document-status-badge'
import { DocumentPreviewDialog } from '@/components/document-preview-dialog'
import type { ChallengePendingPost } from '@/lib/types/challenge'
import { ChallengeContextBadge } from '@/components/challenge-context-badge'
import { PostMediaThumbnail } from '@/components/media/post-media-thumbnail'
import { PostMediaDialog } from '@/components/media/post-media-dialog'
import type { PendingPostsPortal } from '@/hooks/use-challenge-pending-posts'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import {
  getChallengeApiErrorCode,
  getChallengeApiErrorMessage,
  type ChallengeApiErrorResponse,
} from '@/lib/challenge-api-errors'

export function ChallengePendingPostCard({
  post,
  onApprove,
  onReject,
  linkChallengeToAdmin = false,
  linkChallengeToApprover = false,
  portal = 'admin',
  onRefresh,
  actionLoading,
}: {
  post: ChallengePendingPost
  onApprove: (post: ChallengePendingPost, notes?: string) => Promise<void>
  onReject: (post: ChallengePendingPost, notes: string) => Promise<void>
  linkChallengeToAdmin?: boolean
  linkChallengeToApprover?: boolean
  portal?: PendingPostsPortal
  onRefresh?: () => void | Promise<void>
  actionLoading?: boolean
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'doc-approve' | 'doc-reject' | null>(
    null
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)

  const participantDocument = post.participant_document
  const challengeId = post.challenge_context?.challenge_id
  const userId = post.user?.id
  const docPending = participantDocument?.document_status === 'pending'

  const openAction = (type: 'approve' | 'reject' | 'doc-approve' | 'doc-reject') => {
    setActionType(type)
    setNotes('')
    setDialogOpen(true)
  }

  const handleDocumentFailure = async (title: string, res: ChallengeApiErrorResponse) => {
    toast({
      title,
      description: getChallengeApiErrorMessage(res),
      variant: 'destructive',
    })
    if (getChallengeApiErrorCode(res) === 'DOCUMENT_NOT_PENDING' && onRefresh) {
      await onRefresh()
    }
  }

  const handleDocumentApprove = async () => {
    if (!challengeId || !userId) return
    setSubmitting(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.approveParticipantDocument(challengeId, userId)
          : await apiClient.approveApproverParticipantDocument(challengeId, userId)
      if (res.success) {
        toast({ title: 'Document approved' })
        setDialogOpen(false)
        await onRefresh?.()
      } else {
        await handleDocumentFailure('Approve failed', res as ChallengeApiErrorResponse)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDocumentReject = async () => {
    if (!challengeId || !userId || !notes.trim()) return
    setSubmitting(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.rejectParticipantDocument(challengeId, userId, notes.trim())
          : await apiClient.rejectApproverParticipantDocument(challengeId, userId, notes.trim())
      if (res.success) {
        toast({ title: 'Document rejected', description: 'Participant may resubmit.' })
        setDialogOpen(false)
        await onRefresh?.()
      } else {
        await handleDocumentFailure('Reject failed', res as ChallengeApiErrorResponse)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async () => {
    if (!actionType) return
    if ((actionType === 'reject' || actionType === 'doc-reject') && !notes.trim()) return

    setSubmitting(true)
    try {
      if (actionType === 'approve') {
        await onApprove(post, notes || undefined)
        setDialogOpen(false)
      } else if (actionType === 'reject') {
        await onReject(post, notes.trim())
        setDialogOpen(false)
      } else if (actionType === 'doc-approve') {
        await handleDocumentApprove()
      } else if (actionType === 'doc-reject') {
        await handleDocumentReject()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const busy = submitting || actionLoading
  const rejectNotesMissing =
    (actionType === 'reject' || actionType === 'doc-reject') && !notes.trim()

  const dialogTitle =
    actionType === 'approve'
      ? 'Approve post'
      : actionType === 'reject'
        ? 'Reject post'
        : actionType === 'doc-approve'
          ? 'Approve document'
          : actionType === 'doc-reject'
            ? 'Reject document'
            : ''

  const dialogDescription =
    actionType === 'approve'
      ? 'Post will become active and visible on the challenge feed.'
      : actionType === 'reject'
        ? 'Post will be suspended. Notes are sent to the creator.'
        : actionType === 'doc-approve'
          ? 'The participant keeps their posts. They cannot replace an approved document.'
          : actionType === 'doc-reject'
            ? 'Rejection does not remove existing posts. The participant may resubmit the document.'
            : ''

  return (
    <>
      <Card className="overflow-hidden border bg-card hover:shadow-sm transition-shadow">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full shrink-0 sm:w-48">
            <PostMediaThumbnail
              source={post}
              title={post.title || post.caption}
              className="rounded-none"
              onPlay={() => setMediaOpen(true)}
            />
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
                linkToApproverChallenge={linkChallengeToApprover}
              />
            ) : null}
            {post.description || post.caption ? (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.description || post.caption}
              </p>
            ) : null}
            {participantDocument ? (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">
                      {participantDocument.document_original_name ||
                        participantDocument.document_name ||
                        post.challenge_context?.document_name ||
                        'Participant document'}
                    </span>
                  </div>
                  <ChallengeDocumentStatusBadge status={participantDocument.document_status} />
                </div>
                {post.challenge_context?.document_description ? (
                  <p className="text-xs text-muted-foreground">
                    Required: {post.challenge_context.document_description}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Participants can post while the document is pending. Rejection does not remove
                  posts.
                </p>
                {participantDocument.document_rejection_reason ? (
                  <p className="text-xs text-muted-foreground">
                    Rejected: {participantDocument.document_rejection_reason}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {participantDocument.downloadUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentOpen(true)}
                      disabled={busy}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Review document
                    </Button>
                  ) : null}
                  {docPending && challengeId && userId ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openAction('doc-approve')}
                        disabled={busy}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve doc
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction('doc-reject')}
                        disabled={busy}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject doc
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
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
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openAction('reject')}
                disabled={busy}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      <PostMediaDialog
        source={post}
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        title={post.title || post.caption}
        description={post.description || post.caption}
      />

      {participantDocument ? (
        <DocumentPreviewDialog
          open={documentOpen}
          onOpenChange={setDocumentOpen}
          url={participantDocument.downloadUrl}
          fileName={
            participantDocument.document_original_name ??
            participantDocument.document_name
          }
          mimeType={participantDocument.document_mime}
          expiresIn={participantDocument.expiresIn}
          description={
            post.challenge_context?.document_description ||
            (post.user ? `Submitted by @${post.user.username}` : 'Participant document')
          }
          onRefreshUrl={onRefresh ? () => void onRefresh() : undefined}
        />
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {actionType === 'reject' || actionType === 'doc-reject' || actionType === 'approve' ? (
            <div className="space-y-2">
              <Label htmlFor="post-notes">
                {actionType === 'reject' || actionType === 'doc-reject'
                  ? 'Reason (required)'
                  : 'Notes (optional)'}
              </Label>
              <Textarea
                id="post-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionType === 'reject' || actionType === 'doc-reject'
                    ? 'Reason for rejection…'
                    : 'Optional notes…'
                }
              />
              {rejectNotesMissing ? (
                <p className="text-sm text-destructive">A reason is required.</p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={
                actionType === 'reject' || actionType === 'doc-reject' ? 'destructive' : 'default'
              }
              onClick={() => void handleConfirm()}
              disabled={busy || rejectNotesMissing}
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
