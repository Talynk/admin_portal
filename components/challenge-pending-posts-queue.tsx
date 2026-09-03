'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Video } from 'lucide-react'
import {
  useChallengePendingPosts,
  type PendingPostsPortal,
  type PendingPostsSource,
} from '@/hooks/use-challenge-pending-posts'
import type { ModerationMode, ChallengePendingPost } from '@/lib/types/challenge'
import { ChallengePendingPostCard } from '@/components/challenge-pending-post-card'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import {
  getChallengeApiErrorMessage,
  isStaleQueueItemError,
  type ChallengeApiErrorResponse,
} from '@/lib/challenge-api-errors'

export function ChallengePendingPostsQueue({
  portal,
  challengeId,
  source = 'challenge-queue',
  showFilters = false,
  linkChallengeToAdmin = false,
  linkChallengeToApprover = false,
  challengeFilterOptions,
}: {
  portal: PendingPostsPortal
  challengeId?: string
  source?: PendingPostsSource
  showFilters?: boolean
  linkChallengeToAdmin?: boolean
  linkChallengeToApprover?: boolean
  challengeFilterOptions?: { id: string; name: string }[]
}) {
  const [page, setPage] = useState(1)
  const [moderationMode, setModerationMode] = useState<ModerationMode | 'all'>('all')
  const [filterChallengeId, setFilterChallengeId] = useState<string>(challengeId ?? 'all')
  const [actionLoading, setActionLoading] = useState(false)

  const effectiveChallengeId =
    challengeId ?? (filterChallengeId !== 'all' ? filterChallengeId : undefined)

  const showModerationFilter = showFilters && !(portal === 'approver' && source === 'challenge-queue')

  const { posts, pagination, loading, error, refetch } = useChallengePendingPosts({
    portal,
    source,
    challengeId: effectiveChallengeId,
    page,
    limit: 12,
    challenge_only: showFilters && !effectiveChallengeId ? true : undefined,
    moderation_mode: showModerationFilter && moderationMode !== 'all' ? moderationMode : undefined,
  })

  const handleFailure = async (title: string, res: ChallengeApiErrorResponse) => {
    toast({
      title,
      description: getChallengeApiErrorMessage(res),
      variant: 'destructive',
    })
    if (isStaleQueueItemError(res)) {
      await refetch()
    }
  }

  const approve = async (post: ChallengePendingPost, _notes?: string) => {
    setActionLoading(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.approvePost(post.id)
          : await apiClient.approverApprovePost(post.id, _notes)
      if (res.success) {
        toast({ title: 'Post approved' })
        await refetch()
        return true
      }
      await handleFailure('Approve failed', res as ChallengeApiErrorResponse)
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const reject = async (post: ChallengePendingPost, notes: string) => {
    setActionLoading(true)
    try {
      const reason = notes.trim()
      const res =
        portal === 'admin'
          ? await apiClient.rejectPost(post.id, reason)
          : await apiClient.approverRejectPost(post.id, reason)
      if (res.success) {
        toast({ title: 'Post rejected' })
        await refetch()
        return true
      }
      await handleFailure('Reject failed', res as ChallengeApiErrorResponse)
      return false
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading pending posts…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(showModerationFilter || (challengeFilterOptions && challengeFilterOptions.length > 0)) && (
        <div className="flex flex-wrap items-center gap-2">
          {challengeFilterOptions && challengeFilterOptions.length > 0 && !challengeId ? (
            <>
              <span className="text-sm text-muted-foreground">Challenge:</span>
              <Select
                value={filterChallengeId}
                onValueChange={(v) => {
                  setFilterChallengeId(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All challenges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All challenges</SelectItem>
                  {challengeFilterOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : null}
          {showModerationFilter ? (
            <>
              <span className="text-sm text-muted-foreground">Moderation mode:</span>
              <Select
                value={moderationMode}
                onValueChange={(v) => {
                  setModerationMode(v as ModerationMode | 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="moderated">Moderated</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No moderated challenge drafts</p>
          <p className="text-sm">Nothing awaiting review in this queue.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <ChallengePendingPostCard
              key={post.id}
              post={post}
              onApprove={approve}
              onReject={reject}
              portal={portal}
              onRefresh={refetch}
              linkChallengeToAdmin={linkChallengeToAdmin}
              linkChallengeToApprover={linkChallengeToApprover}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

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
