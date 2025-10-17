"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  MoreHorizontal,
  Video,
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
  ExternalLink,
  Brain,
  Shield,
  Grid3X3,
  List,
  Calendar,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileImage,
} from "lucide-react"
import { usePosts } from "@/hooks/use-posts"
import { toast } from "@/hooks/use-toast"


export default function ContentPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "freeze" | "unfreeze" | "delete" | "feature" | "unfeature" | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [timeRange, setTimeRange] = useState("all")
  const [sortBy, setSortBy] = useState("uploadDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Use the API hook
  const {
    posts,
    loading,
    error,
    total,
    totalPages,
    refetch,
    updatePost,
    deletePost,
    approvePost,
    rejectPost,
    freezePost,
    unfreezePost,
    featurePost,
    unfeaturePost,
    flagPost,
    unflagPost,
  } = usePosts({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    flagged: activeTab === "flagged" ? true : undefined,
    featured: activeTab === "featured" ? true : undefined,
    frozen: activeTab === "frozen" ? true : undefined,
  })

  // Ensure posts is an array and filter based on additional filters (API handles main filtering)
  const videos = posts || []
  const filteredVideos = videos.filter((video) => {
    const matchesTab = (() => {
      switch (activeTab) {
        case "all":
          return true
        case "approved":
          return video.status === "approved"
        case "pending":
          return video.status === "pending"
        case "rejected":
          return video.status === "rejected"
        case "flagged":
          return video.flagged
        case "featured":
          return video.featured
        case "ai-flagged":
          return video.aiModeration?.flagged || false
        default:
          return true
      }
    })()

    const matchesTimeRange = (() => {
      const now = new Date()
      const videoDate = new Date(video.createdAt || video.uploadDate || new Date())
      const daysDiff = Math.floor((now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (timeRange) {
        case "today":
          return daysDiff === 0
        case "week":
          return daysDiff <= 7
        case "month":
          return daysDiff <= 30
        case "quarter":
          return daysDiff <= 90
        case "year":
          return daysDiff <= 365
        case "all":
        default:
          return true
      }
    })()

    return matchesTab && matchesTimeRange
  }).sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "uploadDate":
        aValue = new Date(a.createdAt || a.uploadDate || new Date()).getTime()
        bValue = new Date(b.createdAt || b.uploadDate || new Date()).getTime()
        break
      case "views":
        aValue = a.views
        bValue = b.views
        break
      case "likes":
        aValue = a.likes
        bValue = b.likes
        break
      case "comments":
        aValue = a.comments
        bValue = b.comments
        break
      case "title":
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case "username":
        aValue = (a.user?.username || a.username || '').toLowerCase()
        bValue = (b.user?.username || b.username || '').toLowerCase()
        break
      default:
        aValue = new Date(a.createdAt || a.uploadDate || new Date()).getTime()
        bValue = new Date(b.createdAt || b.uploadDate || new Date()).getTime()
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleVideoAction = (video: any, action: typeof actionType) => {
    setSelectedVideo(video)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeAction = async () => {
    if (!selectedVideo || !actionType) return

    setIsActionLoading(true)
    try {
      let result
          switch (actionType) {
            case "approve":
          result = await approvePost(selectedVideo.id, actionReason)
          break
            case "reject":
          result = await rejectPost(selectedVideo.id, actionReason)
          break
            case "freeze":
          result = await freezePost(selectedVideo.id, actionReason)
          break
            case "unfreeze":
          result = await unfreezePost(selectedVideo.id, actionReason)
          break
            case "feature":
          result = await featurePost(selectedVideo.id, actionReason)
          break
            case "unfeature":
          result = await unfeaturePost(selectedVideo.id, actionReason)
          break
        case "delete":
          result = await deletePost(selectedVideo.id)
          break
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: `Post ${actionType}d successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to perform action",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }

    setActionDialogOpen(false)
    setSelectedVideo(null)
    setActionType(null)
    setActionReason("")
  }

  const getStatusBadge = (status: string, frozen: boolean) => {
    if (frozen) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Frozen</Badge>
    }
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getContentType = (post: any) => {
    // Check if it's a video based on file extension or type
    if (post.type === 'video' || post.fileType === 'video' || 
        post.file_url?.includes('.mp4') || post.file_url?.includes('.mov') || 
        post.file_url?.includes('.avi') || post.file_url?.includes('.webm') ||
        post.mediaUrl?.includes('.mp4') || post.mediaUrl?.includes('.mov') || 
        post.mediaUrl?.includes('.avi') || post.mediaUrl?.includes('.webm')) {
      return 'video'
    }
    // Check if it's an image
    if (post.type === 'image' || post.fileType === 'image' || 
        post.file_url?.includes('.jpg') || post.file_url?.includes('.jpeg') || 
        post.file_url?.includes('.png') || post.file_url?.includes('.gif') || 
        post.file_url?.includes('.webp') ||
        post.mediaUrl?.includes('.jpg') || post.mediaUrl?.includes('.jpeg') || 
        post.mediaUrl?.includes('.png') || post.mediaUrl?.includes('.gif') || 
        post.mediaUrl?.includes('.webp')) {
      return 'image'
    }
    // Default to video for backward compatibility
    return 'video'
  }

  const getContentIcon = (post: any) => {
    const contentType = getContentType(post)
    return contentType === 'video' ? Video : ImageIcon
  }

  const getContentPreview = (post: any) => {
    const contentType = getContentType(post)
    if (contentType === 'video') {
      return (
        <div className="relative">
          <img
            src={post.thumbnail_url || post.thumbnail || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => openVideoPreview(post)}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <Button size="sm" variant="secondary" onClick={() => openVideoPreview(post)}>
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {post.duration}
          </div>
        </div>
      )
    } else {
      return (
        <div className="relative">
          <img
            src={post.file_url || post.thumbnail_url || post.thumbnail || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => openVideoPreview(post)}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <Button size="sm" variant="secondary" onClick={() => openVideoPreview(post)}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </div>
      )
    }
  }

  const openVideoPreview = (video: any) => {
    setSelectedVideo(video)
    setVideoDialogOpen(true)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
              <p className="text-muted-foreground">Review, moderate, and manage platform content</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading posts</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <FileImage className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : total}</div>
                <p className="text-xs text-muted-foreground">Total posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => getContentType(v) === 'video').length}
                </div>
                <p className="text-xs text-muted-foreground">Video content</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Images</CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => getContentType(v) === 'image').length}
                </div>
                <p className="text-xs text-muted-foreground">Image content</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => v.status === "pending").length}
                </div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => v.flagged).length}
                </div>
                <p className="text-xs text-muted-foreground">Needs review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured Content</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => v.featured).length}
                </div>
                <p className="text-xs text-muted-foreground">Highlighted content</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Flagged</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => v.aiModeration?.flagged).length}
                </div>
                <p className="text-xs text-muted-foreground">Requires AI review</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Management Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Search and manage platform content</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="flagged">Flagged</TabsTrigger>
                  <TabsTrigger value="featured">Featured</TabsTrigger>
                  <TabsTrigger value="ai-flagged">AI Flagged</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-6">
                  <div className="space-y-4 mb-6">
                    {/* Search and Primary Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by content ID, title, username, or tags..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 hover:border-blue-300 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="hover:bg-primary/90 hover:scale-105 transition-all duration-200"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "table" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("table")}
                          className="hover:bg-primary/90 hover:scale-105 transition-all duration-200"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Time Range and Sorting Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="quarter">This Quarter</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uploadDate">Upload Date</SelectItem>
                          <SelectItem value="views">Views</SelectItem>
                          <SelectItem value="likes">Likes</SelectItem>
                          <SelectItem value="comments">Comments</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="username">Creator</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="hover:bg-muted hover:scale-105 transition-all duration-200"
                      >
                        {sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">
                          {sortOrder === "asc" ? "Ascending" : "Descending"}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Content Display */}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-muted-foreground">Loading posts...</span>
                    </div>
                  ) : viewMode === "grid" ? (
                    /* Grid View */
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredVideos.map((video) => (
                        <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                          <div className="relative">
                            {getContentPreview(video)}
                            {video.flagged && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-red-500 text-white">
                                  <Flag className="w-3 h-3 mr-1" />
                                  Flagged
                                </Badge>
                              </div>
                            )}
                            {video.featured && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-yellow-500 text-white">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              </div>
                            )}
                            {video.aiModeration?.flagged && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-purple-500 text-white">
                                  <Brain className="w-3 h-3 mr-1" />
                                  AI Flagged
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openVideoPreview(video)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview Content
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}`, '_blank')}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Full Details
                                  </DropdownMenuItem>
                                  {video.aiModeration && (
                                    <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}?tab=ai-moderation`, '_blank')}>
                                      <Brain className="mr-2 h-4 w-4" />
                                      Review AI Analysis
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {video.status === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        className="text-green-600"
                                        onClick={() => handleVideoAction(video, "approve")}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleVideoAction(video, "reject")}
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {video.frozen ? (
                                    <DropdownMenuItem
                                      className="text-blue-600"
                                      onClick={() => handleVideoAction(video, "unfreeze")}
                                    >
                                      <Play className="mr-2 h-4 w-4" />
                                      Unfreeze Post
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-blue-600"
                                      onClick={() => handleVideoAction(video, "freeze")}
                                    >
                                      <Freeze className="mr-2 h-4 w-4" />
                                      Freeze Post
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {video.featured ? (
                                    <DropdownMenuItem
                                      className="text-yellow-600"
                                      onClick={() => handleVideoAction(video, "unfeature")}
                                    >
                                      <StarOff className="mr-2 h-4 w-4" />
                                      Remove from Featured
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-yellow-600"
                                      onClick={() => handleVideoAction(video, "feature")}
                                    >
                                      <Star className="mr-2 h-4 w-4" />
                                      Add to Featured
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleVideoAction(video, "delete")}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                      Delete Content
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="/generic-placeholder-graphic.png" />
                                <AvatarFallback>{(video.user?.username || video.username || 'U').charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">@{video.user?.username || video.username || 'unknown'}</span>
                              <span className="text-xs text-muted-foreground">ID: {video.id}</span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              {getStatusBadge(video.status, video.frozen || false)}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {video.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {video.likes.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {video.comments_count || video.comments || 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {(video.tags || []).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <p>Uploaded: {new Date(video.createdAt || video.uploadDate || new Date()).toLocaleDateString()}</p>
                              {video.approvedDate && <p>Approved: {new Date(video.approvedDate).toLocaleDateString()}</p>}
                              {video.moderationNotes && (
                                <p className="text-red-600 mt-1">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  {video.moderationNotes}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* Table View */
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Content</TableHead>
                            <TableHead>Creator</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Likes</TableHead>
                            <TableHead>Upload Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVideos.map((video) => (
                            <TableRow key={video.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-16 h-12 rounded overflow-hidden">
                                    <img
                                      src={video.thumbnail_url || video.thumbnail || video.file_url || "/placeholder.svg"}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1 left-1">
                                      {getContentIcon(video) === Video ? (
                                        <Video className="w-3 h-3 text-white bg-black/50 rounded" />
                                      ) : (
                                        <ImageIcon className="w-3 h-3 text-white bg-black/50 rounded" />
                                      )}
                                    </div>
                                    {video.flagged && (
                                      <div className="absolute top-1 left-1">
                                        <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                                          <Flag className="w-2 h-2 mr-1" />
                                        </Badge>
                                      </div>
                                    )}
                                    {video.featured && (
                                      <div className="absolute top-1 right-1">
                                        <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                                          <Star className="w-2 h-2 mr-1" />
                                        </Badge>
                                      </div>
                                    )}
                                    {video.aiModeration?.flagged && (
                                      <div className="absolute bottom-1 left-1">
                                        <Badge className="bg-purple-500 text-white text-xs px-1 py-0">
                                          <Brain className="w-2 h-2 mr-1" />
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{video.title}</p>
                                    <p className="text-xs text-muted-foreground">ID: {video.id}</p>
                                    <p className="text-xs text-muted-foreground">{video.duration}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src="/generic-placeholder-graphic.png" />
                                    <AvatarFallback className="text-xs">{(video.user?.username || video.username || 'U').charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">@{video.user?.username || video.username || 'unknown'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(video.status, video.frozen || false)}
                                  {video.featured && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                      <Star className="w-3 h-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Eye className="w-3 h-3" />
                                  {video.views.toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Heart className="w-3 h-3" />
                                  {video.likes.toLocaleString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(video.createdAt || video.uploadDate || new Date()).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openVideoPreview(video)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Preview Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}`, '_blank')}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View Full Details
                                    </DropdownMenuItem>
                                    {video.aiModeration && (
                                      <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}?tab=ai-moderation`, '_blank')}>
                                        <Brain className="mr-2 h-4 w-4" />
                                        Review AI Analysis
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {video.status === "pending" && (
                                      <>
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() => handleVideoAction(video, "approve")}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleVideoAction(video, "reject")}
                                        >
                                          <Ban className="mr-2 h-4 w-4" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {video.frozen ? (
                                      <DropdownMenuItem
                                        className="text-blue-600"
                                        onClick={() => handleVideoAction(video, "unfreeze")}
                                      >
                                        <Play className="mr-2 h-4 w-4" />
                                        Unfreeze Post
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        className="text-blue-600"
                                        onClick={() => handleVideoAction(video, "freeze")}
                                      >
                                        <Freeze className="mr-2 h-4 w-4" />
                                        Freeze Post
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {video.featured ? (
                                      <DropdownMenuItem
                                        className="text-yellow-600"
                                        onClick={() => handleVideoAction(video, "unfeature")}
                                      >
                                        <StarOff className="mr-2 h-4 w-4" />
                                        Remove from Featured
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        className="text-yellow-600"
                                        onClick={() => handleVideoAction(video, "feature")}
                                      >
                                        <Star className="mr-2 h-4 w-4" />
                                        Add to Featured
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleVideoAction(video, "delete")}
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Delete Content
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {filteredVideos.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No posts found matching your criteria.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" && "Approve Content"}
                {actionType === "reject" && "Reject Content"}
                {actionType === "freeze" && "Freeze Post"}
                {actionType === "unfreeze" && "Unfreeze Post"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete Content"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" &&
                  `Are you sure you want to approve "${selectedVideo?.title}"? This will make it visible to all users.`}
                {actionType === "reject" &&
                  `Are you sure you want to reject "${selectedVideo?.title}"? This will prevent it from being published.`}
                {actionType === "freeze" &&
                  `Are you sure you want to freeze "${selectedVideo?.title}"? This will temporarily disable the post.`}
                {actionType === "unfreeze" &&
                  `Are you sure you want to unfreeze "${selectedVideo?.title}"? This will restore the post.`}
                {actionType === "feature" &&
                  `Are you sure you want to feature "${selectedVideo?.title}"? This will highlight it for all users.`}
                {actionType === "unfeature" &&
                  `Are you sure you want to remove "${selectedVideo?.title}" from featured? This will remove the highlight.`}
                {actionType === "delete" &&
                  `Are you sure you want to delete "${selectedVideo?.title}"? This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">
                  {actionType === "freeze" || actionType === "reject" ? "Reason (required)" : "Reason (optional)"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for this action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialogOpen(false)}
                disabled={isActionLoading}
                className="hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                variant={actionType === "delete" ? "destructive" : "default"} 
                onClick={executeAction}
                disabled={isActionLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                {actionType === "approve" && "Approve Content"}
                {actionType === "reject" && "Reject Content"}
                {actionType === "freeze" && "Freeze Post"}
                {actionType === "unfreeze" && "Unfreeze Post"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete Content"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Content Preview Dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedVideo?.title}</DialogTitle>
              <DialogDescription>Content ID: {selectedVideo?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                {selectedVideo && getContentType(selectedVideo) === 'video' ? (
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">Video Preview</p>
                  <p className="text-xs opacity-50">Duration: {selectedVideo?.duration}</p>
                </div>
                ) : (
                  <div className="text-white text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm opacity-75">Image Preview</p>
                    <p className="text-xs opacity-50">Click to view full size</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Creator:</strong> @{selectedVideo?.user?.username || selectedVideo?.username}
                  </p>
                  <p>
                    <strong>Upload Date:</strong>{" "}
                    {selectedVideo && new Date(selectedVideo.createdAt || selectedVideo.uploadDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedVideo?.status}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Views:</strong> {selectedVideo?.views.toLocaleString()}
                  </p>
                  <p>
                    <strong>Likes:</strong> {selectedVideo?.likes.toLocaleString()}
                  </p>
                  <p>
                    <strong>Comments:</strong> {selectedVideo?.comments_count || selectedVideo?.comments || 0}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Description:</strong>
                </p>
                <p className="text-sm text-muted-foreground">{selectedVideo?.caption || selectedVideo?.description}</p>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Tags:</strong>
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedVideo?.tags || []).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
