"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  Calendar,
  Gift,
  ArrowLeft,
  User,
  Clock,
  BarChart3,
} from "lucide-react"
import { useChallenge } from "@/hooks/use-challenge"
import { toast } from "@/hooks/use-toast"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl } from "@/lib/file-utils"

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "posts" | "analytics">("overview")
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "stop" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [analyticsDays, setAnalyticsDays] = useState(30)

  const {
    challenge,
    analytics,
    loading,
    error,
    refetch,
    refetchAnalytics,
    approveChallenge,
    rejectChallenge,
    stopChallenge,
  } = useChallenge(challengeId, analyticsDays)

  const handleAction = (action: "approve" | "reject" | "stop") => {
    setActionType(action)
    setActionDialogOpen(true)
  }

  const executeAction = async () => {
    if (!actionType) return

    setIsActionLoading(true)
    try {
      let result
      switch (actionType) {
        case "approve":
          result = await approveChallenge()
          break
        case "reject":
          result = await rejectChallenge(rejectionReason || undefined)
          break
        case "stop":
          result = await stopChallenge()
          break
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Challenge ${actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "stopped"} successfully`,
        })
        refetch()
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${actionType} challenge`,
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

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading challenge details...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !challenge) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error loading challenge</span>
              </div>
              <p className="text-red-600 mt-1">{error || "Challenge not found"}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/challenges")}
                className="mt-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Challenges
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/challenges")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{challenge.name}</h1>
                <p className="text-muted-foreground">{challenge.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(challenge.status)}
              {challenge.status === "pending" && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAction("approve")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction("reject")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {(challenge.status === "active" || challenge.status === "approved") && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction("stop")}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Challenge
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{challenge.statistics.total_participants}</div>
                <p className="text-xs text-muted-foreground">
                  {challenge.statistics.participants_with_posts} with posts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{challenge.statistics.total_posts}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {challenge.statistics.average_posts_per_participant.toFixed(1)} per participant
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {challenge.statistics.recent_activity.participants_last_7_days}
                </div>
                <p className="text-xs text-muted-foreground">
                  {challenge.statistics.recent_activity.posts_last_7_days} posts (7d)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {challenge.has_rewards ? "Yes" : "No"}
                </div>
                <p className="text-xs text-muted-foreground">Challenge rewards</p>
              </CardContent>
            </Card>
          </div>

          {/* Challenge Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organizer</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getProfilePictureUrl(challenge.organizer.profile_picture)} />
                      <AvatarFallback>
                        {challenge.organizer.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">@{challenge.organizer.username}</p>
                      {challenge.organizer.display_name && (
                        <p className="text-sm text-muted-foreground">
                          {challenge.organizer.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="mt-1">{new Date(challenge.start_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="mt-1">{new Date(challenge.end_date).toLocaleString()}</p>
                </div>
                {challenge.approver && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved By</p>
                    <p className="mt-1">@{challenge.approver.username}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                    <p className="text-2xl font-bold">{challenge.statistics.total_participants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                    <p className="text-2xl font-bold">{challenge.statistics.total_posts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">With Posts</p>
                    <p className="text-2xl font-bold">{challenge.statistics.participants_with_posts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Without Posts</p>
                    <p className="text-2xl font-bold">{challenge.statistics.participants_without_posts}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Average Posts per Participant</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min((challenge.statistics.average_posts_per_participant / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm mt-1">{challenge.statistics.average_posts_per_participant.toFixed(2)} posts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="participants">Participants ({challenge.participants.length})</TabsTrigger>
                  <TabsTrigger value="posts">Posts ({challenge.posts.length})</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{challenge.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Challenge Period</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Start: {new Date(challenge.start_date).toLocaleString()}
                          </p>
                          <p>
                            <Calendar className="h-4 w-4 inline mr-2" />
                            End: {new Date(challenge.end_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Organizer</h3>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getProfilePictureUrl(challenge.organizer.profile_picture)} />
                            <AvatarFallback>
                              {challenge.organizer.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">@{challenge.organizer.username}</p>
                            {challenge.organizer.display_name && (
                              <p className="text-sm text-muted-foreground">
                                {challenge.organizer.display_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="participants" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Posts</TableHead>
                          <TableHead>Total Posts</TableHead>
                          <TableHead>Followers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {challenge.participants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={getProfilePictureUrl(participant.user.profile_picture)} />
                                  <AvatarFallback>
                                    {participant.user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">@{participant.user.username}</p>
                                  {participant.user.display_name && (
                                    <p className="text-sm text-muted-foreground">
                                      {participant.user.display_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(participant.joined_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{participant.post_count}</Badge>
                            </TableCell>
                            <TableCell>{participant.user.posts_count || 0}</TableCell>
                            <TableCell>{participant.user.follower_count || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Post ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {challenge.posts.map((challengePost) => (
                          <TableRow key={challengePost.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={getProfilePictureUrl(challengePost.post.user.profile_picture)} />
                                  <AvatarFallback>
                                    {challengePost.post.user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">@{challengePost.post.user.username}</p>
                                  {challengePost.post.user.display_name && (
                                    <p className="text-sm text-muted-foreground">
                                      {challengePost.post.user.display_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(challengePost.submitted_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs">{challengePost.post_id}</code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-4">
                  {analytics ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <CardTitle>Growth Analytics</CardTitle>
                        <Select
                          value={analyticsDays.toString()}
                          onValueChange={(value) => {
                            setAnalyticsDays(parseInt(value))
                            refetchAnalytics(parseInt(value))
                          }}
                        >
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
                      <Card>
                        <CardHeader>
                          <CardTitle>Participant & Post Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.growth.cumulative_data}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <RechartsTooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="participants"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Participants"
                              />
                              <Line
                                type="monotone"
                                dataKey="posts"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                name="Posts"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Contributors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analytics.participant_stats.top_contributors.map((contributor, index) => (
                              <div key={contributor.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                                    {index + 1}
                                  </div>
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={getProfilePictureUrl(contributor.profile_picture)} />
                                    <AvatarFallback>
                                      {contributor.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">@{contributor.username}</p>
                                    {contributor.display_name && (
                                      <p className="text-sm text-muted-foreground">
                                        {contributor.display_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{contributor.post_count} posts</p>
                                  <p className="text-xs text-muted-foreground">
                                    Joined {new Date(contributor.joined_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading analytics...</span>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
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
                {actionType === "approve" && `Are you sure you want to approve "${challenge.name}"?`}
                {actionType === "reject" && `Are you sure you want to reject "${challenge.name}"?`}
                {actionType === "stop" && `Are you sure you want to stop "${challenge.name}"? This will end the challenge.`}
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

