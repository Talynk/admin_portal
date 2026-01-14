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
  Video,
  Image as ImageIcon,
  Flag,
  AlertTriangle,
  Eye,
  Play,
  Ban,
} from "lucide-react"
import { getFileUrl } from "@/lib/file-utils"

interface Post {
  id: string
  title: string
  description?: string
  video_url?: string
  file_url?: string
  status: string
  type?: string
  is_frozen: boolean
  report_count?: number
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
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

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

  const getContentType = (post: Post) => {
    if (post.type === 'video' || post.video_url?.match(/\.(mp4|mov|avi|webm)$/i)) {
      return 'video'
    }
    return 'image'
  }

  const MediaIconCard = ({ post }: { post: Post }) => {
    const contentType = getContentType(post)
    const ContentIcon = contentType === 'video' ? Video : ImageIcon
    const mediaUrl = post.video_url || post.file_url
    const fileUrl = mediaUrl ? getFileUrl(mediaUrl) : null
    const isPlaying = playingVideo === post.id

    const handlePlayClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isPlaying) {
        setPlayingVideo(null)
      } else {
        setPlayingVideo(post.id)
      }
    }

    const handleCloseMedia = (e: React.MouseEvent) => {
      e.stopPropagation()
      setPlayingVideo(null)
    }

    return (
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden rounded-t-lg flex items-center justify-center group">
        {isPlaying && fileUrl ? (
          <>
            {contentType === 'video' ? (
              <video
                src={fileUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={fileUrl}
                alt={post.title}
                className="w-full h-full object-contain bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 bg-black/70 dark:bg-black/80 hover:bg-black/90 dark:hover:bg-black text-white shadow-lg z-10 border border-white/20"
              onClick={handleCloseMedia}
            >
              <Ban className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-6 shadow-lg">
                <ContentIcon className="w-12 h-12 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {contentType === 'video' ? 'Video' : 'Image'}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xl border border-gray-300 dark:border-gray-600 font-medium transition-all hover:scale-105 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPost(post)
                  setVideoDialogOpen(true)
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              {fileUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xl border border-gray-300 dark:border-gray-600 font-medium transition-all hover:scale-105 backdrop-blur-sm"
                  onClick={handlePlayClick}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {contentType === 'video' ? 'Play' : 'View'}
                </Button>
              )}
            </div>
            {post.report_count && post.report_count > 0 && (
              <Badge className="absolute top-2 right-2 bg-red-600">
                <Flag className="w-3 h-3 mr-1" />
                {post.report_count} reports
              </Badge>
            )}
          </>
        )}
      </div>
    )
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
                  <MediaIconCard post={post} />
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
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

          {/* Video/Image Preview Dialog */}
          <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedPost?.title}</DialogTitle>
                <DialogDescription>
                  {selectedPost?.description || 'No description available'}
                </DialogDescription>
              </DialogHeader>
              {selectedPost && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {(() => {
                    const contentType = getContentType(selectedPost)
                    const mediaUrl = selectedPost.video_url || selectedPost.file_url
                    const fileUrl = mediaUrl ? getFileUrl(mediaUrl) : null
                    
                    if (!fileUrl) {
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          {contentType === 'video' ? (
                            <Video className="w-16 h-16 text-gray-400" />
                          ) : (
                            <ImageIcon className="w-16 h-16 text-gray-400" />
                          )}
                        </div>
                      )
                    }

                    return contentType === 'video' ? (
                      <video src={fileUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={fileUrl} alt={selectedPost.title} className="w-full h-full object-contain" />
                    )
                  })()}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
