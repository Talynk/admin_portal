"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreHorizontal,
  Video,
  Play,
  Eye,
  Heart,
  MessageSquare,
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
} from "lucide-react";
import { usePosts } from "@/hooks/use-posts";
import { toast } from "@/hooks/use-toast";
import { getFileUrl } from "@/lib/file-utils";

export default function ContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    | "approve"
    | "reject"
    | "delete"
    | "feature"
    | "unfeature"
    | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [actionExpiresAt, setActionExpiresAt] = useState("");
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [timeRange, setTimeRange] = useState("all");
  const [sortBy, setSortBy] = useState("uploadDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Determine status filter based on active tab and status filter dropdown
  const getStatusFilter = () => {
    if (statusFilter !== "all") {
      return statusFilter;
    }
    // If status filter is "all", check active tab
    if (activeTab === "draft") return "draft";
    if (activeTab === "active") return "active";
    if (activeTab === "suspended") return "suspended";
    return undefined;
  };

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
    featurePost,
    unfeaturePost,
    flagPost,
    unflagPost,
  } = usePosts({
    search: searchTerm || undefined,
    status: getStatusFilter(),
    featured: activeTab === "featured" ? true : undefined,
  });

  // Ensure posts is an array and filter based on additional filters (API handles main filtering)
  const videos = posts || [];
  const filteredVideos = videos
    .filter((video) => {
      const matchesTab = (() => {
        switch (activeTab) {
          case "all":
            return true;
          case "draft":
            return video.status === "draft";
          case "active":
            return video.status === "active";
          case "suspended":
            return video.status === "suspended";
          case "featured":
            return (video as any).is_featured === true || (video as any).featured === true;
          default:
            return true;
        }
      })();

      const matchesTimeRange = (() => {
        const now = new Date();
        const videoDate = new Date(
          video.createdAt || video.uploadDate || new Date()
        );
        const daysDiff = Math.floor(
          (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (timeRange) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          case "quarter":
            return daysDiff <= 90;
          case "year":
            return daysDiff <= 365;
          case "all":
          default:
            return true;
        }
      })();

      return matchesTab && matchesTimeRange;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "uploadDate":
          aValue = new Date(
            a.createdAt || a.uploadDate || new Date()
          ).getTime();
          bValue = new Date(
            b.createdAt || b.uploadDate || new Date()
          ).getTime();
          break;
        case "views":
          aValue = a.views;
          bValue = b.views;
          break;
        case "likes":
          aValue = a.likes;
          bValue = b.likes;
          break;
        case "comments":
          aValue = a.comments;
          bValue = b.comments;
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "username":
          aValue = (a.user?.username || a.username || "").toLowerCase();
          bValue = (b.user?.username || b.username || "").toLowerCase();
          break;
        default:
          aValue = new Date(
            a.createdAt || a.uploadDate || new Date()
          ).getTime();
          bValue = new Date(
            b.createdAt || b.uploadDate || new Date()
          ).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleVideoAction = (video: any, action: typeof actionType) => {
    setSelectedVideo(video);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedVideo || !actionType) return;

    setIsActionLoading(true);
    try {
      let result;
      switch (actionType) {
        case "approve":
          result = await approvePost(selectedVideo.id, actionReason);
          break;
        case "reject":
          result = await rejectPost(selectedVideo.id, actionReason);
          break;
        case "feature":
          // Convert datetime-local to ISO 8601 format
          const expiresAtISO = actionExpiresAt 
            ? new Date(actionExpiresAt).toISOString()
            : undefined;
          result = await featurePost(selectedVideo.id, {
            reason: actionReason || undefined,
            expiresAt: expiresAtISO,
          });
          break;
        case "unfeature":
          result = await unfeaturePost(selectedVideo.id);
          break;
        case "delete":
          result = await deletePost(selectedVideo.id);
          break;
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: `Post ${actionType}d successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to perform action",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }

    setActionDialogOpen(false);
    setSelectedVideo(null);
    setActionType(null);
    setActionReason("");
    setActionExpiresAt("");
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30">
            Active
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
            Draft
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30">
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getContentType = (post: any) => {
    // Check type field first (most reliable)
    if (post.type === "video" || post.fileType === "video") {
      return "video";
    }
    if (post.type === "image" || post.fileType === "image") {
      return "image";
    }
    
    // Fallback: check URL extension
    const mediaUrl = post.video_url || post.fullUrl || '';
    if (!mediaUrl) return "video"; // Default
    
    const urlLower = mediaUrl.toLowerCase();
    
    // Check video extensions
    if (urlLower.match(/\.(mp4|mov|avi|webm|mkv|flv)$/)) {
      return "video";
    }
    // Check image extensions
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return "image";
    }
    
    // Default to video
    return "video";
  };

  const getContentIcon = (post: any) => {
    const contentType = getContentType(post);
    return contentType === "video" ? Video : ImageIcon;
  };

  // Simple media icon card - no previews, just icon and buttons
  const MediaIconCard = ({ post }: { post: any }) => {
    const contentType = getContentType(post);
    const ContentIcon = contentType === "video" ? Video : ImageIcon;
    // All URLs from API are already complete R2 CDN URLs - use directly
    const mediaUrl = post.video_url || post.fullUrl || null;
    const fileUrl = mediaUrl; // Already a complete URL, no processing needed
    const isPlaying = playingVideo === post.id;

    const handlePlayClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPlaying) {
        setPlayingVideo(null);
      } else {
        setPlayingVideo(post.id);
      }
    };

    const handleCloseMedia = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPlayingVideo(null);
    };

    return (
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden rounded-t-lg flex items-center justify-center group">
        {isPlaying && fileUrl ? (
          /* Media playing/viewing state */
          <>
            {contentType === "video" ? (
              <video
                src={fileUrl || undefined}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('Video load error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={fileUrl || '/placeholder.svg'}
                alt={post.title || post.caption || 'Image'}
                className="w-full h-full object-contain bg-black"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  if (e.currentTarget.src !== '/placeholder.svg') {
                    e.currentTarget.src = '/placeholder.svg';
                  }
                }}
              />
            )}
            {/* Close button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 bg-black/70 dark:bg-black/80 hover:bg-black/90 dark:hover:bg-black text-white shadow-lg z-10 border border-white/20"
              onClick={handleCloseMedia}
            >
              <Ban className="w-4 h-4" />
            </Button>
            {/* Duration badge for videos */}
            {contentType === "video" && post.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {post.duration}
              </div>
            )}
          </>
        ) : (
          /* Icon state */
          <>
            {/* Main icon */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-6 shadow-lg">
                <ContentIcon className="w-12 h-12 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {contentType === "video" ? "Video" : "Image"}
              </div>
            </div>

            {/* Action buttons overlay */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xl border border-gray-300 dark:border-gray-600 font-medium transition-all hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  openVideoPreview(post);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              {fileUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xl border border-gray-300 dark:border-gray-600 font-medium transition-all hover:scale-105"
                  onClick={handlePlayClick}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {contentType === "video" ? "Play" : "View"}
                </Button>
              )}
            </div>

            {/* Duration badge for videos */}
            {contentType === "video" && post.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {post.duration}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const getContentPreview = (post: any) => {
    return <MediaIconCard post={post} />;
  };

  const openVideoPreview = (video: any) => {
    setSelectedVideo(video);
    setVideoDialogOpen(true);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Content Management
              </h1>
              <p className="text-muted-foreground">
                Review, moderate, and manage platform content
              </p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : videos.filter((v) => getContentType(v) === "video")
                        .length}
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
                  {loading
                    ? "..."
                    : videos.filter((v) => getContentType(v) === "image")
                        .length}
                </div>
                <p className="text-xs text-muted-foreground">Image content</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Draft Content
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : videos.filter((v) => v.status === "draft").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Draft posts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Content
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : videos.filter((v) => v.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">Active posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Suspended Content
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "..."
                    : videos.filter(
                        (v) =>
                          v.status === "suspended" || (v as any).is_suspended === true || (v as any).suspended === true
                      ).length}
                </div>
                <p className="text-xs text-muted-foreground">Suspended posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Featured Content
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : videos.filter((v) => (v as any).is_featured === true || (v as any).featured === true).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Highlighted content
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Management Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Search and manage platform content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="suspended">Suspended</TabsTrigger>
                  <TabsTrigger value="featured">Featured</TabsTrigger>
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
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
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
                          <SelectItem value="uploadDate">
                            Upload Date
                          </SelectItem>
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
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
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
                      <span className="ml-2 text-muted-foreground">
                        Loading posts...
                      </span>
                    </div>
                  ) : viewMode === "grid" ? (
                    /* Grid View */
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredVideos.map((video) => (
                        <Card
                          key={video.id}
                          className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                        >
                          <div className="relative">
                            {getContentPreview(video)}
                            {(video as any).is_featured && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-yellow-500 text-white">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                  {video.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {video.description}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => openVideoPreview(video)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview Content
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      window.open(
                                        `/dashboard/content/${video.id}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Full Details
                                  </DropdownMenuItem>
                                  {video.aiModeration && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        window.open(
                                          `/dashboard/content/${video.id}?tab=ai-moderation`,
                                          "_blank"
                                        )
                                      }
                                    >
                                      <Brain className="mr-2 h-4 w-4" />
                                      Review AI Analysis
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {video.status === "draft" && (
                                    <>
                                      <DropdownMenuItem
                                        className="text-green-600"
                                        onClick={() =>
                                          handleVideoAction(video, "approve")
                                        }
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() =>
                                          handleVideoAction(video, "reject")
                                        }
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Suspend
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  {(video as any).is_featured || (video as any).featured ? (
                                    <DropdownMenuItem
                                      className="text-yellow-600"
                                      onClick={() =>
                                        handleVideoAction(video, "unfeature")
                                      }
                                    >
                                      <StarOff className="mr-2 h-4 w-4" />
                                      Remove from Featured
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-yellow-600"
                                      onClick={() =>
                                        handleVideoAction(video, "feature")
                                      }
                                    >
                                      <Star className="mr-2 h-4 w-4" />
                                      Add to Featured
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleVideoAction(video, "delete")
                                    }
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
                                <AvatarFallback>
                                  {(
                                    video.user?.username ||
                                    video.username ||
                                    "U"
                                  ).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                @
                                {video.user?.username ||
                                  video.username ||
                                  "unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {video.id}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              {getStatusBadge(video.status || "draft")}
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
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <p>
                                Uploaded:{" "}
                                {new Date(
                                  video.createdAt ||
                                    video.uploadDate ||
                                    new Date()
                                ).toLocaleDateString()}
                              </p>
                              {video.approvedDate && (
                                <p>
                                  Activated:{" "}
                                  {new Date(
                                    video.approvedDate
                                  ).toLocaleDateString()}
                                </p>
                              )}
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
                            <TableRow
                              key={video.id}
                              className="hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="relative w-16 h-12 rounded overflow-hidden cursor-pointer group"
                                    onClick={() => openVideoPreview(video)}
                                  >
                                    {getContentType(video) === "video" ? (
                                      <>
                                        <img
                                          src={
                                            getFileUrl((video as any).video_url || (video as any).fullUrl) ||
                                            "/placeholder.svg"
                                          }
                                          alt={video.title || video.caption || 'Video thumbnail'}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                          onError={(e) => {
                                            if (e.currentTarget.src !== '/placeholder.svg') {
                                              e.currentTarget.src = '/placeholder.svg'
                                            }
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Play className="w-4 h-4 text-white" />
                                        </div>
                                      </>
                                    ) : (
                                      <img
                                        src={
                                          getFileUrl((video as any).video_url || (video as any).fullUrl) ||
                                          "/placeholder.svg"
                                        }
                                        alt={video.title || video.caption || 'Image'}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          if (e.currentTarget.src !== '/placeholder.svg') {
                                            e.currentTarget.src = '/placeholder.svg'
                                          }
                                        }}
                                      />
                                    )}
                                    <div className="absolute top-1 left-1">
                                      {getContentIcon(video) === Video ? (
                                        <Video className="w-3 h-3 text-white bg-black/50 rounded" />
                                      ) : (
                                        <ImageIcon className="w-3 h-3 text-white bg-black/50 rounded" />
                                      )}
                                    </div>
                                    {(video as any).is_featured && (
                                      <div className="absolute top-1 right-1">
                                        <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                                          <Star className="w-2 h-2 mr-1" />
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">
                                      {video.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {video.id}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {video.duration}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src="/generic-placeholder-graphic.png" />
                                    <AvatarFallback className="text-xs">
                                      {(
                                        video.user?.username ||
                                        video.username ||
                                        "U"
                                      ).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    @
                                    {video.user?.username ||
                                      video.username ||
                                      "unknown"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(video.status || "draft")}
                                    {(video as any).is_featured && (
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
                                  {new Date(
                                    video.createdAt ||
                                      video.uploadDate ||
                                      new Date()
                                  ).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => openVideoPreview(video)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Preview Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        window.open(
                                          `/dashboard/content/${video.id}`,
                                          "_blank"
                                        )
                                      }
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View Full Details
                                    </DropdownMenuItem>
                                    {video.aiModeration && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          window.open(
                                            `/dashboard/content/${video.id}?tab=ai-moderation`,
                                            "_blank"
                                          )
                                        }
                                      >
                                        <Brain className="mr-2 h-4 w-4" />
                                        Review AI Analysis
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {video.status === "draft" && (
                                      <>
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() =>
                                            handleVideoAction(video, "approve")
                                          }
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            handleVideoAction(video, "reject")
                                          }
                                        >
                                          <Ban className="mr-2 h-4 w-4" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    {(video as any).is_featured || (video as any).featured ? (
                                      <DropdownMenuItem
                                        className="text-yellow-600"
                                        onClick={() =>
                                          handleVideoAction(video, "unfeature")
                                        }
                                      >
                                        <StarOff className="mr-2 h-4 w-4" />
                                        Remove from Featured
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        className="text-yellow-600"
                                        onClick={() =>
                                          handleVideoAction(video, "feature")
                                        }
                                      >
                                        <Star className="mr-2 h-4 w-4" />
                                        Add to Featured
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        handleVideoAction(video, "delete")
                                      }
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
                      <p className="text-muted-foreground">
                        No posts found matching your criteria.
                      </p>
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
                {actionType === "approve" && "Activate Content"}
                {actionType === "reject" && "Suspend Content"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete Content"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" &&
                  `Are you sure you want to activate "${selectedVideo?.title}"? This will make it visible to all users.`}
                {actionType === "reject" &&
                  `Are you sure you want to suspend "${selectedVideo?.title}"? This will prevent it from being visible.`}
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
                  {actionType === "reject"
                    ? "Reason (required)"
                    : "Reason (optional)"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for this action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
              {actionType === "feature" && (
                <div>
                  <Label htmlFor="expiresAt">
                    Expiration Date (optional)
                  </Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={actionExpiresAt}
                    onChange={(e) => setActionExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to feature indefinitely
                  </p>
                </div>
              )}
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
                    {actionType === "approve" && "Activate Content"}
                    {actionType === "reject" && "Suspend Content"}
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
              <DialogDescription>
                Content ID: {selectedVideo?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                {selectedVideo && getContentType(selectedVideo) === "video" ? (
                  <video
                    src={getFileUrl((selectedVideo as any).video_url || (selectedVideo as any).fullUrl) || undefined}
                    controls
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Video load error:', e)
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : selectedVideo && getContentType(selectedVideo) === "image" ? (
                  <img
                    src={getFileUrl((selectedVideo as any).video_url || (selectedVideo as any).fullUrl) || '/placeholder.svg'}
                    alt={selectedVideo.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg'
                    }}
                  />
                ) : (
                  <div className="text-white text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm opacity-75">Text Post</p>
                    <p className="text-xs opacity-50">
                      No media content
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Creator:</strong> @
                    {selectedVideo?.user?.username || selectedVideo?.username}
                  </p>
                  <p>
                    <strong>Upload Date:</strong>{" "}
                    {selectedVideo &&
                      new Date(
                        selectedVideo.createdAt || selectedVideo.uploadDate
                      ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedVideo?.status}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Views:</strong>{" "}
                    {selectedVideo?.views.toLocaleString()}
                  </p>
                  <p>
                    <strong>Likes:</strong>{" "}
                    {selectedVideo?.likes.toLocaleString()}
                  </p>
                  <p>
                    <strong>Comments:</strong>{" "}
                    {selectedVideo?.comments_count ||
                      selectedVideo?.comments ||
                      0}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Description:</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedVideo?.caption || selectedVideo?.description}
                </p>
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
  );
}
