"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import {
  Ban,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { ChallengeContextBadge } from "@/components/challenge-context-badge"
import type { ChallengeContext } from "@/lib/types/challenge"
import type { LegacyMediaFields, PostPlaybackFields } from "@/lib/types/media"
import { ReviewMediaCard } from "@/components/media/review-media-card"
import { PostMediaDialog } from "@/components/media/post-media-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Post extends PostPlaybackFields, LegacyMediaFields {
  id: string
  title: string
  description?: string
  file_url?: string
  status: string
  suspended_at?: string
  suspend_reason?: string
  report_count?: number
  challenge_context?: ChallengeContext | null
  user: {
    username: string
    email: string
  }
}

export default function SuspendedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadPosts()
  }, [page])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      // Get suspended posts (flagged posts are the same as suspended)
      const response = await apiClient.getApproverSuspendedPosts({ page, limit: 12 })
      if (response.success && response.data) {
        setPosts(response.data.posts || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      } else {
        setError(response.error || 'Failed to load posts')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (post: Post, action: 'approve' | 'reject') => {
    setSelectedPost(post)
    setActionType(action)
    setActionDialogOpen(true)
    setNotes('')
  }

  const executeReview = async () => {
    if (!selectedPost || !actionType) return

    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Notes are required for reviewing suspended posts",
        variant: "destructive",
      })
      return
    }

    setIsActionLoading(true)
    try {
      let response
      if (actionType === 'approve') {
        // Use reviewFlaggedPost to approve (unfreeze and approve)
        response = await apiClient.reviewFlaggedPost(selectedPost.id, 'approve', notes)
      } else {
        // Use reviewFlaggedPost to reject
        response = await apiClient.reviewFlaggedPost(selectedPost.id, 'reject', notes)
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `Suspended post ${actionType}d successfully`,
        })
        setActionDialogOpen(false)
        setSelectedPost(null)
        setActionType(null)
        setNotes('')
        loadPosts()
      } else {
        toast({
          title: "Error",
          description: response.error || `Failed to ${actionType} post`,
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suspended Posts</h1>
            <p className="text-muted-foreground">Review suspended posts (flagged by admin/approver or with 5+ reports). Approve if no violations found, or reject if guidelines are violated.</p>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error loading posts</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Ban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No suspended posts</h3>
                <p className="text-muted-foreground">There are no suspended posts to display.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <ReviewMediaCard
                    source={post}
                    title={post.title}
                    onDetails={() => {
                      setSelectedPost(post)
                      setVideoDialogOpen(true)
                    }}
                  />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                        <Ban className="w-3 h-3 mr-1" />
                        Suspended
                      </Badge>
                    </div>
                    {post.challenge_context ? (
                      <div className="mb-2">
                        <ChallengeContextBadge context={post.challenge_context} />
                      </div>
                    ) : null}
                    {post.suspend_reason && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        Reason: {post.suspend_reason}
                      </p>
                    )}
                    {post.report_count && post.report_count > 0 && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Reports: {post.report_count}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      @{post.user.username} • {post.suspended_at ? new Date(post.suspended_at).toLocaleDateString() : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleReview(post, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReview(post, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Review Dialog */}
          <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === 'approve' ? 'Approve Suspended Post' : 'Reject Suspended Post'}
                </DialogTitle>
                <DialogDescription>
                  {actionType === 'approve'
                    ? `Approve "${selectedPost?.title}"? This will unfreeze and approve the post.`
                    : `Reject "${selectedPost?.title}"? Please provide review notes.`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Review Notes (required)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter your review notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionDialogOpen(false)
                    setNotes('')
                  }}
                  disabled={isActionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionType === 'approve' ? 'default' : 'destructive'}
                  onClick={executeReview}
                  disabled={isActionLoading || !notes.trim()}
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    actionType === 'approve' ? 'Approve' : 'Reject'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PostMediaDialog
            source={selectedPost}
            open={videoDialogOpen}
            onOpenChange={setVideoDialogOpen}
            title={selectedPost?.title}
            description={selectedPost?.description}
          />
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
