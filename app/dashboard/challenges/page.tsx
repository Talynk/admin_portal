"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Trophy,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  StopCircle,
  Eye,
  Calendar,
  Gift,
  ArrowRight,
} from "lucide-react"
import { useChallenges } from "@/hooks/use-challenges"
import { useChallengeStats } from "@/hooks/use-challenge-stats"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl } from "@/lib/file-utils"
import { apiClient } from "@/lib/api-client"

export default function ChallengesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "active" | "rejected" | "ended">("all")
  const [page, setPage] = useState(1)
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "stop" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [daysFilter, setDaysFilter] = useState(30)

  const { stats, growthAnalytics, loading: statsLoading, error: statsError, refetchGrowth } = useChallengeStats(daysFilter)
  
  const { challenges, loading, error, total, totalPages, refetch } = useChallenges({
    page,
    limit: 20,
    status: activeTab !== "all" ? activeTab : undefined,
  })

  const handleAction = (challenge: any, action: "approve" | "reject" | "stop") => {
    setSelectedChallenge(challenge)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeAction = async () => {
    if (!selectedChallenge || !actionType) return

    setIsActionLoading(true)
    try {
      let result
      switch (actionType) {
        case "approve":
          result = await apiClient.approveChallenge(selectedChallenge.id)
          break
        case "reject":
          result = await apiClient.rejectChallenge(selectedChallenge.id, rejectionReason || undefined)
          break
        case "stop":
          result = await apiClient.stopChallenge(selectedChallenge.id)
          break
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: `Challenge ${actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "stopped"} successfully`,
        })
        refetch()
        if (stats) {
          // Refetch stats to update counts
          window.location.reload()
        }
      } else {
        toast({
          title: "Error",
          description: result?.error || `Failed to ${actionType} challenge`,
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
      setActionDialogOpen(false)
      setSelectedChallenge(null)
      setActionType(null)
      setRejectionReason("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Approved</Badge>
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case "ended":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Ended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Challenge Management</h1>
              <p className="text-muted-foreground">
                Manage and monitor platform challenges
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading challenges</span>
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

          {/* Dashboard Stats */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.total}</div>
                  <p className="text-xs text-muted-foreground">All challenges</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.pending}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overview.active}</div>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.engagement.total_participants.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total participants</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Posts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.engagement.total_posts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Challenge posts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">With Rewards</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.engagement.challenges_with_rewards}</div>
                  <p className="text-xs text-muted-foreground">Rewarded challenges</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Growth Analytics Chart */}
          {growthAnalytics && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Growth Analytics</CardTitle>
                    <CardDescription>Challenge, participant, and post growth over time</CardDescription>
                  </div>
                  <Select value={daysFilter.toString()} onValueChange={(value) => {
                    setDaysFilter(parseInt(value))
                    refetchGrowth(parseInt(value))
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthAnalytics.cumulative_data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="challenges" stroke="#3b82f6" strokeWidth={2} name="Challenges" />
                    <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} name="Participants" />
                    <Line type="monotone" dataKey="posts" stroke="#8b5cf6" strokeWidth={2} name="Posts" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Challenges List */}
          <Card>
            <CardHeader>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>View and manage all challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value as any)
                setPage(1)
              }}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="ended">Ended</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading challenges...</span>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Challenge</TableHead>
                            <TableHead>Organizer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Rewards</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {challenges.map((challenge) => (
                            <TableRow key={challenge.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{challenge.name}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {challenge.description}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={getProfilePictureUrl(challenge.organizer.profile_picture)} />
                                    <AvatarFallback>
                                      {challenge.organizer.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">@{challenge.organizer.username}</p>
                                    {challenge.organizer.display_name && (
                                      <p className="text-xs text-muted-foreground">
                                        {challenge.organizer.display_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(challenge.status)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(challenge.start_date).toLocaleDateString()}
                                  </p>
                                  <p className="text-muted-foreground">
                                    to {new Date(challenge.end_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{challenge._count.participants} participants</p>
                                  <p className="text-muted-foreground">{challenge._count.posts} posts</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {challenge.has_rewards ? (
                                  <Badge variant="outline" className="text-green-600">
                                    <Gift className="h-3 w-3 mr-1" />
                                    Yes
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {challenge.status === "pending" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAction(challenge, "approve")}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAction(challenge, "reject")}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {(challenge.status === "active" || challenge.status === "approved") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAction(challenge, "stop")}
                                      className="text-orange-600 hover:text-orange-700"
                                    >
                                      <StopCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {challenges.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No challenges found</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} ({total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
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
                {actionType === "approve" && "Approve Challenge"}
                {actionType === "reject" && "Reject Challenge"}
                {actionType === "stop" && "Stop Challenge"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" &&
                  `Are you sure you want to approve "${selectedChallenge?.name}"?`}
                {actionType === "reject" &&
                  `Are you sure you want to reject "${selectedChallenge?.name}"?`}
                {actionType === "stop" &&
                  `Are you sure you want to stop "${selectedChallenge?.name}"? This will end the challenge.`}
              </DialogDescription>
            </DialogHeader>
            {actionType === "reject" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Rejection Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "reject" || actionType === "stop" ? "destructive" : "default"}
                onClick={executeAction}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === "approve" && "Approve"}
                    {actionType === "reject" && "Reject"}
                    {actionType === "stop" && "Stop"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

