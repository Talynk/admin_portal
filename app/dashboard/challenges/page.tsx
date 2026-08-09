"use client"

import { useState, useEffect } from "react"
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
  Search,
  Rocket,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChallenges } from "@/hooks/use-challenges"
import { useChallengeStats } from "@/hooks/use-challenge-stats"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl } from "@/lib/file-utils"
import { apiClient } from "@/lib/api-client"
import { AdminUserContactLines } from "@/components/admin-user-contact-lines"
import { ChallengeModerationBadge } from "@/components/challenge-moderation-badge"
import { ChallengeDocumentsQueue } from "@/components/challenge-documents-queue"
import { ChallengePendingPostsQueue } from "@/components/challenge-pending-posts-queue"

function resolveChallengeMaxWinners(challenge: any) {
  return challenge?.max_winners ?? 10
}

export default function ChallengesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "active" | "rejected" | "ended" | "stopped">("all")
  const [pageSection, setPageSection] = useState<"challenges" | "documents" | "pending-posts">("challenges")
  const [restoreLoadingId, setRestoreLoadingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)

  const SEARCH_DEBOUNCE_MS = 400
  useEffect(() => {
    const trimmed = typeof searchTerm === "string" ? searchTerm.trim().replace(/\s+/g, " ") : ""
    const t = setTimeout(() => setDebouncedSearch(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchTerm])
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeTab])
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "stop" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [startNowChallengeId, setStartNowChallengeId] = useState<string | null>(null)
  const [daysFilter, setDaysFilter] = useState(30)

  const { stats, growthAnalytics, loading: statsLoading, error: statsError, refetchGrowth } = useChallengeStats(daysFilter)
  
  const { challenges, loading, error, total, totalPages, refetch } = useChallenges({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: activeTab !== "all" ? activeTab : undefined,
  })

  const displayChallenges = challenges

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

  const handleStartNowFromList = async (challengeId: string) => {
    setStartNowChallengeId(challengeId)
    try {
      const res = await apiClient.startChallengeNow(challengeId)
      if (res.success) {
        const msg = (res as { message?: string }).message
        toast({
          title: "Challenge is live",
          description: msg || "Challenge started successfully.",
        })
        refetch()
      } else {
        toast({
          title: "Error",
          description: (res as { error?: string }).error || "Could not start challenge",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setStartNowChallengeId(null)
    }
  }

  const handleRestore = async (challengeId: string) => {
    setRestoreLoadingId(challengeId)
    try {
      const res = await apiClient.restoreChallenge(challengeId)
      if (res.success) {
        toast({ title: "Challenge restored", description: "Status updated from schedule." })
        await refetch()
      } else {
        toast({ title: "Restore failed", description: res.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Restore failed", variant: "destructive" })
    } finally {
      setRestoreLoadingId(null)
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
      case "stopped":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Stopped</Badge>
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
                            <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="challenges" stroke="#3b82f6" strokeWidth={2} name="Challenges" />
                    <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} name="Participants" />
                    <Line type="monotone" dataKey="posts" stroke="#8b5cf6" strokeWidth={2} name="Posts" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Main sections */}
          <Tabs value={pageSection} onValueChange={(v) => setPageSection(v as typeof pageSection)}>
            <TabsList>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="pending-posts">Pending posts</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending participant documents</CardTitle>
                  <CardDescription>
                    Review required documents before participants can submit challenge posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChallengeDocumentsQueue portal="admin" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending-posts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending challenge posts</CardTitle>
                  <CardDescription>
                    Draft submissions on moderated challenges awaiting approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChallengePendingPostsQueue
                    portal="admin"
                    source="global-pending"
                    showFilters
                    linkChallengeToAdmin
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="challenges" className="mt-4">
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
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="ended">Ended</TabsTrigger>
                  <TabsTrigger value="stopped">Stopped</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <div className="relative mb-4 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, description, or organizer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading challenges...</span>
                    </div>
                  ) : displayChallenges.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {debouncedSearch ? "No challenges match your search." : "No challenges found."}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Challenge</TableHead>
                            <TableHead>Organizer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Moderation</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Rewards</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayChallenges.map((challenge) => (
                            <TableRow
                              key={challenge.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                            >
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{challenge.name}</p>
                                    {challenge.is_featured ? (
                                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                                        Featured
                                      </Badge>
                                    ) : null}
                                  </div>
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
                                    <AdminUserContactLines user={challenge.organizer} className="mt-1 max-w-[220px]" />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(challenge.status)}</TableCell>
                              <TableCell>
                                <ChallengeModerationBadge
                                  mode={challenge.moderation_mode}
                                  requiresDocument={challenge.requires_document}
                                />
                              </TableCell>
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
                                  {(() => {
                                    const maxWinners = resolveChallengeMaxWinners(challenge)
                                    return (
                                      <p className="text-muted-foreground">
                                        Winners: {maxWinners}
                                      </p>
                                    )
                                  })()}
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
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      aria-label={`Actions for ${challenge.name}`}
                                    >
                                      {startNowChallengeId === challenge.id ||
                                      restoreLoadingId === challenge.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <MoreHorizontal className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View details
                                    </DropdownMenuItem>
                                    {challenge.status === "pending" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() => handleAction(challenge, "approve")}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleAction(challenge, "reject")}
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {challenge.status === "approved" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          disabled={startNowChallengeId === challenge.id}
                                          onClick={() => handleStartNowFromList(challenge.id)}
                                        >
                                          <Rocket className="mr-2 h-4 w-4" />
                                          Start now
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {(challenge.status === "active" || challenge.status === "approved") && (
                                      <DropdownMenuItem
                                        className="text-orange-600"
                                        onClick={() => handleAction(challenge, "stop")}
                                      >
                                        <StopCircle className="mr-2 h-4 w-4" />
                                        Stop challenge
                                      </DropdownMenuItem>
                                    )}
                                    {challenge.status === "stopped" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          disabled={restoreLoadingId === challenge.id}
                                          onClick={() => void handleRestore(challenge.id)}
                                        >
                                          <RotateCcw className="mr-2 h-4 w-4" />
                                          Restore challenge
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
            </TabsContent>
          </Tabs>
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
                  `Stop "${selectedChallenge?.name}"? Participation closes immediately, but the challenge and its posts are kept and can be restored.`}
              </DialogDescription>
            </DialogHeader>
            {actionType === "reject" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Rejection reason (recommended)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The reason is shown to the creator on the rejected challenge.
                  </p>
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

