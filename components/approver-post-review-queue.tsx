'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Ban, CheckCircle, Search, XCircle } from 'lucide-react'
import { useApproverPosts, type ApproverPostVariant, type ApproverReviewPost } from '@/hooks/use-approver-posts'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { ReviewMediaCard } from '@/components/media/review-media-card'
import { PostMediaDialog } from '@/components/media/post-media-dialog'
import { MediaProcessingNotice } from '@/components/media/media-processing-notice'
import { ChallengeContextBadge } from '@/components/challenge-context-badge'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import {
  getChallengeApiErrorMessage,
  isStaleQueueItemError,
  type ChallengeApiErrorResponse,
} from '@/lib/challenge-api-errors'

export function ApproverPostReviewQueue({
  variant,
  showChallengeOnlyToggle = false,
}: {
  variant: ApproverPostVariant
  showChallengeOnlyToggle?: boolean
}) {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 400)
  const [challengeOnly, setChallengeOnly] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ApproverReviewPost | null>(null)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')

  const readOnly = variant === 'approved'
  const usesFlaggedReview = variant === 'suspended' || variant === 'flagged'

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { posts, pagination, loading, error, refetch } = useApproverPosts({
    variant,
    page,
    limit: 12,
    search: debouncedSearch,
    challenge_only:
      !debouncedSearch.trim() && showChallengeOnlyToggle && challengeOnly ? true : undefined,
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

  const openAction = (post: ApproverReviewPost, type: 'approve' | 'reject') => {
    setSelectedPost(post)
    setActionType(type)
    setNotes('')
    setActionDialogOpen(true)
  }

  const executeAction = async () => {
    if (!selectedPost || !actionType) return
    if (actionType === 'reject' && !notes.trim()) return

    setActionLoading(true)
    try {
      let res
      if (usesFlaggedReview) {
        res = await apiClient.reviewFlaggedPost(
          selectedPost.id,
          actionType,
          notes.trim() || 'Reviewed'
        )
      } else if (actionType === 'approve') {
        res = await apiClient.approverApprovePost(selectedPost.id, notes || undefined)
      } else {
        res = await apiClient.approverRejectPost(selectedPost.id, notes.trim())
      }

      if (res.success) {
        toast({
          title: actionType === 'approve' ? 'Post approved' : 'Post rejected',
        })
        setActionDialogOpen(false)
        setSelectedPost(null)
        await refetch()
      } else {
        await handleFailure(
          actionType === 'approve' ? 'Approve failed' : 'Reject failed',
          res as ChallengeApiErrorResponse
        )
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading posts…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by title or username…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        {showChallengeOnlyToggle && !debouncedSearch.trim() ? (
          <div className="flex items-center gap-2">
            <Switch
              id="challenge-only"
              checked={challengeOnly}
              onCheckedChange={(checked) => {
                setChallengeOnly(checked)
                setPage(1)
              }}
            />
            <Label htmlFor="challenge-only" className="text-sm text-muted-foreground">
              Challenge posts only
            </Label>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No posts in this queue</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <ReviewMediaCard
                source={post}
                title={post.title || post.caption}
                onDetails={() => {
                  setSelectedPost(post)
                  setMediaOpen(true)
                }}
              />
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{post.title || post.caption || 'Untitled'}</p>
                    {post.user?.username ? (
                      <p className="text-sm text-muted-foreground">@{post.user.username}</p>
                    ) : null}
                  </div>
                  <Badge variant="secondary">{post.status}</Badge>
                </div>
                {post.challenge_context ? (
                  <ChallengeContextBadge
                    context={post.challenge_context}
                    linkToApproverChallenge
                  />
                ) : null}
                {post.suspend_reason ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Reason: {post.suspend_reason}
                  </p>
                ) : null}
                {typeof post.report_count === 'number' && post.report_count > 0 ? (
                  <Badge variant="outline">{post.report_count} reports</Badge>
                ) : null}
                {post.approved_at ? (
                  <p className="text-xs text-muted-foreground">
                    Approved {new Date(post.approved_at).toLocaleString()}
                  </p>
                ) : null}
                {!readOnly ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => openAction(post, 'approve')} disabled={actionLoading}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openAction(post, 'reject')}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
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

      <PostMediaDialog
        source={selectedPost}
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        title={selectedPost?.title || selectedPost?.caption}
        description={selectedPost?.description || selectedPost?.caption}
      >
        <MediaProcessingNotice source={selectedPost} />
      </PostMediaDialog>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve post' : 'Reject post'}</DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'The post will be restored or published depending on its previous state.'
                : 'Notes are sent to the creator and may suspend the post.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-notes">
              {actionType === 'reject' ? 'Reason (required)' : 'Notes (optional)'}
            </Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'reject' ? 'Reason for rejection…' : 'Optional notes…'}
            />
            {actionType === 'reject' && !notes.trim() ? (
              <p className="text-sm text-destructive">A reason is required.</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={() => void executeAction()}
              disabled={actionLoading || (actionType === 'reject' && !notes.trim())}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
