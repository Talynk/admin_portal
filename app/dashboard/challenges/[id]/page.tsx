"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
import {
  ExpandableScreen,
  ExpandableScreenContent,
} from "@/components/ui/expandable-screen"
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
  BarChart3,
  GripVertical,
  Video,
  Play,
  Eye,
  Image as ImageIcon,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useChallenge } from "@/hooks/use-challenge"
import { useChallengeAggregatedWinners, type AggregatedWinnerRow } from "@/hooks/use-challenge-aggregated-winners"
import { useChallengeParticipantsRanking, type RankingParticipantRow } from "@/hooks/use-challenge-participants-ranking"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl, getFileUrl, getThumbnailUrl } from "@/lib/file-utils"

/** Sortable row for one winner (user). Drag handle + Set rank for manual reorder. */
function SortableWinnerUserRow({
  row,
  rank,
  onViewPosts,
  onSetRank,
}: {
  row: AggregatedWinnerRow
  rank: number
  onViewPosts: () => void
  onSetRank?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.user.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? "opacity-50 bg-muted/50" : ""}>
      <TableCell className="w-10">
        <button type="button" className="cursor-grab active:cursor-grabbing touch-none p-1 rounded" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="w-16 font-bold text-lg text-primary">{rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getProfilePictureUrl(row.user.profile_picture)} />
            <AvatarFallback>{row.user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">@{row.user.username}</p>
            {row.user.display_name && (
              <p className="text-sm text-muted-foreground">{row.user.display_name}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{row.total_winner_posts}</TableCell>
      <TableCell>{row.total_likes_during_challenge}</TableCell>
      <TableCell>{row.winner_rank ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {row.latest_submission_at ? new Date(row.latest_submission_at).toLocaleString() : "—"}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewPosts(); }}>
          View posts
        </Button>
      </TableCell>
      {onSetRank && (
        <TableCell className="w-24">
          <Button variant="outline" size="sm" onClick={onSetRank}>
            Set rank
          </Button>
        </TableCell>
      )}
    </tr>
  )
}

export default function ChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "posts" | "analytics" | "winners">("overview")
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
    reorderWinners,
    confirmChallengeWinners,
  } = useChallenge(challengeId, analyticsDays)

  const isEndedOrStopped = challenge?.status === "ended" || challenge?.status === "stopped"
  const winnersConfirmedAt = (challenge as any)?.winners_confirmed_at
  const winnersConfirmedBy = (challenge as any)?.winners_confirmed_by

  const [confirmWinnersDialogOpen, setConfirmWinnersDialogOpen] = useState(false)
  const [confirmWinnersLoading, setConfirmWinnersLoading] = useState(false)
  const [participantPostsDialog, setParticipantPostsDialog] = useState<RankingParticipantRow | null>(null)
  const [participantPostsData, setParticipantPostsData] = useState<any[] | null>(null)
  const [participantPostsLoading, setParticipantPostsLoading] = useState(false)
  const [viewPostsForUser, setViewPostsForUser] = useState<{ userId: string; username: string } | null>(null)
  const [viewPostsForUserData, setViewPostsForUserData] = useState<any[] | null>(null)
  const [viewPostsForUserLoading, setViewPostsForUserLoading] = useState(false)
  const [playingPostId, setPlayingPostId] = useState<string | null>(null)
  const [orderedWinnerUserIds, setOrderedWinnerUserIds] = useState<string[] | null>(null)
  const [winnersReordering, setWinnersReordering] = useState(false)
  const [setRankDialogUser, setSetRankDialogUser] = useState<AggregatedWinnerRow | null>(null)
  const [setRankValue, setSetRankValue] = useState("")
  const [setRankSubmitting, setSetRankSubmitting] = useState(false)

  const { winners: aggregatedWinners, pagination: aggPagination, loading: aggLoading, setPage: setAggPage, page: aggPage, refetch: refetchAggregated } = useChallengeAggregatedWinners(
    challengeId,
    { page: 1, limit: 10, enabled: !!challengeId && isEndedOrStopped }
  )
  const { participants: rankingParticipants, loading: rankingLoading, search: rankingSearch, setSearch: setRankingSearch, setPage: setRankingPage, page: rankingPage, pagination: rankingPagination, refetch: refetchRanking } = useChallengeParticipantsRanking(
    challengeId,
    { page: 1, limit: 10, enabled: !!challengeId }
  )

  useEffect(() => {
    if (!participantPostsDialog || !challengeId) return
    setParticipantPostsLoading(true)
    setParticipantPostsData(null)
    apiClient
      .getChallengeParticipantPosts(challengeId, participantPostsDialog.user.id)
      .then((res) => {
        if (res && "data" in res && res.data) {
          const data = res.data as Record<string, unknown>
          const raw = data?.posts ?? data?.data ?? (Array.isArray(res.data) ? res.data : [])
          setParticipantPostsData(Array.isArray(raw) ? raw : [])
        } else {
          setParticipantPostsData([])
        }
      })
      .catch(() => setParticipantPostsData([]))
      .finally(() => setParticipantPostsLoading(false))
  }, [participantPostsDialog?.user.id, challengeId])

  useEffect(() => {
    if (!viewPostsForUser || !challengeId) return
    setViewPostsForUserLoading(true)
    setViewPostsForUserData(null)
    apiClient
      .getChallengeParticipantPosts(challengeId, viewPostsForUser.userId)
      .then((res) => {
        if (res && "data" in res && res.data) {
          const data = res.data as Record<string, unknown>
          const raw = data?.posts ?? data?.data ?? (Array.isArray(res.data) ? res.data : [])
          setViewPostsForUserData(Array.isArray(raw) ? raw : [])
        } else {
          setViewPostsForUserData([])
        }
      })
      .catch(() => setViewPostsForUserData([]))
      .finally(() => setViewPostsForUserLoading(false))
  }, [viewPostsForUser?.userId, challengeId])

  const userPostsViewOpen = !!(participantPostsDialog || viewPostsForUser)
  const userPostsViewTitle = participantPostsDialog
    ? `@${participantPostsDialog.user.username}`
    : viewPostsForUser
      ? `@${viewPostsForUser.username}`
      : ""
  const userPostsViewLoading = participantPostsLoading || viewPostsForUserLoading
  const userPostsViewPosts = useMemo(() => {
    let raw: any[] = []
    if (participantPostsDialog && participantPostsData) raw = participantPostsData
    else if (viewPostsForUser && viewPostsForUserData) raw = viewPostsForUserData
    return raw.map((item: any) => {
      const post = item.post ?? item
      const mediaUrl = post.video_url ?? post.hls_url ?? post.thumbnail_url ?? item.video_url
      const thumbUrl = post.thumbnail_url ?? post.thumbnail ?? (mediaUrl ? getThumbnailUrl(mediaUrl) : null)
      return {
        id: item.id ?? post.id ?? item.challenge_post_id,
        video_url: mediaUrl,
        thumbnail_url: thumbUrl,
        title: post.title ?? post.caption ?? "Post",
        submitted_at: item.submitted_at ?? post.submitted_at,
        likes_at_challenge_end: item.likes_at_challenge_end ?? post.likes_at_challenge_end,
        winner_rank: item.winner_rank ?? post.winner_rank,
      }
    })
  }, [participantPostsDialog, participantPostsData, viewPostsForUser, viewPostsForUserData])

  const closeUserPostsView = useCallback(() => {
    setParticipantPostsDialog(null)
    setViewPostsForUser(null)
    setPlayingPostId(null)
  }, [])

  const getContentType = useCallback((p: { video_url?: string; thumbnail_url?: string }) => {
    const url = p.video_url ?? p.thumbnail_url ?? ""
    if (!url) return "video"
    if (url.includes(".m3u8") || url.match(/\.(mp4|mov|webm|avi)$/i)) return "video"
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image"
    return "video"
  }, [])
  const getPreviewUrl = useCallback((p: { video_url?: string; thumbnail_url?: string }) => {
    const contentType = getContentType(p)
    const mediaUrl = p.video_url ?? null
    const resolved = getFileUrl(mediaUrl)
    if (contentType === "video") {
      const thumb = p.thumbnail_url ?? (mediaUrl ? getThumbnailUrl(mediaUrl) : null)
      return getFileUrl(thumb) || resolved
    }
    return resolved
  }, [getContentType])

  const orderedWinnersForDisplay = useMemo(() => {
    if (!aggregatedWinners.length) return []
    if (!orderedWinnerUserIds?.length) return aggregatedWinners
    const idToIndex = new Map(orderedWinnerUserIds.map((id, i) => [id, i]))
    return [...aggregatedWinners].sort((a, b) => {
      const i = idToIndex.get(a.user.id) ?? 9999
      const j = idToIndex.get(b.user.id) ?? 9999
      return i - j
    })
  }, [aggregatedWinners, orderedWinnerUserIds])

  const buildOrderedChallengePostIds = useCallback(
    (orderedUserIds: string[]) => {
      if (!challenge?.posts?.length) return []
      const byUser = new Map<string, typeof challenge.posts>()
      for (const cp of challenge.posts) {
        const uid = cp.user_id ?? (cp.post as { user?: { id: string } })?.user?.id
        if (!uid) continue
        if (!byUser.has(uid)) byUser.set(uid, [])
        byUser.get(uid)!.push(cp)
      }
      for (const [, posts] of byUser) {
        posts.sort((a, b) => {
          const rA = a.winner_rank ?? 999999
          const rB = b.winner_rank ?? 999999
          if (rA !== rB) return rA - rB
          const lA = a.likes_at_challenge_end ?? 0
          const lB = b.likes_at_challenge_end ?? 0
          return lB - lA
        })
      }
      const result: string[] = []
      for (const uid of orderedUserIds) {
        const posts = byUser.get(uid) ?? []
        for (const p of posts) result.push(p.id)
      }
      const orderedSet = new Set(orderedUserIds)
      for (const [uid, posts] of byUser) {
        if (orderedSet.has(uid)) continue
        for (const p of posts) result.push(p.id)
      }
      return result
    },
    [challenge?.posts]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleWinnersDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !orderedWinnersForDisplay.length) return
    const currentOrder = orderedWinnerUserIds ?? orderedWinnersForDisplay.map((r) => r.user.id)
    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(currentOrder, oldIndex, newIndex)
    setOrderedWinnerUserIds(reordered)
    const postIds = buildOrderedChallengePostIds(reordered)
    setWinnersReordering(true)
    const result = await reorderWinners(postIds)
    setWinnersReordering(false)
    if (result.success) {
      toast({ title: "Winners updated", description: "Ranking saved successfully." })
      refetch()
      refetchAggregated()
    } else {
      toast({ title: "Error", description: result.error || "Failed to reorder winners", variant: "destructive" })
    }
  }

  const handleSetRankUser = async () => {
    if (!setRankDialogUser || !orderedWinnersForDisplay.length) return
    const rank = parseInt(setRankValue, 10)
    if (isNaN(rank) || rank < 1 || rank > orderedWinnersForDisplay.length) {
      toast({ title: "Invalid rank", description: `Enter a number between 1 and ${orderedWinnersForDisplay.length}.`, variant: "destructive" })
      return
    }
    const currentOrder = orderedWinnerUserIds ?? orderedWinnersForDisplay.map((r) => r.user.id)
    const userId = setRankDialogUser.user.id
    const currentIndex = currentOrder.indexOf(userId)
    if (currentIndex === -1) return
    const targetIndex = rank - 1
    const reordered = arrayMove(currentOrder, currentIndex, Math.min(targetIndex, currentOrder.length - 1))
    setOrderedWinnerUserIds(reordered)
    const postIds = buildOrderedChallengePostIds(reordered)
    setSetRankSubmitting(true)
    const result = await reorderWinners(postIds)
    setSetRankSubmitting(false)
    setSetRankDialogUser(null)
    setSetRankValue("")
    if (result.success) {
      toast({ title: "Rank updated", description: "Winner position saved." })
      refetch()
      refetchAggregated()
    } else {
      toast({ title: "Error", description: result.error || "Failed to set rank", variant: "destructive" })
    }
  }

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
      case "stopped":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Stopped</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleConfirmWinners = async () => {
    setConfirmWinnersLoading(true)
    try {
      const result = await confirmChallengeWinners()
      if (result.success) {
        toast({ title: "Winners confirmed", description: "All participants have been notified." })
        setConfirmWinnersDialogOpen(false)
        refetch()
        refetchAggregated()
      } else {
        toast({ title: "Error", description: result.error ?? "Failed to confirm winners", variant: "destructive" })
      }
    } finally {
      setConfirmWinnersLoading(false)
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
        <div className="space-y-4">
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

          {/* Tabs at top */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{challenge.statistics.total_participants} participants</span>
                <span>·</span>
                <span>{challenge.statistics.total_posts} posts</span>
                <span>·</span>
                <span>{new Date(challenge.start_date).toLocaleDateString()} – {new Date(challenge.end_date).toLocaleDateString()}</span>
              </div>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="w-full flex-wrap h-auto gap-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="participants">Participants ({challenge.statistics.total_participants})</TabsTrigger>
                  <TabsTrigger value="posts">Posts ({challenge.posts.length})</TabsTrigger>
                  {(challenge.status === "ended" || challenge.status === "stopped") && (
                    <TabsTrigger value="winners">Winners</TabsTrigger>
                  )}
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
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
                        {(challenge as any).rewards && (
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{(challenge as any).rewards}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Challenge rewards</p>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Challenge Info */}
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
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
                              {(challenge as any).organizer_name && (
                                <p className="text-sm text-muted-foreground">
                                  {(challenge as any).organizer_name}
                                </p>
                              )}
                              {challenge.organizer.display_name && !(challenge as any).organizer_name && (
                                <p className="text-sm text-muted-foreground">
                                  {challenge.organizer.display_name}
                                </p>
                              )}
                            </div>
                          </div>
                          {((challenge as any).organizer_contact || (challenge as any).contact_email) && (
                            <div className="mt-2 space-y-1 text-sm">
                              {(challenge as any).organizer_contact && (
                                <p><span className="text-muted-foreground">Contact:</span> {(challenge as any).organizer_contact}</p>
                              )}
                              {(challenge as any).contact_email && (
                                <p><span className="text-muted-foreground">Email:</span> {(challenge as any).contact_email}</p>
                              )}
                            </div>
                          )}
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
                        {(challenge as any).approved_at && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Approved At</p>
                            <p className="mt-1">{new Date((challenge as any).approved_at).toLocaleString()}</p>
                          </div>
                        )}
                        {(challenge as any).rejection_reason && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Rejection Reason</p>
                            <p className="mt-1 text-amber-600">{(challenge as any).rejection_reason}</p>
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
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{challenge.description}</p>
                    </div>
                    {(challenge as any).eligibility_criteria && (
                      <div>
                        <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{(challenge as any).eligibility_criteria}</p>
                      </div>
                    )}
                    {(challenge as any).what_you_do && (
                      <div>
                        <h3 className="font-semibold mb-2">What You Do</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{(challenge as any).what_you_do}</p>
                      </div>
                    )}
                    {(challenge as any).scoring_criteria && (
                      <div>
                        <h3 className="font-semibold mb-2">Scoring Criteria</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{(challenge as any).scoring_criteria}</p>
                      </div>
                    )}
                    {(challenge as any).min_content_per_account != null && (
                      <div>
                        <h3 className="font-semibold mb-2">Minimum Content per Account</h3>
                        <p className="text-muted-foreground">{(challenge as any).min_content_per_account} post(s)</p>
                      </div>
                    )}
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

                <TabsContent value="participants" className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    Participants ranked by total likes (and latest submission for ties). Search by username or display name.
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Search by username or display name..."
                      value={rankingSearch}
                      onChange={(e) => setRankingSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  {rankingLoading ? (
                    <div className="flex items-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading ranking…
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-14">Rank</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Posts</TableHead>
                              <TableHead>Total likes</TableHead>
                              <TableHead>Latest submission</TableHead>
                              <TableHead className="w-24" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rankingParticipants.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No participants found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              rankingParticipants.map((row, index) => (
                                <TableRow
                                  key={row.user.id}
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => setParticipantPostsDialog(row)}
                                >
                                  <TableCell className="font-bold">{(rankingPage - 1) * 10 + index + 1}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={getProfilePictureUrl(row.user.profile_picture)} />
                                        <AvatarFallback>{row.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">@{row.user.username}</p>
                                        {row.user.display_name && (
                                          <p className="text-xs text-muted-foreground">{row.user.display_name}</p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{row.total_posts}</TableCell>
                                  <TableCell>{row.total_likes}</TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {row.latest_submission_at
                                      ? new Date(row.latest_submission_at).toLocaleString()
                                      : "—"}
                                  </TableCell>
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setParticipantPostsDialog(row)}
                                    >
                                      View posts
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {rankingPagination && (rankingPagination.totalPages ?? 0) > 1 && (
                        <div className="flex items-center justify-between mt-2">
                          <Button variant="outline" size="sm" disabled={rankingPage <= 1} onClick={() => setRankingPage(Math.max(1, rankingPage - 1))}>
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {rankingPage} of {rankingPagination.totalPages ?? 1}
                          </span>
                          <Button variant="outline" size="sm" disabled={rankingPage >= (rankingPagination.totalPages ?? 1)} onClick={() => setRankingPage(rankingPage + 1)}>
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="posts" className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Post ID</TableHead>
                          <TableHead>Likes at end</TableHead>
                          <TableHead>Winner rank</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {challenge.posts.map((challengePost) => (
                          <TableRow
                            key={challengePost.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              setViewPostsForUser({
                                userId: challengePost.user_id ?? challengePost.post.user.id,
                                username: challengePost.post.user.username,
                              })
                            }
                          >
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
                            <TableCell>{challengePost.likes_at_challenge_end ?? "—"}</TableCell>
                            <TableCell>{challengePost.winner_rank ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {(challenge.status === "ended" || challenge.status === "stopped") && (
                  <TabsContent value="winners" className="mt-6 space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Winners are users (one row per user), ranked by total likes across their posts. You can reorder based on other criteria (e.g. quality, rules) using drag-and-drop or Set rank, then confirm to notify participants.
                    </p>
                    {winnersConfirmedAt ? (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm font-medium">
                          Winners confirmed at {new Date(winnersConfirmedAt).toLocaleString()}
                          {winnersConfirmedBy?.username && (
                            <> by @{winnersConfirmedBy.username}</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reordering and confirming are no longer available.
                        </p>
                      </div>
                    ) : null}
                    {aggLoading ? (
                      <div className="flex items-center gap-2 py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading winners…
                      </div>
                    ) : (
                      <>
                        {!winnersConfirmedAt && (
                          <p className="text-sm text-muted-foreground">
                            Drag rows or use &quot;Set rank&quot; to set the official winner order. Then click &quot;Confirm winners&quot; to notify all participants.
                          </p>
                        )}
                        {winnersReordering && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving order…
                          </div>
                        )}
                        {!winnersConfirmedAt && orderedWinnersForDisplay.length > 0 && (
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWinnersDragEnd}>
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-10" />
                                    <TableHead className="w-16">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Posts</TableHead>
                                    <TableHead>Total likes</TableHead>
                                    <TableHead>Best rank</TableHead>
                                    <TableHead>Latest submission</TableHead>
                                    <TableHead className="w-24">View</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <SortableContext items={orderedWinnersForDisplay.map((r) => r.user.id)} strategy={verticalListSortingStrategy}>
                                    {orderedWinnersForDisplay.map((row, index) => (
                                      <SortableWinnerUserRow
                                        key={row.user.id}
                                        row={row}
                                        rank={index + 1}
                                        onViewPosts={() => setViewPostsForUser({ userId: row.user.id, username: row.user.username })}
                                        onSetRank={() => { setSetRankDialogUser(row); setSetRankValue(String(index + 1)); }}
                                      />
                                    ))}
                                  </SortableContext>
                                </TableBody>
                              </Table>
                            </div>
                          </DndContext>
                        )}
                        {winnersConfirmedAt && (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-16">Rank</TableHead>
                                  <TableHead>User</TableHead>
                                  <TableHead>Posts</TableHead>
                                  <TableHead>Total likes</TableHead>
                                  <TableHead>Best rank</TableHead>
                                  <TableHead>Latest submission</TableHead>
                                  <TableHead className="w-24" />
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orderedWinnersForDisplay.map((row, index) => (
                                  <TableRow
                                    key={row.user.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setViewPostsForUser({ userId: row.user.id, username: row.user.username })}
                                  >
                                    <TableCell className="font-bold text-primary">{index + 1}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={getProfilePictureUrl(row.user.profile_picture)} />
                                          <AvatarFallback>{row.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">@{row.user.username}</p>
                                          {row.user.display_name && (
                                            <p className="text-xs text-muted-foreground">{row.user.display_name}</p>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{row.total_winner_posts}</TableCell>
                                    <TableCell>{row.total_likes_during_challenge}</TableCell>
                                    <TableCell>{row.winner_rank ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {row.latest_submission_at ? new Date(row.latest_submission_at).toLocaleString() : "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewPostsForUser({ userId: row.user.id, username: row.user.username }); }}>
                                        View posts
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        {aggregatedWinners.length === 0 && !aggLoading ? (
                          <p className="text-center py-8 text-muted-foreground">No winners yet.</p>
                        ) : null}
                        {!winnersConfirmedAt && orderedWinnersForDisplay.length > 0 && (
                          <Button className="mt-4" onClick={() => setConfirmWinnersDialogOpen(true)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm winners
                          </Button>
                        )}
                        {aggPagination && (aggPagination.totalPages ?? 0) > 1 && (
                          <div className="flex items-center justify-between mt-2">
                            <Button variant="outline" size="sm" disabled={aggPage <= 1} onClick={() => setAggPage(Math.max(1, aggPage - 1))}>
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {aggPage} of {aggPagination.totalPages ?? 1}
                            </span>
                            <Button variant="outline" size="sm" disabled={aggPage >= (aggPagination.totalPages ?? 1)} onClick={() => setAggPage(aggPage + 1)}>
                              Next
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="analytics" className="mt-6">
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

        {/* Confirm winners consent dialog */}
        <Dialog open={confirmWinnersDialogOpen} onOpenChange={setConfirmWinnersDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm winners</DialogTitle>
              <DialogDescription>
                This will lock the current winner order and send a notification to every participant. This action cannot be undone. Do you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmWinnersDialogOpen(false)} disabled={confirmWinnersLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirmWinners} disabled={confirmWinnersLoading}>
                {confirmWinnersLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User posts view (Participants / Winners / Posts row click) – expandable screen modal */}
        <ExpandableScreen open={userPostsViewOpen} onOpenChange={(open) => !open && closeUserPostsView()}>
          <ExpandableScreenContent contentRadius="24px" className="h-[90vh] max-h-[90vh]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Posts in this challenge</h2>
              <p className="text-muted-foreground mt-1">
                {userPostsViewTitle && <>{userPostsViewTitle} · click a card to play or view</>}
              </p>
            </div>
            {userPostsViewLoading ? (
              <div className="flex items-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Loading posts…</span>
              </div>
            ) : userPostsViewPosts.length === 0 ? (
              <p className="text-center py-16 text-muted-foreground">No posts found.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userPostsViewPosts.map((p: any) => {
                  const contentType = getContentType(p)
                  const fileUrl = getFileUrl(p.video_url)
                  const previewUrl = getPreviewUrl(p)
                  const isPlaying = playingPostId === p.id
                  return (
                    <Card
                      key={p.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="relative w-full aspect-video min-h-[240px] bg-muted/50 overflow-hidden rounded-t-lg flex items-center justify-center group">
                        {isPlaying && fileUrl ? (
                          <>
                            {contentType === "video" ? (
                              <video
                                src={fileUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain bg-black min-h-[240px]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <img
                                src={fileUrl}
                                alt={p.title || "Media"}
                                className="w-full h-full object-contain bg-black min-h-[240px]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white z-10 h-9 w-9 p-0"
                              onClick={() => setPlayingPostId(null)}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={p.title || "Preview"}
                                className="w-full h-full object-cover min-h-[240px]"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground min-h-[240px] justify-center">
                                {contentType === "video" ? <Video className="w-12 h-12 opacity-60" /> : <ImageIcon className="w-12 h-12 opacity-60" />}
                                <span className="text-sm">No preview</span>
                              </div>
                            )}
                            {fileUrl && (
                              <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-pointer"
                                onClick={() => setPlayingPostId(isPlaying ? null : p.id)}
                                aria-label="Play"
                              >
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-4">
                                  <Play className="w-10 h-10 text-white" />
                                </span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{p.title}</h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {p.likes_at_challenge_end != null && <span>♥ {p.likes_at_challenge_end}</span>}
                          {p.winner_rank != null && <span>Rank {p.winner_rank}</span>}
                          {p.submitted_at && <span>{new Date(p.submitted_at).toLocaleDateString()}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ExpandableScreenContent>
        </ExpandableScreen>

        {/* Set rank dialog (for winner user) */}
        <Dialog open={!!setRankDialogUser} onOpenChange={(open) => !open && setSetRankDialogUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set winner rank</DialogTitle>
              <DialogDescription>
                {setRankDialogUser && (
                  <>Enter the rank position (1–{orderedWinnersForDisplay.length}) for @{setRankDialogUser.user.username}. This user will move to that position.</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="rank-input">Rank</Label>
                <Input
                  id="rank-input"
                  type="number"
                  min={1}
                  max={orderedWinnersForDisplay.length || 1}
                  value={setRankValue}
                  onChange={(e) => setSetRankValue(e.target.value)}
                  placeholder={orderedWinnersForDisplay.length ? `1–${orderedWinnersForDisplay.length}` : "1"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSetRankDialogUser(null)} disabled={setRankSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSetRankUser} disabled={setRankSubmitting}>
                {setRankSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Move to rank
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </DashboardLayout>
    </ProtectedRoute>
  )
}

