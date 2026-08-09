'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { FileText, Eye, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { DocumentPreviewDialog } from '@/components/document-preview-dialog'
import type { PendingDocumentItem } from '@/lib/types/challenge'
import { ChallengeDocumentStatusBadge } from '@/components/challenge-document-status-badge'
import { ChallengeModerationBadge } from '@/components/challenge-moderation-badge'
import { AdminUserContactLines } from '@/components/admin-user-contact-lines'

export function ChallengeDocumentReviewCard({
  item,
  onApprove,
  onReject,
  onRefresh,
  actionLoading,
}: {
  item: PendingDocumentItem
  onApprove: (item: PendingDocumentItem) => Promise<void>
  onReject: (item: PendingDocumentItem, reason: string) => Promise<void>
  onRefresh?: () => void
  actionLoading?: boolean
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleOpenFile = () => {
    if (!item.downloadUrl) {
      onRefresh?.()
      return
    }
    setPreviewOpen(true)
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await onApprove(item)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    setSubmitting(true)
    try {
      await onReject(item, reason)
      setRejectOpen(false)
      setReason('')
    } finally {
      setSubmitting(false)
    }
  }

  const busy = submitting || actionLoading
  const challengeName = item.challenge?.name ?? 'Challenge'
  const docLabel = item.challenge?.document_name ?? 'Required document'

  return (
    <>
      <Card className="border bg-card hover:shadow-sm transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{docLabel}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">{challengeName}</p>
            </div>
            <ChallengeDocumentStatusBadge status={item.document_status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {item.challenge?.document_description ? (
            <p className="text-muted-foreground">{item.challenge.document_description}</p>
          ) : null}
          {item.challenge?.moderation_mode ? (
            <ChallengeModerationBadge
              mode={item.challenge.moderation_mode}
              requiresDocument={item.challenge.requires_document}
            />
          ) : null}
          {item.user ? (
            <div>
              <p className="font-medium">@{item.user.username}</p>
              {item.user.display_name ? (
                <p className="text-muted-foreground text-xs">{item.user.display_name}</p>
              ) : null}
              <AdminUserContactLines user={item.user} className="mt-1" />
            </div>
          ) : null}
          <div className="text-xs text-muted-foreground space-y-0.5">
            {item.document_mime ? <p>Type: {item.document_mime}</p> : null}
            {item.document_original_name ? <p>File: {item.document_original_name}</p> : null}
            {item.document_size_bytes != null ? (
              <p>Size: {(item.document_size_bytes / 1024).toFixed(1)} KB</p>
            ) : null}
            {item.document_submitted_at ? (
              <p>Submitted: {new Date(item.document_submitted_at).toLocaleString()}</p>
            ) : null}
            {item.expiresIn != null ? (
              <p>Download link expires in {item.expiresIn}s</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleOpenFile}>
              <Eye className="h-4 w-4 mr-1" />
              {item.downloadUrl ? 'Review document' : 'Refresh link'}
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => void handleApprove()}
              disabled={busy || item.document_status !== 'pending'}
            >
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              disabled={busy || item.document_status !== 'pending'}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={item.downloadUrl}
        fileName={item.document_original_name ?? docLabel}
        mimeType={item.document_mime}
        expiresIn={item.expiresIn}
        onRefreshUrl={onRefresh}
        description={`Submitted for ${challengeName}`}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject document</DialogTitle>
            <DialogDescription>
              Participant can resubmit after rejection. Optional reason is shown to support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Image is blurry; please resubmit a clearer scan."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleReject()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Reject document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
