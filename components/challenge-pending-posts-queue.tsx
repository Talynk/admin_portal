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
import { getChallengeApiErrorMessage } from '@/lib/challenge-api-errors'

export function ChallengePendingPostsQueue({
  portal,
  challengeId,
  source = 'challenge-queue',
  showFilters = false,
  linkChallengeToAdmin = false,
}: {
  portal: PendingPostsPortal
  challengeId?: string
  source?: PendingPostsSource
  showFilters?: boolean
  linkChallengeToAdmin?: boolean
}) {
  const [page, setPage] = useState(1)
  const [moderationMode, setModerationMode] = useState<ModerationMode | 'all'>('all')
  const [actionLoading, setActionLoading] = useState(false)

  const { posts, pagination, loading, error, refetch } = useChallengePendingPosts({
    portal,
    source,
    challengeId,
    page,
    limit: 12,
    challenge_only: showFilters ? true : undefined,
    moderation_mode: moderationMode === 'all' ? undefined : moderationMode,
  })

  const approve = async (post: ChallengePendingPost, notes?: string) => {
    setActionLoading(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.approvePost(post.id, notes)
          : await apiClient.approverApprovePost(post.id, notes)
      if (res.success) {
        toast({ title: 'Post approved' })
        await refetch()
      } else {
        toast({ title: 'Approve failed', description: getChallengeApiErrorMessage(res as never, res.error), variant: 'destructive' })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const reject = async (post: ChallengePendingPost, notes: string) => {
    setActionLoading(true)
    try {
      const res =
        portal === 'admin'
          ? await apiClient.rejectPost(post.id, notes)
          : await apiClient.approverRejectPost(post.id, notes)
      if (res.success) {
        toast({ title: 'Post rejected' })
        await refetch()
      } else {
        toast({ title: 'Reject failed', description: getChallengeApiErrorMessage(res as never, res.error), variant: 'destructive' })
      }
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
      {showFilters ? (
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      ) : null}

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
              linkChallengeToAdmin={linkChallengeToAdmin}
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
