"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { 
  CheckCircle, 
  Loader2,
  ArrowLeft,
  Video,
  Image as ImageIcon,
} from "lucide-react"
import { getFileUrl } from "@/lib/file-utils"

interface Post {
  id: string
  title: string
  description?: string
  video_url?: string
  status: string
  type?: string
  approved_at?: string
  user: {
    username: string
  }
}

export default function ApprovedPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadPosts()
  }, [page])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getApproverApprovedPosts({ page, limit: 10 })
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

  const getContentType = (post: Post) => {
    if (post.type === 'video' || post.video_url?.match(/\.(mp4|mov|avi|webm)$/i)) {
      return 'video'
    }
    return 'image'
  }

  return (
    <ApproverProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/approver/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Approved Posts</h1>
              <p className="text-muted-foreground">Posts you have approved</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">No approved posts yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const contentType = getContentType(post)
                const mediaUrl = post.video_url
                const fileUrl = getFileUrl(mediaUrl)

                return (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-black">
                      {fileUrl ? (
                        contentType === 'video' ? (
                          <video
                            src={fileUrl}
                            className="w-full h-full object-contain"
                            controls
                          />
                        ) : (
                          <img
                            src={fileUrl}
                            alt={post.title}
                            className="w-full h-full object-contain"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {contentType === 'video' ? (
                            <Video className="w-12 h-12 text-gray-400" />
                          ) : (
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                        <Badge className="bg-green-100 text-green-800">Approved</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        @{post.user.username} • {post.approved_at ? new Date(post.approved_at).toLocaleDateString() : ''}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
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
        </div>
      </div>
    </ApproverProtectedRoute>
  )
}
