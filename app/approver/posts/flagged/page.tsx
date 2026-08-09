"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import {
  CheckCircle,
  XCircle,
  Loader2,
  Flag,
  AlertTriangle,
} from "lucide-react"
import { ChallengeContextBadge } from "@/components/challenge-context-badge"
import type { ChallengeContext } from "@/lib/types/challenge"
import type { LegacyMediaFields, PostPlaybackFields } from "@/lib/types/media"
import { ReviewMediaCard } from "@/components/media/review-media-card"
import { PostMediaDialog } from "@/components/media/post-media-dialog"

interface Post extends PostPlaybackFields, LegacyMediaFields {
  id: string
  title: string
  description?: string
  file_url?: string
  status: string
  is_frozen: boolean
  report_count?: number
  challenge_context?: ChallengeContext | null
  user: {
    username: string
  }
}

export default function FlaggedPostsPage() {
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
      const response = await apiClient.getApproverFlaggedPosts({ page, limit: 12 })
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
        description: "Notes are required for reviewing flagged posts",
        variant: "destructive",
      })
      return
    }

    setIsActionLoading(true)
    try {
      const response = await apiClient.reviewFlaggedPost(selectedPost.id, actionType, notes)

      if (response.success) {
        toast({
          title: "Success",
          description: `Flagged post ${actionType}d successfully`,
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
            <h1 className="text-3xl font-bold tracking-tight">Flagged Posts</h1>
            <p className="text-muted-foreground">Review posts with 5+ reports that have been frozen. Approve if no violations found, or reject if guidelines are violated.</p>
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
                <Flag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No flagged posts</h3>
                <p className="text-muted-foreground">No flagged posts to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="relative">
                    <ReviewMediaCard
                      source={post}
                      title={post.title}
                      onDetails={() => {
                        setSelectedPost(post)
                        setVideoDialogOpen(true)
                      }}
                    />
                    {post.report_count && post.report_count > 0 ? (
                      <Badge className="pointer-events-none absolute right-2 top-2 bg-red-600 hover:bg-red-600">
                        <Flag className="mr-1 h-3 w-3" />
                        {post.report_count} reports
                      </Badge>
                    ) : null}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                    {post.challenge_context ? (
                      <div className="mb-2">
                        <ChallengeContextBadge context={post.challenge_context} />
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground mb-4">
                      @{post.user.username}
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
                  {actionType === 'approve' ? 'Approve Flagged Post' : 'Reject Flagged Post'}
                </DialogTitle>
                <DialogDescription>
                  {actionType === 'approve'
                    ? `Approve "${selectedPost?.title}"? This will unfreeze the post.`
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
