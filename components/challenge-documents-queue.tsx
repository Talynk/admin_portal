'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, FileText } from 'lucide-react'
import { useChallengePendingDocuments, type DocumentPortal } from '@/hooks/use-challenge-pending-documents'
import { ChallengeDocumentReviewCard } from '@/components/challenge-document-review-card'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import {
  getChallengeApiErrorCode,
  getChallengeApiErrorMessage,
  type ChallengeApiErrorResponse,
} from '@/lib/challenge-api-errors'
import type { PendingDocumentItem } from '@/lib/types/challenge'

export function ChallengeDocumentsQueue({
  portal,
  challengeId,
}: {
  portal: DocumentPortal
  challengeId?: string
}) {
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const { documents, pagination, loading, error, refetch } = useChallengePendingDocuments({
    portal,
    challengeId,
    page,
    limit: 12,
  })

  // DOCUMENT_NOT_PENDING means another reviewer got there first, so the stale
  // card has to go even though the request failed.
  const handleFailure = async (title: string, res: ChallengeApiErrorResponse) => {
    toast({
      title,
      description: getChallengeApiErrorMessage(res),
      variant: 'destructive',
    })
    if (getChallengeApiErrorCode(res) === 'DOCUMENT_NOT_PENDING') {
      await refetch()
    }
  }

  const approve = async (item: PendingDocumentItem) => {
    setActionLoading(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.approveParticipantDocument(item.challenge_id, item.user_id)
          : await apiClient.approveApproverParticipantDocument(item.challenge_id, item.user_id)
      if (res.success) {
        toast({ title: 'Document approved', description: 'Participant can now submit posts.' })
        await refetch()
      } else {
        await handleFailure('Approve failed', res)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const reject = async (item: PendingDocumentItem, reason: string) => {
    setActionLoading(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.rejectParticipantDocument(item.challenge_id, item.user_id, reason)
          : await apiClient.rejectApproverParticipantDocument(item.challenge_id, item.user_id, reason)
      if (res.success) {
        toast({ title: 'Document rejected', description: reason || 'Participant may resubmit.' })
        await refetch()
      } else {
        await handleFailure('Reject failed', res)
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading documents…
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No pending documents</p>
        <p className="text-sm">All participant documents have been reviewed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((item) => (
          <ChallengeDocumentReviewCard
            key={`${item.challenge_id}-${item.user_id}-${item.participant_id}`}
            item={item}
            onApprove={approve}
            onReject={reject}
            onRefresh={refetch}
            actionLoading={actionLoading}
          />
        ))}
      </div>
      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
