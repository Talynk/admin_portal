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
} from "lucide-react"

// Mock video content data
const mockVideos: any[] = [
  {
    id: "V001",
    title: "Amazing Dance Performance",
    description: "Check out this incredible dance routine!",
    username: "dancer_pro",
    userId: "U001",
    thumbnail: "/vibrant-dance-performance.png",
    videoUrl: "/placeholder.mp4",
    status: "approved",
    duration: "0:45",
    views: 125000,
    likes: 8200,
    comments: 432,
    shares: 156,
    uploadDate: "2024-03-15",
    approvedDate: "2024-03-15",
    tags: ["dance", "performance", "trending"],
    flagged: false,
    frozen: false,
    featured: true,
    moderationNotes: "",
    aiModeration: {
      flagged: false,
      summary: {
        overallAssessment: "Content appears safe with no concerning elements detected. The dance performance is appropriate and follows community guidelines.",
        flagged: false,
        concerns: []
      },
      detailedResults: {
        "Content Safety": {
          title: "Content Safety",
          flagged: false,
          items: [
            {
              label: "Violence Detection",
              percentage: 5,
              severity: "safe" as const,
              confidence: 95,
              status: "safe" as const
            },
            {
              label: "Inappropriate Content",
              percentage: 2,
              severity: "safe" as const,
              confidence: 98,
              status: "safe" as const
            }
          ]
        },
        "Audio Analysis": {
          title: "Audio Analysis",
          flagged: false,
          items: [
            {
              label: "Profanity Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Copyright Music",
              percentage: 15,
              severity: "low" as const,
              confidence: 85,
              status: "safe" as const
            }
          ]
        }
      },
      fileName: "dance_performance.mp4",
      processingType: "video_moderation",
      taskId: "TASK_001",
      processedAt: "2024-03-15T10:30:00Z",
      processingTime: 45
    },
  },
  {
    id: "V002",
    title: "Cooking Tutorial: Perfect Pasta",
    description: "Learn how to make the perfect pasta dish in under 10 minutes!",
    username: "chef_master",
    userId: "U002",
    thumbnail: "/cooking-pasta.png",
    videoUrl: "/placeholder.mp4",
    status: "pending",
    duration: "2:34",
    views: 89000,
    likes: 5100,
    comments: 287,
    shares: 89,
    uploadDate: "2024-03-14",
    approvedDate: null,
    tags: ["cooking", "tutorial", "food"],
    flagged: true,
    frozen: false,
    featured: false,
    moderationNotes: "Reported for inappropriate content",
    aiModeration: {
      flagged: true,
      summary: {
        overallAssessment: "Content flagged for potential inappropriate elements. Multiple concerns detected including suggestive content and potential policy violations.",
        flagged: true,
        concerns: [
          { severity: "high", category: "Inappropriate Content" },
          { severity: "medium", category: "Audio Analysis" }
        ]
      },
      detailedResults: {
        "Content Safety": {
          title: "Content Safety",
          flagged: true,
          items: [
            {
              label: "Violence Detection",
              percentage: 8,
              severity: "safe" as const,
              confidence: 92,
              status: "safe" as const
            },
            {
              label: "Inappropriate Content",
              percentage: 78,
              severity: "high" as const,
              confidence: 87,
              status: "flagged" as const
            }
          ]
        },
        "Audio Analysis": {
          title: "Audio Analysis",
          flagged: true,
          items: [
            {
              label: "Profanity Detection",
              percentage: 45,
              severity: "medium" as const,
              confidence: 82,
              status: "flagged" as const
            },
            {
              label: "Copyright Music",
              percentage: 25,
              severity: "low" as const,
              confidence: 75,
              status: "safe" as const
            }
          ]
        }
      },
      fileName: "cooking_tutorial.mp4",
      processingType: "video_moderation",
      taskId: "TASK_002",
      processedAt: "2024-03-14T15:45:00Z",
      processingTime: 52
    },
  },
  {
    id: "V003",
    title: "Funny Pet Compilation",
    description: "The funniest pet moments you'll see today!",
    username: "pet_lover",
    userId: "U003",
    thumbnail: "/funny-pets.png",
    videoUrl: "/placeholder.mp4",
    status: "approved",
    duration: "1:23",
    views: 234000,
    likes: 15300,
    comments: 891,
    shares: 445,
    uploadDate: "2024-03-13",
    approvedDate: "2024-03-13",
    tags: ["pets", "funny", "animals"],
    flagged: false,
    frozen: true,
    featured: false,
    moderationNotes: "Frozen due to copyright claim",
    aiModeration: {
      flagged: true,
      summary: {
        overallAssessment: "Content flagged for copyright concerns. AI detected potential copyrighted material in the audio track.",
        flagged: true,
        concerns: [
          { severity: "high", category: "Copyright Detection" }
        ]
      },
      detailedResults: {
        "Content Safety": {
          title: "Content Safety",
          flagged: false,
          items: [
            {
              label: "Violence Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Inappropriate Content",
              percentage: 3,
              severity: "safe" as const,
              confidence: 97,
              status: "safe" as const
            }
          ]
        },
        "Copyright Detection": {
          title: "Copyright Detection",
          flagged: true,
          items: [
            {
              label: "Audio Copyright",
              percentage: 89,
              severity: "high" as const,
              confidence: 94,
              status: "flagged" as const
            },
            {
              label: "Visual Copyright",
              percentage: 12,
              severity: "low" as const,
              confidence: 78,
              status: "safe" as const
            }
          ]
        }
      },
      fileName: "funny_pets.mp4",
      processingType: "video_moderation",
      taskId: "TASK_003",
      processedAt: "2024-03-13T09:20:00Z",
      processingTime: 38
    },
  },
  {
    id: "V004",
    title: "Tech Review: Latest Smartphone",
    description: "Comprehensive review of the newest smartphone features",
    username: "tech_reviewer",
    userId: "U004",
    thumbnail: "/smartphone-review-concept.png",
    videoUrl: "/placeholder.mp4",
    status: "rejected",
    duration: "5:12",
    views: 45000,
    likes: 2100,
    comments: 156,
    shares: 34,
    uploadDate: "2024-03-12",
    approvedDate: null,
    tags: ["tech", "review", "smartphone"],
    flagged: false,
    frozen: false,
    featured: false,
    moderationNotes: "Rejected for promotional content without disclosure",
    aiModeration: {
      flagged: true,
      summary: {
        overallAssessment: "Content flagged for potential promotional content without proper disclosure. AI detected commercial elements that may violate advertising policies.",
        flagged: true,
        concerns: [
          { severity: "medium", category: "Commercial Content" },
          { severity: "low", category: "Content Safety" }
        ]
      },
      detailedResults: {
        "Commercial Content": {
          title: "Commercial Content",
          flagged: true,
          items: [
            {
              label: "Promotional Language",
              percentage: 67,
              severity: "medium" as const,
              confidence: 83,
              status: "flagged" as const
            },
            {
              label: "Brand Mentions",
              percentage: 45,
              severity: "medium" as const,
              confidence: 79,
              status: "flagged" as const
            }
          ]
        },
        "Content Safety": {
          title: "Content Safety",
          flagged: false,
          items: [
            {
              label: "Violence Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Inappropriate Content",
              percentage: 5,
              severity: "safe" as const,
              confidence: 95,
              status: "safe" as const
            }
          ]
        }
      },
      fileName: "tech_review.mp4",
      processingType: "video_moderation",
      taskId: "TASK_004",
      processedAt: "2024-03-12T14:15:00Z",
      processingTime: 67
    },
  },
  {
    id: "V005",
    title: "Amazing Nature Documentary",
    description: "Stunning footage of wildlife in their natural habitat. A breathtaking journey through untouched wilderness.",
    username: "nature_filmmaker",
    userId: "U005",
    thumbnail: "/placeholder.jpg",
    videoUrl: "/placeholder.mp4",
    status: "approved",
    duration: "3:45",
    views: 456000,
    likes: 28900,
    comments: 1234,
    shares: 567,
    uploadDate: "2024-03-10",
    approvedDate: "2024-03-10",
    tags: ["nature", "wildlife", "documentary"],
    flagged: false,
    frozen: false,
    featured: true,
    moderationNotes: "",
    aiModeration: {
      flagged: false,
      summary: {
        overallAssessment: "Content is safe and appropriate. High-quality documentary content with no concerning elements detected.",
        flagged: false,
        concerns: []
      },
      detailedResults: {
        "Content Safety": {
          title: "Content Safety",
          flagged: false,
          items: [
            {
              label: "Violence Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Inappropriate Content",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            }
          ]
        },
        "Audio Analysis": {
          title: "Audio Analysis",
          flagged: false,
          items: [
            {
              label: "Profanity Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Copyright Music",
              percentage: 5,
              severity: "safe" as const,
              confidence: 95,
              status: "safe" as const
            }
          ]
        }
      },
      fileName: "nature_documentary.mp4",
      processingType: "video_moderation",
      taskId: "TASK_005",
      processedAt: "2024-03-10T11:30:00Z",
      processingTime: 89
    },
  },
  {
    id: "V006",
    title: "Quick Workout Routine",
    description: "Get fit in just 10 minutes with this high-intensity workout routine perfect for busy schedules.",
    username: "fitness_coach",
    userId: "U006",
    thumbnail: "/placeholder.jpg",
    videoUrl: "/placeholder.mp4",
    status: "pending",
    duration: "1:15",
    views: 23400,
    likes: 1200,
    comments: 89,
    shares: 45,
    uploadDate: "2024-03-16",
    approvedDate: null,
    tags: ["fitness", "workout", "health"],
    flagged: false,
    frozen: false,
    featured: false,
    moderationNotes: "",
    aiModeration: {
      flagged: false,
      summary: {
        overallAssessment: "Content is safe and appropriate. Educational fitness content with no concerning elements detected.",
        flagged: false,
        concerns: []
      },
      detailedResults: {
        "Content Safety": {
          title: "Content Safety",
          flagged: false,
          items: [
            {
              label: "Violence Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Inappropriate Content",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            }
          ]
        },
        "Audio Analysis": {
          title: "Audio Analysis",
          flagged: false,
          items: [
            {
              label: "Profanity Detection",
              percentage: 0,
              severity: "safe" as const,
              confidence: 99,
              status: "safe" as const
            },
            {
              label: "Copyright Music",
              percentage: 8,
              severity: "safe" as const,
              confidence: 92,
              status: "safe" as const
            }
          ]
        }
      },
      fileName: "workout_routine.mp4",
      processingType: "video_moderation",
      taskId: "TASK_006",
      processedAt: "2024-03-16T08:45:00Z",
      processingTime: 34
    },
  },
]

