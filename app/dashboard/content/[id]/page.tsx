"use client"

import { useState, useEffect } from "react"
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
  Calendar,
  User,
  Hash,
  TrendingUp,
  Share2,
  Brain,
  Shield,
} from "lucide-react"

// Mock video content data (same as in main content page)
const mockVideos: any[] = [
  {
    id: "V001",
    title: "Amazing Dance Performance",
    description: "Check out this incredible dance routine! The choreography is absolutely stunning and the energy is infectious. This performance showcases the talent and creativity of our amazing dancers.",
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
    category: "Entertainment",
    language: "English",
    quality: "HD",
    fileSize: "45.2 MB",
    resolution: "1920x1080",
    fps: 30,
    bitrate: "2500 kbps",
    codec: "H.264",
    audioCodec: "AAC",
    audioBitrate: "128 kbps",
    thumbnailCount: 12,
    engagement: {
      likeRate: 6.56,
      commentRate: 0.35,
      shareRate: 0.12,
      completionRate: 78.5,
    },
    analytics: {
      peakViewers: 1250,
      avgWatchTime: "0:38",
      retentionRate: 84.2,
      clickThroughRate: 3.2,
    },
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
    description: "Learn how to make the perfect pasta dish in under 10 minutes! This step-by-step tutorial will teach you the secrets to creating restaurant-quality pasta at home.",
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
    category: "Education",
    language: "English",
    quality: "HD",
    fileSize: "78.5 MB",
    resolution: "1920x1080",
    fps: 30,
    bitrate: "3000 kbps",
    codec: "H.264",
    audioCodec: "AAC",
    audioBitrate: "128 kbps",
    thumbnailCount: 8,
    engagement: {
      likeRate: 5.73,
      commentRate: 0.32,
      shareRate: 0.10,
      completionRate: 82.1,
    },
    analytics: {
      peakViewers: 890,
      avgWatchTime: "2:12",
      retentionRate: 88.5,
      clickThroughRate: 2.8,
    },
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
    description: "The funniest pet moments you'll see today! A collection of the most adorable and hilarious pet videos that will brighten your day.",
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
    category: "Entertainment",
    language: "English",
    quality: "HD",
    resolution: "1920x1080",
    fps: 30,
    bitrate: "2800 kbps",
    codec: "H.264",
    audioCodec: "AAC",
    audioBitrate: "128 kbps",
    thumbnailCount: 15,
    engagement: {
      likeRate: 6.54,
      commentRate: 0.38,
      shareRate: 0.19,
      completionRate: 91.2,
    },
    analytics: {
      peakViewers: 2340,
      avgWatchTime: "1:15",
      retentionRate: 91.2,
      clickThroughRate: 4.1,
    },
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
    description: "Comprehensive review of the newest smartphone features, performance, and value for money. Everything you need to know before buying.",
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
    category: "Technology",
    language: "English",
    quality: "4K",
    fileSize: "156.8 MB",
    resolution: "3840x2160",
    fps: 60,
    bitrate: "5000 kbps",
    codec: "H.264",
    audioCodec: "AAC",
    audioBitrate: "192 kbps",
    thumbnailCount: 20,
    engagement: {
      likeRate: 4.67,
      commentRate: 0.35,
      shareRate: 0.08,
      completionRate: 65.3,
    },
    analytics: {
      peakViewers: 450,
      avgWatchTime: "3:24",
      retentionRate: 65.3,
      clickThroughRate: 1.9,
    },
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
    category: "Documentary",
    language: "English",
    quality: "4K",
    fileSize: "234.5 MB",
    resolution: "3840x2160",
    fps: 60,
    bitrate: "6000 kbps",
    codec: "H.264",
    audioCodec: "AAC",
    audioBitrate: "192 kbps",
    thumbnailCount: 18,
    engagement: {
      likeRate: 6.34,
      commentRate: 0.27,
      shareRate: 0.12,
      completionRate: 89.7,
    },
    analytics: {
      peakViewers: 4560,
      avgWatchTime: "3:28",
      retentionRate: 89.7,
      clickThroughRate: 4.8,
    },
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
    category: "Health & Fitness",
    language: "English",
    quality: "HD",
    fileSize: "28.3 MB",
    resolution: "1920x1080",
    fps: 30,
    bitrate: "2000 kbps",
    codec: "H.264",
    audioCodec: "AAC",
    audioBitrate: "128 kbps",
    thumbnailCount: 6,
    engagement: {
      likeRate: 5.13,
      commentRate: 0.38,
      shareRate: 0.19,
      completionRate: 76.8,
    },
    analytics: {
      peakViewers: 234,
      avgWatchTime: "0:58",
      retentionRate: 76.8,
      clickThroughRate: 3.1,
    },
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

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<(typeof mockVideos)[0] | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "freeze" | "unfreeze" | "delete" | "feature" | "unfeature" | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    const foundVideo = mockVideos.find((v) => v.id === params.id)
    setVideo(foundVideo || null)
  }, [params.id])

  const handleVideoAction = (action: typeof actionType) => {
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeAction = () => {
    if (!video || !actionType) return

    // In a real app, this would make an API call
    console.log(`Executing action: ${actionType} on video: ${video.id}`)
    
    setActionDialogOpen(false)
    setActionType(null)
    setActionReason("")
  }

  const handleAIModerationAction = (action: AIReviewAction) => {
    setIsReviewing(true)
    
    // In a real app, this would make an API call
    console.log(`AI Moderation Action:`, action)
    
    // Simulate API call
    setTimeout(() => {
      setIsReviewing(false)
      // You could show a success message here
    }, 2000)
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

  if (!video) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Video Not Found</h1>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">The requested video could not be found.</p>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{video.title}</h1>
                <p className="text-muted-foreground">Video ID: {video.id}</p>
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
                <DropdownMenuItem onClick={() => setVideoDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Video
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {video.status === "pending" && (
                  <>
                    <DropdownMenuItem
                      className="text-green-600"
                      onClick={() => handleVideoAction("approve")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleVideoAction("reject")}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {video.frozen ? (
                  <DropdownMenuItem
                    className="text-blue-600"
                    onClick={() => handleVideoAction("unfreeze")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Unfreeze Post
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-blue-600"
                    onClick={() => handleVideoAction("freeze")}
                  >
                    <Freeze className="mr-2 h-4 w-4" />
                    Freeze Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {video.featured ? (
                  <DropdownMenuItem
                    className="text-yellow-600"
                    onClick={() => handleVideoAction("unfeature")}
                  >
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove from Featured
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-yellow-600"
                    onClick={() => handleVideoAction("feature")}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Add to Featured
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleVideoAction("delete")}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Delete Video
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
                {video?.aiModeration?.flagged && (
                  <Badge className="bg-red-100 text-red-800 text-xs">Flagged</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
              {/* Video Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                    <div className="text-white text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm opacity-75">Video Preview</p>
                      <p className="text-xs opacity-50">Duration: {video.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {video.likes.toLocaleString()} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {video.comments} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      {video.shares} shares
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Video Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Category:</strong> {video.category}</p>
                      <p><strong>Language:</strong> {video.language}</p>
                      <p><strong>Quality:</strong> {video.quality}</p>
                    </div>
                    <div>
                      <p><strong>File Size:</strong> {video.fileSize}</p>
                      <p><strong>Resolution:</strong> {video.resolution}</p>
                      <p><strong>FPS:</strong> {video.fps}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Status & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(video.status, video.frozen)}
                  </div>
                  
                  {video.featured && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Featured:</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  
                  {video.flagged && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Flagged:</span>
                      <Badge className="bg-red-100 text-red-800">
                        <Flag className="w-3 h-3 mr-1" />
                        Flagged
                      </Badge>
                    </div>
                  )}

                  {video.moderationNotes && (
                    <div>
                      <span className="text-sm font-medium">Moderation Notes:</span>
                      <p className="text-sm text-red-600 mt-1">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {video.moderationNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Creator Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Creator Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/generic-placeholder-graphic.png" />
                      <AvatarFallback>{video.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">@{video.username}</p>
                      <p className="text-sm text-muted-foreground">User ID: {video.userId}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Uploaded: {new Date(video.uploadDate).toLocaleDateString()}</span>
                    </div>
                    {video.approvedDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Approved: {new Date(video.approvedDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Codec:</span>
                    <span className="text-muted-foreground">{video.codec}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bitrate:</span>
                    <span className="text-muted-foreground">{video.bitrate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audio Codec:</span>
                    <span className="text-muted-foreground">{video.audioCodec}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audio Bitrate:</span>
                    <span className="text-muted-foreground">{video.audioBitrate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thumbnails:</span>
                    <span className="text-muted-foreground">{video.thumbnailCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Engagement</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Like Rate:</span>
                        <span className="text-muted-foreground">{video.engagement.likeRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comment Rate:</span>
                        <span className="text-muted-foreground">{video.engagement.commentRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Share Rate:</span>
                        <span className="text-muted-foreground">{video.engagement.shareRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completion Rate:</span>
                        <span className="text-muted-foreground">{video.engagement.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Peak Viewers:</span>
                        <span className="text-muted-foreground">{video.analytics.peakViewers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Watch Time:</span>
                        <span className="text-muted-foreground">{video.analytics.avgWatchTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retention Rate:</span>
                        <span className="text-muted-foreground">{video.analytics.retentionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CTR:</span>
                        <span className="text-muted-foreground">{video.analytics.clickThroughRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-moderation" className="mt-6">
              {video?.aiModeration ? (
                <AIModerationReview
                  data={video.aiModeration}
                  onAction={handleAIModerationAction}
                  isReviewing={isReviewing}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">No AI moderation data available for this video.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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
                  `Are you sure you want to approve "${video?.title}"? This will make it visible to all users.`}
                {actionType === "reject" &&
                  `Are you sure you want to reject "${video?.title}"? This will prevent it from being published.`}
                {actionType === "freeze" &&
                  `Are you sure you want to freeze "${video?.title}"? This will temporarily disable the post.`}
                {actionType === "unfreeze" &&
                  `Are you sure you want to unfreeze "${video?.title}"? This will restore the post.`}
                {actionType === "feature" &&
                  `Are you sure you want to feature "${video?.title}"? This will highlight it for all users.`}
                {actionType === "unfeature" &&
                  `Are you sure you want to remove "${video?.title}" from featured? This will remove the highlight.`}
                {actionType === "delete" &&
                  `Are you sure you want to delete "${video?.title}"? This action cannot be undone.`}
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
              <DialogTitle>{video?.title}</DialogTitle>
              <DialogDescription>Video ID: {video?.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">Video Preview</p>
                  <p className="text-xs opacity-50">Duration: {video?.duration}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Creator:</strong> @{video?.username}
                  </p>
                  <p>
                    <strong>Upload Date:</strong>{" "}
                    {video && new Date(video.uploadDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong> {video?.status}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Views:</strong> {video?.views.toLocaleString()}
                  </p>
                  <p>
                    <strong>Likes:</strong> {video?.likes.toLocaleString()}
                  </p>
                  <p>
                    <strong>Comments:</strong> {video?.comments}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Description:</strong>
                </p>
                <p className="text-sm text-muted-foreground">{video?.description}</p>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Tags:</strong>
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {video?.tags.map((tag: string) => (
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
