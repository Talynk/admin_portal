"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIModerationReview } from "@/components/ai-moderation-review"
import { AIReviewAction } from "@/lib/types/moderation"
import {
  ArrowLeft,
  MoreHorizontal,
  Video,
  Image as ImageIcon,
  Play,
  Eye,
  Heart,
  MessageSquare,
  Flag,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Fence as Freeze,
  Download,
  Star,
  StarOff,
  Calendar,
  User,
  Share2,
  Brain,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { usePost } from "@/hooks/use-posts"
import { apiClient } from "@/lib/api-client"
import { getFileUrl, getFileType, getDownloadFilename, getBestDownloadUrl, downloadMediaFile, getProfilePictureUrl } from "@/lib/file-utils"
import { toast } from "@/hooks/use-toast"

function getContentType(post: any): "video" | "image" {
  if (post?.type === "video" || post?.fileType === "video") return "video"
  if (post?.type === "image" || post?.fileType === "image") return "image"
  const url = post?.video_url || post?.fullUrl || post?.videoUrl || ""
  if (!url) return "video"
  const type = getFileType(url)
  return type === "image" ? "image" : "video"
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = typeof params.id === "string" ? params.id : ""
  const { post, loading, error, refetch } = usePost(postId)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | "freeze" | "unfreeze" | "delete" | "feature" | "unfeature" | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [isReviewing, setIsReviewing] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    const fileUrl = getBestDownloadUrl(post as any)
    if (!fileUrl) {
      toast({ title: "Download unavailable", description: "No media URL for this post.", variant: "destructive" })
      return
    }
    const contentType = getContentType(post)
    const filename = getDownloadFilename(fileUrl, post?.id, contentType)
    setIsDownloading(true)
    try {
      const ok = await downloadMediaFile(fileUrl, filename)
      if (ok) {
        toast({ title: "Download started", description: `Saving as ${filename}` })
      } else {
        toast({ title: "Download failed", description: "Try again or open in new tab.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Download failed", description: "Try again or open in new tab.", variant: "destructive" })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleVideoAction = (action: typeof actionType) => {
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeAction = async () => {
    if (!post || !actionType) return
    setIsActionLoading(true)
    try {
      let result: { success?: boolean; error?: string } | undefined
      switch (actionType) {
        case "approve":
          result = await apiClient.approvePost(post.id, actionReason).then((r) => ({ success: r.success, error: r.error }))
          break
        case "reject":
          result = await apiClient.rejectPost(post.id, actionReason).then((r) => ({ success: r.success, error: r.error }))
          break
        case "suspend":
          result = await apiClient.suspendPost(post.id, actionReason).then((r) => ({ success: r.success, error: r.error }))
          break
        case "freeze":
          result = await apiClient.freezePost(post.id, actionReason).then((r) => ({ success: r.success, error: r.error }))
          break
        case "unfreeze":
          result = await apiClient.unfreezePost(post.id, actionReason).then((r) => ({ success: r.success, error: r.error }))
          break
        case "delete":
          result = await apiClient.deletePost(post.id).then((r) => ({ success: r.success, error: r.error }))
          if (result?.success) {
            router.push("/dashboard/content")
            return
          }
          break
        case "feature":
          result = await apiClient.featurePost(post.id, { reason: actionReason }).then((r) => ({ success: r.success, error: r.error }))
          break
        case "unfeature":
          result = await apiClient.unfeaturePost(post.id).then((r) => ({ success: r.success, error: r.error }))
          break
      }
      if (result?.success) {
        toast({ title: "Success", description: `Action completed successfully.` })
        refetch()
      } else {
        toast({ title: "Error", description: result?.error || "Action failed", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setIsActionLoading(false)
      setActionDialogOpen(false)
      setActionType(null)
      setActionReason("")
    }
  }

  const handleAIModerationAction = (action: AIReviewAction) => {
    setIsReviewing(true)
    setTimeout(() => setIsReviewing(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="border border-green-200 bg-green-100 text-green-800 dark:border-green-700/50 dark:bg-green-900/40 dark:text-green-200">
            Active
          </Badge>
        )
      case "draft":
        return (
          <Badge className="border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-200">
            Draft
          </Badge>
        )
      case "suspended":
        return (
          <Badge className="border border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-700/50 dark:bg-orange-900/40 dark:text-orange-200">
            Suspended
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="border border-border bg-muted text-muted-foreground dark:border-border/80">
            {status || "Unknown"}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px] gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading post...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !post) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Post not found</h1>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{error || "The requested post could not be found."}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/content")}>
                  Back to Content
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const mediaUrl = getFileUrl((post as any).video_url || (post as any).fullUrl || post.videoUrl)
  const downloadUrl = getBestDownloadUrl(post as any)
  const contentType = getContentType(post)
  const isFeatured = (post as any).is_featured ?? (post as any).featured ?? post.featured
  const isFrozen = (post as any).frozen ?? false
  const username = (post as any).user?.username ?? (post as any).username ?? "unknown"
  const userId = (post as any).user?.id ?? (post as any).userId
  const createdAt = (post as any).createdAt ?? (post as any).uploadDate
  const commentsCount = (post as any).comments_count ?? post.comments ?? 0
  const tags = (post as any).tags ?? []
  const category = typeof (post as any).category === "object" ? (post as any).category?.name : (post as any).category
  const aiMod = (post as any).aiModeration

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight line-clamp-2">{post.title || "Untitled"}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Post ID: {post.id}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleDownload} disabled={!downloadUrl || isDownloading}>
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {post.status === "draft" && (
                  <>
                    <DropdownMenuItem className="text-green-600" onClick={() => handleVideoAction("approve")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleVideoAction("reject")}>
                      <Ban className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {post.status === "active" && (
                  <DropdownMenuItem className="text-orange-600" onClick={() => handleVideoAction("suspend")}>
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {isFrozen ? (
                  <DropdownMenuItem className="text-blue-600" onClick={() => handleVideoAction("unfreeze")}>
                    <Play className="mr-2 h-4 w-4" />
                    Unfreeze
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-blue-600" onClick={() => handleVideoAction("freeze")}>
                    <Freeze className="mr-2 h-4 w-4" />
                    Freeze
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isFeatured ? (
                  <DropdownMenuItem className="text-yellow-600" onClick={() => handleVideoAction("unfeature")}>
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove from Featured
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-yellow-600" onClick={() => handleVideoAction("feature")}>
                    <Star className="mr-2 h-4 w-4" />
                    Add to Featured
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => handleVideoAction("delete")}>
                  <Ban className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai-moderation" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Moderation
                {aiMod?.flagged && <Badge className="bg-red-100 text-red-800 text-xs">Flagged</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Media Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {contentType === "video" ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        {contentType === "video" ? "Video" : "Image"} Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        {mediaUrl ? (
                          contentType === "video" ? (
                            <video
                              src={mediaUrl}
                              controls
                              className="w-full h-full object-contain"
                              poster={undefined}
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={mediaUrl}
                              alt={post.title || "Post"}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                if (e.currentTarget.src !== "/placeholder.svg") e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                          )
                        ) : (
                          <div className="text-white/70 text-center">
                            {contentType === "video" ? <Video className="w-16 h-16 mx-auto mb-2 opacity-50" /> : <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />}
                            <p className="text-sm">No media</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {(post as any).views ?? post.views ?? 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes.toLocaleString()} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {commentsCount} comments
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          {post.shares ?? 0} shares
                        </span>
                        {(post as any).duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {(post as any).duration}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={handleDownload} disabled={!downloadUrl || isDownloading}>
                          <Download className="w-4 h-4 mr-2" />
                          {isDownloading ? "Downloading..." : "Download"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Post Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {post.caption || post.description || "—"}
                        </p>
                      </div>
                      {tags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag: string) => (
                              <Badge key={tag} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {category && (
                        <div className="text-sm">
                          <strong>Category:</strong> <span className="text-muted-foreground">{category}</span>
                        </div>
                      )}
                      {(post as any).processing_status != null && (
                        <div className="pt-2 border-t">
                          <h4 className="font-medium mb-2">Processing</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={(post as any).processing_status === "completed" ? "default" : "secondary"}>
                              {(post as any).processing_status}
                            </Badge>
                            {(post as any).processing_error && (
                              <p className="text-sm text-destructive">{(post as any).processing_error}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Likers (from admin post by ID) */}
                  {Array.isArray((post as any).likers) && (post as any).likers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          Likers ({(post as any).likers.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                          {(post as any).likers.map((u: any) => (
                            <li key={u.id} className="flex items-center gap-2 text-sm">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={getProfilePictureUrl(u.profile_picture)} />
                                <AvatarFallback>{u.username?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">@{u.username}</span>
                              {u.display_name && <span className="text-muted-foreground">({u.display_name})</span>}
                              {u.liked_at && (
                                <span className="text-muted-foreground text-xs ml-auto">
                                  {new Date(u.liked_at).toLocaleDateString()}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Commenters */}
                  {Array.isArray((post as any).commenters) && (post as any).commenters.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Commenters ({(post as any).commenters.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 max-h-64 overflow-y-auto">
                          {(post as any).commenters.map((c: any) => (
                            <li key={c.id} className="text-sm border-b pb-2 last:border-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={getProfilePictureUrl(c.profile_picture)} />
                                  <AvatarFallback>{c.username?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">@{c.username}</span>
                                {(c.comment_date || c.createdAt) && (
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(c.comment_date || c.createdAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {c.comment_text && <p className="text-muted-foreground pl-8">{c.comment_text}</p>}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Activity timeline */}
                  {Array.isArray((post as any).activity) && (post as any).activity.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent activity</CardTitle>
                        <CardDescription>Last likes and comments</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {(post as any).activity.slice(0, 100).map((a: any, i: number) => (
                            <li key={a.id || i} className="flex items-center gap-2 text-sm">
                              {a.type === "like" ? (
                                <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="text-muted-foreground">
                                {a.type === "like"
                                  ? `${a.user?.username ?? "Someone"} liked`
                                  : `${a.user?.username ?? "Someone"} commented`}
                              </span>
                              {a.comment_text && (
                                <span className="truncate max-w-[200px] text-muted-foreground">"{a.comment_text}"</span>
                              )}
                              {a.createdAt && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {new Date(a.createdAt).toLocaleString()}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status & actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        {getStatusBadge(post.status)}
                      </div>
                      {isFeatured && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Featured</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        </div>
                      )}
                      {(post as any).flagged && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Flagged</span>
                          <Badge className="bg-red-100 text-red-800">
                            <Flag className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        </div>
                      )}
                      {(post as any).moderationNotes && (
                        <div>
                          <span className="text-sm font-medium">Moderation notes</span>
                          <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {(post as any).moderationNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Creator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getProfilePictureUrl((post as any).user?.profile_picture)} />
                          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">@{username}</p>
                          {userId && <p className="text-sm text-muted-foreground">ID: {userId}</p>}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {createdAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Uploaded: {new Date(createdAt).toLocaleString()}
                          </div>
                        )}
                        {(post as any).approvedDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4" />
                            Activated: {new Date((post as any).approvedDate).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {post.analytics && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {post.analytics.engagementRate != null && (
                          <div className="flex justify-between">
                            <span>Engagement rate</span>
                            <span className="text-muted-foreground">{post.analytics.engagementRate}%</span>
                          </div>
                        )}
                        {post.analytics.avgEngagementPerView != null && (
                          <div className="flex justify-between">
                            <span>Avg engagement/view</span>
                            <span className="text-muted-foreground">{post.analytics.avgEngagementPerView}</span>
                          </div>
                        )}
                        {post.analytics.riskScore != null && (
                          <div className="flex justify-between">
                            <span>Risk score</span>
                            <span className="text-muted-foreground">{post.analytics.riskScore}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-moderation" className="mt-6">
              {aiMod ? (
                <AIModerationReview
                  data={aiMod}
                  onAction={handleAIModerationAction}
                  isReviewing={isReviewing}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No AI moderation data for this post.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Action dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" && "Approve post"}
                {actionType === "reject" && "Reject post"}
                {actionType === "suspend" && "Suspend post"}
                {actionType === "freeze" && "Freeze post"}
                {actionType === "unfreeze" && "Unfreeze post"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete post"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "delete" &&
                  "This cannot be undone. The post and related data will be removed."}
                {actionType !== "delete" &&
                  `Confirm: ${actionType} for "${post?.title || "this post"}".`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">
                  {actionType === "reject" ? "Reason (optional)" : "Reason (optional)"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Reason..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={isActionLoading}>
                Cancel
              </Button>
              <Button
                variant={actionType === "delete" ? "destructive" : "default"}
                onClick={executeAction}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Confirm</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
