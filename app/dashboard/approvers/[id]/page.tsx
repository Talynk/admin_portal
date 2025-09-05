"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Star,
  Flag,
  Brain,
  Filter,
  Search,
  Grid3X3,
  List,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock approver data
const mockApprovers = [
  {
    id: "A001",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Senior Moderator",
    avatar: "/placeholder-user.jpg",
    joinDate: "2023-01-15",
    lastActive: "2024-03-16T10:30:00Z",
    stats: {
      totalReviews: 2847,
      approved: 2156,
      rejected: 691,
      pending: 0,
      averageReviewTime: "2.3 minutes",
      accuracy: 94.2,
    },
    performance: {
      thisMonth: {
        reviews: 156,
        approved: 128,
        rejected: 28,
        accuracy: 95.1,
      },
      lastMonth: {
        reviews: 142,
        approved: 118,
        rejected: 24,
        accuracy: 93.7,
      },
    },
  },
  {
    id: "A002",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "Content Moderator",
    avatar: "/placeholder-user.jpg",
    joinDate: "2023-06-20",
    lastActive: "2024-03-16T09:15:00Z",
    stats: {
      totalReviews: 1923,
      approved: 1456,
      rejected: 467,
      pending: 0,
      averageReviewTime: "3.1 minutes",
      accuracy: 91.8,
    },
    performance: {
      thisMonth: {
        reviews: 98,
        approved: 76,
        rejected: 22,
        accuracy: 92.9,
      },
      lastMonth: {
        reviews: 112,
        approved: 89,
        rejected: 23,
        accuracy: 90.2,
      },
    },
  },
]

// Mock reviewed posts data
const mockReviewedPosts = [
  {
    id: "V001",
    title: "Amazing Dance Performance",
    username: "dancer_pro",
    thumbnail: "/vibrant-dance-performance.png",
    status: "approved",
    reviewedAt: "2024-03-16T10:15:00Z",
    reviewTime: "1.8 minutes",
    views: 125000,
    likes: 8200,
    comments: 432,
    tags: ["dance", "performance", "trending"],
    flagged: false,
    featured: true,
    aiModeration: {
      flagged: false,
      summary: {
        overallAssessment: "Content appears safe with no concerning elements detected.",
        flagged: false,
        concerns: []
      }
    }
  },
  {
    id: "V002",
    title: "Cooking Tutorial: Perfect Pasta",
    username: "chef_master",
    thumbnail: "/cooking-pasta.png",
    status: "rejected",
    reviewedAt: "2024-03-16T09:45:00Z",
    reviewTime: "4.2 minutes",
    views: 0,
    likes: 0,
    comments: 0,
    tags: ["cooking", "tutorial", "food"],
    flagged: true,
    featured: false,
    aiModeration: {
      flagged: true,
      summary: {
        overallAssessment: "Content flagged for potential inappropriate elements.",
        flagged: true,
        concerns: [
          { severity: "high", category: "Inappropriate Content" }
        ]
      }
    }
  },
  {
    id: "V003",
    title: "Funny Pet Compilation",
    username: "pet_lover",
    thumbnail: "/funny-pets.png",
    status: "approved",
    reviewedAt: "2024-03-15T16:20:00Z",
    reviewTime: "2.1 minutes",
    views: 89000,
    likes: 15300,
    comments: 891,
    tags: ["pets", "funny", "animals"],
    flagged: false,
    featured: false,
    aiModeration: {
      flagged: true,
      summary: {
        overallAssessment: "Content flagged for copyright concerns.",
        flagged: true,
        concerns: [
          { severity: "high", category: "Copyright Detection" }
        ]
      }
    }
  },
  {
    id: "V004",
    title: "Tech Review: Latest Smartphone",
    username: "tech_reviewer",
    thumbnail: "/smartphone-review-concept.png",
    status: "rejected",
    reviewedAt: "2024-03-15T14:30:00Z",
    reviewTime: "3.5 minutes",
    views: 0,
    likes: 0,
    comments: 0,
    tags: ["tech", "review", "smartphone"],
    flagged: false,
    featured: false,
    aiModeration: {
      flagged: true,
      summary: {
        overallAssessment: "Content flagged for potential promotional content.",
        flagged: true,
        concerns: [
          { severity: "medium", category: "Commercial Content" }
        ]
      }
    }
  },
]