export default function ContentPage() {
  const [videos, setVideos] = useState(mockVideos)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedVideo, setSelectedVideo] = useState<(typeof mockVideos)[0] | null>(null)
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

  // Filter and sort videos based on search, filters, and time range
  const filteredAndSortedVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

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

    const matchesStatus = statusFilter === "all" || video.status === statusFilter

    const matchesTimeRange = (() => {
      const now = new Date()
      const videoDate = new Date(video.uploadDate)
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

    return matchesSearch && matchesTab && matchesStatus && matchesTimeRange
  }).sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "uploadDate":
        aValue = new Date(a.uploadDate).getTime()
        bValue = new Date(b.uploadDate).getTime()
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
        aValue = a.username.toLowerCase()
        bValue = b.username.toLowerCase()
        break
      default:
        aValue = new Date(a.uploadDate).getTime()
        bValue = new Date(b.uploadDate).getTime()
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleVideoAction = (video: (typeof mockVideos)[0], action: typeof actionType) => {
    setSelectedVideo(video)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeAction = () => {
    if (!selectedVideo || !actionType) return

    setVideos((prev) =>
      prev.map((video) => {
        if (video.id === selectedVideo.id) {
          switch (actionType) {
            case "approve":
              return { ...video, status: "approved", approvedDate: new Date().toISOString().split("T")[0] }
            case "reject":
              return { ...video, status: "rejected" }
            case "freeze":
              return { ...video, frozen: true, moderationNotes: actionReason }
            case "unfreeze":
              return { ...video, frozen: false, moderationNotes: "" }
            case "feature":
              return { ...video, featured: true }
            case "unfeature":
              return { ...video, featured: false }
            default:
              return video
          }
        }
        return video
      }),
    )

    if (actionType === "delete") {
      setVideos((prev) => prev.filter((video) => video.id !== selectedVideo.id))
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

  const openVideoPreview = (video: (typeof mockVideos)[0]) => {
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

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{videos.length}</div>
                <p className="text-xs text-muted-foreground">+23% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{videos.filter((v) => v.status === "pending").length}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{videos.filter((v) => v.flagged).length}</div>
                <p className="text-xs text-muted-foreground">Needs review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Featured Content</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{videos.filter((v) => v.featured).length}</div>
                <p className="text-xs text-muted-foreground">Highlighted content</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Flagged</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{videos.filter((v) => v.aiModeration?.flagged).length}</div>
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
                          placeholder="Search by video ID, title, username, or tags..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
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
                          className="hover:bg-primary/90 transition-colors"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "table" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("table")}
                          className="hover:bg-primary/90 transition-colors"
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
                        className="hover:bg-muted transition-colors"
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
                  {viewMode === "grid" ? (
                    /* Grid View */
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredAndSortedVideos.map((video) => (
                        <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                          <div className="relative">
                            <img
                              src={video.thumbnail || "/placeholder.svg"}
                              alt={video.title}
                              className="w-full h-48 object-cover cursor-pointer"
                              onClick={() => openVideoPreview(video)}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <Button size="sm" variant="secondary" onClick={() => openVideoPreview(video)}>
                                <Play className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </div>
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
                                    Preview Video
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
                                    Delete Video
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="/generic-placeholder-graphic.png" />
                                <AvatarFallback>{video.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">@{video.username}</span>
                              <span className="text-xs text-muted-foreground">ID: {video.id}</span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              {getStatusBadge(video.status, video.frozen)}
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
                                  {video.comments}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {video.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <p>Uploaded: {new Date(video.uploadDate).toLocaleDateString()}</p>
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
                            <TableHead>Video</TableHead>
                            <TableHead>Creator</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Likes</TableHead>
                            <TableHead>Upload Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedVideos.map((video) => (
                            <TableRow key={video.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-16 h-12 rounded overflow-hidden">
                                    <img
                                      src={video.thumbnail || "/placeholder.svg"}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
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
                                    <AvatarFallback className="text-xs">{video.username.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">@{video.username}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(video.status, video.frozen)}
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
                                  {new Date(video.uploadDate).toLocaleDateString()}
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
                                      Preview Video
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
                                      Delete Video
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

                  {filteredAndSortedVideos.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No videos found matching your criteria.</p>
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
                {actionType === "approve" && "Approve Video"}
                {actionType === "reject" && "Reject Video"}
                {actionType === "freeze" && "Freeze Post"}
                {actionType === "unfreeze" && "Unfreeze Post"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete Video"}
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
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant={actionType === "delete" ? "destructive" : "default"} onClick={executeAction}>
                {actionType === "approve" && "Approve Video"}
                {actionType === "reject" && "Reject Video"}
                {actionType === "freeze" && "Freeze Post"}
                {actionType === "unfreeze" && "Unfreeze Post"}
                {actionType === "feature" && "Add to Featured"}
                {actionType === "unfeature" && "Remove from Featured"}
                {actionType === "delete" && "Delete Video"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Video Preview Dialog */}
        <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedVideo?.title}</DialogTitle>
              <DialogDescription>Video ID: {selectedVideo?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">Video Preview</p>
                  <p className="text-xs opacity-50">Duration: {selectedVideo?.duration}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Creator:</strong> @{selectedVideo?.username}
                  </p>
                  <p>
                    <strong>Upload Date:</strong>{" "}
                    {selectedVideo && new Date(selectedVideo.uploadDate).toLocaleDateString()}
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
                    <strong>Comments:</strong> {selectedVideo?.comments}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Description:</strong>
                </p>
                <p className="text-sm text-muted-foreground">{selectedVideo?.description}</p>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Tags:</strong>
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVideo?.tags.map((tag: string) => (
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
