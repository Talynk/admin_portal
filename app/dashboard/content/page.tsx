"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePosts } from "@/hooks/use-posts";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { getDownloadFilename, getBestDownloadUrl, downloadMediaFile } from "@/lib/file-utils";
import { PostMediaPlayer } from "@/components/media/post-media-player";
import { MediaProcessingNotice } from "@/components/media/media-processing-notice";
import { PostMediaThumbnail } from "@/components/media/post-media-thumbnail";
import { ReviewMediaCard } from "@/components/media/review-media-card";
import type { AdminSearchPost } from "@/lib/types/admin";
import type { ChallengeContext } from "@/lib/types/challenge";
import { VideoPipelineContentBanner } from "@/components/video-pipeline-content-banner";
import { ChallengeContextBadge } from "@/components/challenge-context-badge";
import { DataTableShell, TruncateCell } from "@/components/data-table-shell";

const SEARCH_DEBOUNCE_MS = 350;

export default function ContentPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    | "approve"
    | "reject"
    | "suspend"
    | "delete"
    | "feature"
    | "unfeature"
    | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [actionExpiresAt, setActionExpiresAt] = useState("");
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [timeRange, setTimeRange] = useState("all"); // reserved UI; filtering is server-side via sort/status
  const [sortBy, setSortBy] = useState("uploadDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState("");
  const [advancedDateFrom, setAdvancedDateFrom] = useState("");
  const [advancedDateTo, setAdvancedDateTo] = useState("");
  const [advancedHasReports, setAdvancedHasReports] = useState(false);
  const [advancedSuspendedOnly, setAdvancedSuspendedOnly] = useState(false);
  const [advancedResults, setAdvancedResults] = useState<AdminSearchPost[]>([]);
  const [advancedSearchLoading, setAdvancedSearchLoading] = useState(false);
  const [advancedSearchRun, setAdvancedSearchRun] = useState(false);
  const [page, setPage] = useState(1);

  // Debounce search so we don't refetch on every keystroke (normalize: trim + collapse whitespace)
  useEffect(() => {
    const trimmed = typeof searchTerm === "string" ? searchTerm.trim().replace(/\s+/g, " ") : "";
    const t = setTimeout(() => setDebouncedSearch(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, activeTab]);

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

  // Map UI sort to API sort (admin posts/all)
  const apiSort =
    sortBy === "uploadDate" && sortOrder === "desc"
      ? "newest"
      : sortBy === "uploadDate" && sortOrder === "asc"
        ? "oldest"
        : sortBy === "likes"
          ? "most_liked"
          : sortBy === "views"
            ? "most_viewed"
            : undefined;

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
    suspendPost,
    featurePost,
    unfeaturePost,
    flagPost,
    unflagPost,
  } = usePosts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: getStatusFilter(),
    sort: apiSort,
    featured: activeTab === "featured" ? true : undefined,
  });

  const runAdvancedSearch = async () => {
    if (!advancedSearchQuery.trim()) {
      toast({ title: "Enter a search term", variant: "destructive" });
      return;
    }
    setAdvancedSearchLoading(true);
    setAdvancedSearchRun(true);
    try {
      const res = await apiClient.adminSearch({
        q: advancedSearchQuery.trim(),
        type: "posts",
        status: advancedSuspendedOnly ? "suspended" : undefined,
        dateFrom: advancedDateFrom || undefined,
        dateTo: advancedDateTo || undefined,
        hasReports: advancedHasReports ? "true" : undefined,
        suspended: advancedSuspendedOnly ? "true" : undefined,
      });
      if (res.success && res.data) {
        const data = res.data as { posts?: AdminSearchPost[] };
        setAdvancedResults(data.posts ?? []);
      } else {
        setAdvancedResults([]);
        toast({ title: "Search failed", description: (res as { error?: string }).error, variant: "destructive" });
      }
    } catch {
      setAdvancedResults([]);
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setAdvancedSearchLoading(false);
    }
  };

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

      return matchesTab;
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
          aValue = (a.title ?? "").toLowerCase();
          bValue = (b.title ?? "").toLowerCase();
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

  // PUT /admin/approve returns 400 without rejectionReason when the target
  // status is a rejection, so block the request client-side instead.
  const requiresReason = actionType === "reject" || actionType === "suspend";

  const executeAction = async () => {
    if (!selectedVideo || !actionType) return;

    if (requiresReason && !actionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Enter a reason — it is sent to the post owner.",
        variant: "destructive",
      });
      return;
    }

    setIsActionLoading(true);
    try {
      let result;
      switch (actionType) {
        case "approve":
          // Optional reason field is UI-only for activate; API must not receive rejectionReason.
          result = await approvePost(selectedVideo.id);
          break;
        case "reject":
          result = await rejectPost(selectedVideo.id, actionReason.trim());
          break;
        case "suspend":
          result = await suspendPost(selectedVideo.id, actionReason);
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
        const verb = actionType === "suspend" ? "suspended" : `${actionType}d`;
        toast({
          title: "Success",
          description: `Post ${verb} successfully`,
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

  const handleDownload = async (post: any) => {
    const fileUrl = getBestDownloadUrl(post);
    if (!fileUrl) {
      toast({ title: "Download unavailable", description: "No media URL for this post.", variant: "destructive" });
      return;
    }
    const contentType = getContentType(post);
    const filename = getDownloadFilename(fileUrl, post?.id, contentType);
    setDownloadingId(post?.id ?? null);
    try {
      const ok = await downloadMediaFile(fileUrl, filename);
      if (ok) {
        toast({ title: "Download started", description: `Saving as ${filename}` });
      } else {
        toast({ title: "Download failed", description: "Try again or open in new tab.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Download failed", description: "Try again or open in new tab.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge className="border border-green-200 bg-green-100 text-green-800 dark:border-green-700/50 dark:bg-green-900/40 dark:text-green-200">
            Active
          </Badge>
        );
      case "draft":
        return (
          <Badge className="border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-200">
            Draft
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="border border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-700/50 dark:bg-orange-900/40 dark:text-orange-200">
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="border border-border bg-muted text-muted-foreground dark:border-border/80">
            {status || "Unknown"}
          </Badge>
        );
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

  const getContentPreview = (post: any) => (
    <ReviewMediaCard
      source={post}
      title={post.title || post.caption}
      duration={post.duration}
      onDetails={() => openVideoPreview(post)}
    />
  );

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

          <VideoPipelineContentBanner />

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
                    {/* Advanced search (unified admin search API) */}
                    <Card>
                      <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors rounded-lg"
                        onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            {advancedSearchOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Filter className="h-4 w-4" />
                            Advanced search (posts)
                          </CardTitle>
                          <CardDescription>Unified search with date range and report filters</CardDescription>
                        </div>
                      </CardHeader>
                      {advancedSearchOpen && (
                        <CardContent className="space-y-4 pt-0">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-2">
                              <Label>Search term</Label>
                              <Input
                                placeholder="Title, description, or post ID..."
                                value={advancedSearchQuery}
                                onChange={(e) => setAdvancedSearchQuery(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Date from (ISO)</Label>
                              <Input
                                type="date"
                                value={advancedDateFrom}
                                onChange={(e) => setAdvancedDateFrom(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Date to (ISO)</Label>
                              <Input
                                type="date"
                                value={advancedDateTo}
                                onChange={(e) => setAdvancedDateTo(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={advancedHasReports}
                                onCheckedChange={(c) => setAdvancedHasReports(!!c)}
                              />
                              <span className="text-sm">Only posts with reports</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={advancedSuspendedOnly}
                                onCheckedChange={(c) => setAdvancedSuspendedOnly(!!c)}
                              />
                              <span className="text-sm">Suspended only</span>
                            </label>
                            <Button onClick={runAdvancedSearch} disabled={advancedSearchLoading}>
                              {advancedSearchLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                              Search
                            </Button>
                          </div>
                          {advancedSearchRun && (
                            <div className="rounded-md border">
                              <p className="text-sm text-muted-foreground p-2">
                                {advancedResults.length} result{advancedResults.length !== 1 ? "s" : ""}
                              </p>
                              {advancedResults.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Post</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Views</TableHead>
                                      <TableHead>Reports</TableHead>
                                      <TableHead>Creator</TableHead>
                                      <TableHead className="w-[80px]">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {advancedResults.map((p) => (
                                      <TableRow key={p.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate">{p.title ?? p.id}</TableCell>
                                        <TableCell><Badge variant="secondary">{p.status ?? "—"}</Badge></TableCell>
                                        <TableCell>{(p as any).views?.toLocaleString() ?? 0}</TableCell>
                                        <TableCell>{(p as any).report_count ?? 0}</TableCell>
                                        <TableCell className="text-muted-foreground">@{p.user?.username ?? "—"}</TableCell>
                                        <TableCell>
                                          <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/content/${p.id}`}>View</Link>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-muted-foreground text-sm p-4 text-center">No posts match the filters.</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>

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
                            <div className="flex flex-col gap-2 mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                  {video.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {video.description}
                                </p>
                                {(video as AdminSearchPost & { challenge_context?: ChallengeContext }).challenge_context ? (
                                  <div className="mb-2">
                                    <ChallengeContextBadge
                                      context={(video as AdminSearchPost & { challenge_context?: ChallengeContext }).challenge_context}
                                      linkToAdminChallenge
                                    />
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => openVideoPreview(video)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {video.status === "draft" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => handleVideoAction(video, "approve")}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                                      onClick={() => handleVideoAction(video, "reject")}
                                    >
                                      <Ban className="h-3 w-3 mr-1" />
                                      Suspend
                                    </Button>
                                  </>
                                )}
                                {video.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                                    onClick={() => handleVideoAction(video, "suspend")}
                                  >
                                    <Ban className="h-3 w-3 mr-1" />
                                    Suspend
                                  </Button>
                                )}
                                {(video as any).is_featured || (video as any).featured ? (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleVideoAction(video, "unfeature")}>
                                    <StarOff className="h-3 w-3 mr-1" />
                                    Unfeature
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleVideoAction(video, "feature")}>
                                    <Star className="h-3 w-3 mr-1" />
                                    Feature
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleVideoAction(video, "delete")}
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}`, "_blank")}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Full Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(video)}
                                      disabled={!getBestDownloadUrl(video) || downloadingId === video.id}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      {downloadingId === video.id ? "Downloading..." : "Download"}
                                    </DropdownMenuItem>
                                    {video.aiModeration && (
                                      <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}?tab=ai-moderation`, "_blank")}>
                                        <Brain className="mr-2 h-4 w-4" />
                                        AI Analysis
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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
                    <DataTableShell minWidth="900px">
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
                              onClick={() => openVideoPreview(video)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div
                                    className="relative flex-shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openVideoPreview(video)
                                    }}
                                  >
                                    <PostMediaThumbnail
                                      source={video}
                                      title={video.title || video.caption}
                                      compact
                                      onPlay={() => openVideoPreview(video)}
                                    />
                                    {(video as any).is_featured && (
                                      <div className="absolute top-1 right-1">
                                        <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                                          <Star className="w-2 h-2 mr-1" />
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <TruncateCell
                                      className="font-medium text-sm"
                                      title={video.title ?? ""}
                                    >
                                      {video.title ?? ""}
                                    </TruncateCell>
                                    <TruncateCell className="text-xs text-muted-foreground" title={video.id}>
                                      ID: {video.id}
                                    </TruncateCell>
                                    <p className="text-xs text-muted-foreground">
                                      {video.duration}
                                    </p>
                                    {(video as AdminSearchPost & { challenge_context?: ChallengeContext }).challenge_context ? (
                                      <div className="mt-1">
                                        <ChallengeContextBadge
                                          context={(video as AdminSearchPost & { challenge_context?: ChallengeContext }).challenge_context}
                                          linkToAdminChallenge
                                        />
                                      </div>
                                    ) : null}
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
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      aria-label={`Actions for ${video.title || video.caption || "post"}`}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => openVideoPreview(video)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}`, "_blank")}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Full details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDownload(video)}
                                      disabled={!getBestDownloadUrl(video) || downloadingId === video.id}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      {downloadingId === video.id ? "Downloading..." : "Download"}
                                    </DropdownMenuItem>
                                    {video.aiModeration && (
                                      <DropdownMenuItem onClick={() => window.open(`/dashboard/content/${video.id}?tab=ai-moderation`, "_blank")}>
                                        <Brain className="mr-2 h-4 w-4" />
                                        AI analysis
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {video.status === "draft" && (
                                      <DropdownMenuItem
                                        className="text-green-600"
                                        onClick={() => handleVideoAction(video, "approve")}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                    )}
                                    {(video.status === "draft" || video.status === "active") && (
                                      <DropdownMenuItem
                                        className="text-orange-600"
                                        onClick={() => handleVideoAction(video, video.status === "draft" ? "reject" : "suspend")}
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Suspend
                                      </DropdownMenuItem>
                                    )}
                                    {(video as any).is_featured || (video as any).featured ? (
                                      <DropdownMenuItem onClick={() => handleVideoAction(video, "unfeature")}>
                                        <StarOff className="mr-2 h-4 w-4" />
                                        Remove from featured
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleVideoAction(video, "feature")}>
                                        <Star className="mr-2 h-4 w-4" />
                                        Add to featured
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleVideoAction(video, "delete")}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DataTableShell>
                  )}

                  {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-between gap-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} · {total.toLocaleString()} total
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {filteredVideos.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {debouncedSearch ? "No content matches your search." : "No posts found matching your criteria."}
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
                {actionType === "suspend" && "Suspend Post"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete Content"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" &&
                  `Are you sure you want to activate "${selectedVideo?.title}"? This will make it visible to all users.`}
                {actionType === "reject" &&
                  `Are you sure you want to suspend "${selectedVideo?.title}"? This will prevent it from being visible.`}
                {actionType === "suspend" &&
                  `Suspend "${selectedVideo?.title}"? The owner will be notified and can appeal if they believe it's a mistake (one appeal per post). Suspended posts are frozen (read-only).`}
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
                  {requiresReason
                    ? "Reason (required, included in notification to owner)"
                    : "Reason (optional)"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for this action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  aria-invalid={requiresReason && !actionReason.trim()}
                />
                {requiresReason && !actionReason.trim() ? (
                  <p className="mt-1 text-xs text-destructive">
                    The API rejects this action without a reason.
                  </p>
                ) : null}
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
                disabled={isActionLoading || (requiresReason && !actionReason.trim())}
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
                    {actionType === "suspend" && "Suspend Post"}
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
              <PostMediaPlayer
                source={selectedVideo}
                title={selectedVideo?.title || selectedVideo?.caption}
                autoPlay
              />
              <MediaProcessingNotice source={selectedVideo} />
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