export default function ApproverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [approver, setApprover] = useState<(typeof mockApprovers)[0] | null>(null)
  const [reviewedPosts, setReviewedPosts] = useState(mockReviewedPosts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("all")
  const [sortBy, setSortBy] = useState("reviewedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")

  useEffect(() => {
    const foundApprover = mockApprovers.find((a) => a.id === params.id)
    setApprover(foundApprover || null)
  }, [params.id])

  // Filter and sort reviewed posts
  const filteredAndSortedPosts = reviewedPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || post.status === statusFilter

    const matchesTimeRange = (() => {
      const now = new Date()
      const postDate = new Date(post.reviewedAt)
      const daysDiff = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24))
      
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

    return matchesSearch && matchesStatus && matchesTimeRange
  }).sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "reviewedAt":
        aValue = new Date(a.reviewedAt).getTime()
        bValue = new Date(b.reviewedAt).getTime()
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
        aValue = new Date(a.reviewedAt).getTime()
        bValue = new Date(b.reviewedAt).getTime()
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>
    }
  }

  if (!approver) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Approver not found.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Approver Details</h1>
              <p className="text-muted-foreground">Review performance and activity</p>
            </div>
          </div>

          {/* Approver Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={approver.avatar} />
                  <AvatarFallback className="text-lg">{approver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{approver.name}</CardTitle>
                  <CardDescription className="text-base">{approver.email}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{approver.role}</Badge>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{new Date(approver.joinDate).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Last Active</p>
                  <p className="font-medium">{new Date(approver.lastActive).toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Performance Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approver.stats.totalReviews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {approver.performance.thisMonth.reviews} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approver.stats.accuracy.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {approver.performance.thisMonth.accuracy.toFixed(1)}% this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approver.stats.averageReviewTime}</div>
                <p className="text-xs text-muted-foreground">
                  Per content review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approver.performance.thisMonth.reviews}</div>
                <p className="text-xs text-muted-foreground">
                  {approver.performance.thisMonth.approved} approved, {approver.performance.thisMonth.rejected} rejected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reviewed Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Reviewed Posts</CardTitle>
              <CardDescription>
                Posts reviewed by {approver.name} ({filteredAndSortedPosts.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Table View
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    Grid View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="mt-6">
                  {/* Filters */}
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search posts..."
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
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Post</TableHead>
                          <TableHead>Creator</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reviewed At</TableHead>
                          <TableHead>Review Time</TableHead>
                          <TableHead>Engagement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedPosts.map((post) => (
                          <TableRow key={post.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative w-16 h-12 rounded overflow-hidden">
                                  <img
                                    src={post.thumbnail}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                  {post.flagged && (
                                    <div className="absolute top-1 left-1">
                                      <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                                        <Flag className="w-2 h-2 mr-1" />
                                      </Badge>
                                    </div>
                                  )}
                                  {post.featured && (
                                    <div className="absolute top-1 right-1">
                                      <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                                        <Star className="w-2 h-2 mr-1" />
                                      </Badge>
                                    </div>
                                  )}
                                  {post.aiModeration?.flagged && (
                                    <div className="absolute bottom-1 left-1">
                                      <Badge className="bg-purple-500 text-white text-xs px-1 py-0">
                                        <Brain className="w-2 h-2 mr-1" />
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">{post.title}</p>
                                  <p className="text-xs text-muted-foreground">ID: {post.id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src="/placeholder-user.jpg" />
                                  <AvatarFallback className="text-xs">{post.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">@{post.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(post.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(post.reviewedAt).toLocaleDateString()}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(post.reviewedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{post.reviewTime}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {post.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {post.likes.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {post.comments.toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="grid" className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                        <div className="relative">
                          <img
                            src={post.thumbnail}
                            alt={post.title}
                            className="w-full h-32 object-cover"
                          />
                          {post.flagged && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-red-500 text-white">
                                <Flag className="w-3 h-3 mr-1" />
                                Flagged
                              </Badge>
                            </div>
                          )}
                          {post.featured && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-yellow-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            </div>
                          )}
                          {post.aiModeration?.flagged && (
                            <div className="absolute bottom-2 left-2">
                              <Badge className="bg-purple-500 text-white">
                                <Brain className="w-3 h-3 mr-1" />
                                AI Flagged
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-sm line-clamp-2">{post.title}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">@{post.username}</span>
                              {getStatusBadge(post.status)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>Reviewed: {new Date(post.reviewedAt).toLocaleDateString()}</p>
                              <p>Time: {post.reviewTime}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.views.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.likes.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {post.comments.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
