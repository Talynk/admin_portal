"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import {
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import type { LegacyMediaFields, PostPlaybackFields } from "@/lib/types/media"
import { ReviewMediaCard } from "@/components/media/review-media-card"
import { PostMediaDialog } from "@/components/media/post-media-dialog"

interface Post extends PostPlaybackFields, LegacyMediaFields {
  id: string
  title: string
  description?: string
  file_url?: string
  status: string
  approved_at?: string
  user: {
    username: string
  }
}

export default function ApprovedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadPosts()
  }, [page])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getApproverApprovedPosts({ page, limit: 12 })
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

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approved Posts</h1>
            <p className="text-muted-foreground">Draft posts you have reviewed and approved (now published as active)</p>
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
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No approved posts</h3>
                <p className="text-muted-foreground">You haven't approved any posts yet.</p>
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
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                        Approved
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{post.user.username} • {post.approved_at ? new Date(post.approved_at).toLocaleDateString() : ''}
                    </p>
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
