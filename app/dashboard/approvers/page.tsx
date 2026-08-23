"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTableShell, TruncateCell } from "@/components/data-table-shell"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  Search,
  UserPlus,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  ExternalLink,
  AlertCircle,
  Loader2,
  Send,
  Copy,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useApprovers } from "@/hooks/use-approvers"
import { useDashboard } from "@/hooks/use-dashboard"
import { toast } from "@/hooks/use-toast"
import { Approver, ApproverInvitationResult } from "@/lib/types/admin"
import { ApproverInviteStatus } from "@/components/approver-invite-status"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ApproversPage() {
  const router = useRouter()
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(null)
  const [addApproverDialogOpen, setAddApproverDialogOpen] = useState(false)
  const [viewApproverDialogOpen, setViewApproverDialogOpen] = useState(false)
  const [editApproverDialogOpen, setEditApproverDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebouncedValue(searchTerm, 400)
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [resendTarget, setResendTarget] = useState<Approver | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendResult, setResendResult] = useState<ApproverInvitationResult | null>(null)
  // Per-approver 60s cooldown enforced by the API, mirrored so the button can
  // count down instead of failing with a 429.
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [now, setNow] = useState(() => Date.now())
  const [invitePendingHint, setInvitePendingHint] = useState<string | null>(null)

  const [newApprover, setNewApprover] = useState({
    email: "",
  })

  const hasCooldowns = Object.keys(cooldowns).length > 0
  useEffect(() => {
    if (!hasCooldowns) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [hasCooldowns])

  const getCooldownSeconds = (approverId: string) => {
    const until = cooldowns[approverId]
    if (!until) return 0
    return Math.max(0, Math.ceil((until - now) / 1000))
  }

  // Use the API hook
    const {
    approvers,
    loading,
    error,
    total,
    totalPages,
    refetch,
    createApproverInvitation,
    resendApproverInvite,
    updateApprover,
    activateApprover,
    suspendApprover,
    deactivateApprover,
    deleteApprover,
  } = useApprovers({
    page,
    limit: 20,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  // Fetch dashboard stats for content ratio
  const { stats: dashboardStats } = useDashboard()

  // Calculate approver-to-content ratio
  const activeApproversCount = approvers.filter((a) => a.status === "active").length
  const pendingReviews = dashboardStats?.pendingReviews || 0
  const totalPosts = dashboardStats?.totalPosts || 0
  
  // Calculate approver-to-content ratio
  const postsPerApprover = activeApproversCount > 0 
    ? (totalPosts / activeApproversCount).toFixed(1) 
    : totalPosts > 0 ? "∞" : "0"
  
  const pendingPerApprover = activeApproversCount > 0 
    ? (pendingReviews / activeApproversCount).toFixed(1) 
    : pendingReviews > 0 ? "∞" : "0"

  // Determine if approvers are sufficient (threshold: < 50 posts per approver is good)
  const isSufficient = activeApproversCount > 0 && parseFloat(postsPerApprover) < 50
  const ratioStatus = activeApproversCount === 0 
    ? "No active approvers" 
    : isSufficient 
      ? "Well balanced" 
      : "Needs more approvers"

  const handleAddApprover = async () => {
    if (!newApprover.email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setIsActionLoading(true)
    setInvitePendingHint(null)
    try {
      const result = await createApproverInvitation(newApprover.email)
      if (result.success) {
        toast({
          title: "Invitation sent",
          description:
            result.message ||
            "Onboarding link emailed. It expires in 48 hours and can only be used once.",
        })
        setAddApproverDialogOpen(false)
        setNewApprover({
          email: "",
        })
      } else if (result.data?.invitePending) {
        // The API refuses to silently invalidate a link the invitee may be
        // about to click, so steer the admin to the Resend action instead.
        setInvitePendingHint(
          result.message ||
            result.error ||
            "This email already has a valid invitation. Use Resend on their row to replace it with a fresh link."
        )
      } else if (result.data?.exists) {
        setInvitePendingHint(
          result.message || "This email already belongs to an approver account."
        )
      } else {
        toast({
          title: "Error",
          description: result.message || result.error || "Failed to create approver invitation",
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
  }

  const handleResendInvite = async () => {
    if (!resendTarget) return

    setResendLoading(true)
    try {
      const result = await resendApproverInvite(resendTarget.id)
      if (result.success) {
        setResendResult(result.data ?? null)
        setCooldowns((prev) => ({ ...prev, [resendTarget.id]: Date.now() + 60_000 }))
        setNow(Date.now())
        toast({
          title: "Invitation resent",
          description:
            result.message ||
            `A fresh link was emailed to ${resendTarget.email}. The earlier link no longer works.`,
        })
        return
      }

      const retryAfter = result.data?.retryAfterSeconds
      if (retryAfter) {
        setCooldowns((prev) => ({
          ...prev,
          [resendTarget.id]: Date.now() + retryAfter * 1000,
        }))
        setNow(Date.now())
      }
      toast({
        title: "Could not resend",
        description: result.message || result.error || "Failed to resend the invitation",
        variant: "destructive",
      })
      setResendTarget(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setResendTarget(null)
    } finally {
      setResendLoading(false)
    }
  }

  const copyOnboardingLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: "Link copied" })
    } catch {
      toast({
        title: "Copy failed",
        description: "Select and copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteApprover = async (approverId: string) => {
    setIsActionLoading(true)
    try {
      const result = await deleteApprover(approverId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Approver deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete approver",
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
  }

  const handleToggleStatus = async (approverId: string, action: 'activate' | 'suspend' | 'deactivate') => {
    setIsActionLoading(true)
    try {
      let result
      if (action === 'activate') {
        result = await activateApprover(approverId)
      } else if (action === 'suspend') {
        result = await suspendApprover(approverId)
      } else {
        result = await deactivateApprover(approverId)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Approver ${action}d successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update approver status",
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
  }

  // Drive the action off the API's `canResend` flag; fall back to status for
  // rows served by an older payload without the invite block.
  const canResendInvite = (approver: Approver) => {
    if (approver.invite) return approver.invite.canResend
    return approver.status !== "active"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "suspended":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Suspended</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }


  // Calculate stats from real data
  const approverStats = {
    totalApprovers: total || approvers.length,
    activeApprovers: approvers.filter((a) => a.status === "active").length,
    inactiveApprovers: approvers.filter((a) => a.status === "inactive").length,
    averageApprovalRate: 0, // Not available in API
    totalReviewsToday: 0, // Not available in API
    pendingInvitations: 0, // Not available in API
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Approver Management</h1>
              <p className="text-muted-foreground">Manage approver accounts and permissions</p>
            </div>
            <Button onClick={() => setAddApproverDialogOpen(true)} className="hover:bg-primary/90 transition-colors">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Approver
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading approvers</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="mt-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="approvers" className="space-y-6">
            <TabsList>
              <TabsTrigger value="approvers">All Approvers</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="approvers" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Approvers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? "..." : approverStats.totalApprovers}
                    </div>
                    <p className="text-xs text-muted-foreground">Registered accounts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Approvers</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? "..." : approverStats.activeApprovers}
                    </div>
                    <p className="text-xs text-muted-foreground">Currently working</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive Approvers</CardTitle>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? "..." : approverStats.inactiveApprovers}
                    </div>
                    <p className="text-xs text-muted-foreground">Not active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Workload Ratio</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${isSufficient ? 'text-green-600' : 'text-orange-600'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? "..." : `${postsPerApprover} posts/approver`}
                    </div>
                    <p className={`text-xs ${isSufficient ? 'text-green-600' : 'text-orange-600'}`}>
                      {ratioStatus}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingPerApprover} pending per approver
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Approvers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Approver Accounts</CardTitle>
                  <CardDescription>Manage all approver accounts and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, username, or ID..."
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading approvers...</span>
                    </div>
                  ) : (
                    <>
                      <DataTableShell empty={approvers.length === 0} emptyMessage="No approvers found matching your criteria." minWidth="960px">
                        <Table>
                          <TableHeader>
                          <TableRow>
                            <TableHead>Approver</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invitation</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead>Posts</TableHead>
                            <TableHead>Join Date</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                            {approvers.map((approver) => (
                              <TableRow
                                key={approver.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => router.push(`/dashboard/approvers/${approver.id}`)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src="/generic-placeholder-graphic.png" />
                                      <AvatarFallback>
                                        {approver.username
                                          ?.charAt(0)
                                          .toUpperCase() || "A"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">@{approver.username}</p>
                                      <TruncateCell className="text-sm text-muted-foreground" title={approver.email}>
                                        {approver.email}
                                      </TruncateCell>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(approver.status)}</TableCell>
                                <TableCell>
                                  <ApproverInviteStatus invite={approver.invite} />
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p>Rate: {approver.performance?.approvalRate || 0}%</p>
                                    <p className="text-muted-foreground">
                                      Avg: {approver.performance?.averageResponseTime || 0}s
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p>{approver.totalApprovedPosts || 0} approved</p>
                                    <p className="text-muted-foreground">{approver.totalPosts || 0} total</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {approver.joinedDate
                                    ? new Date(approver.joinedDate).toLocaleDateString()
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  {approver.lastActive
                                    ? new Date(approver.lastActive).toLocaleDateString()
                                    : "Never"}
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                                        disabled={isActionLoading}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => window.open(`/dashboard/approvers/${approver.id}`, '_blank')}
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View Full Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedApprover(approver)
                                          setViewApproverDialogOpen(true)
                                        }}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Quick View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedApprover(approver)
                                          setEditApproverDialogOpen(true)
                                        }}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {canResendInvite(approver) && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setResendResult(null)
                                            setResendTarget(approver)
                                          }}
                                          disabled={
                                            isActionLoading || getCooldownSeconds(approver.id) > 0
                                          }
                                        >
                                          <Send className="mr-2 h-4 w-4" />
                                          {getCooldownSeconds(approver.id) > 0
                                            ? `Resend in ${getCooldownSeconds(approver.id)}s`
                                            : "Resend invitation"}
                                        </DropdownMenuItem>
                                      )}
                                      {approver.status === "pending" && (
                                        <DropdownMenuItem
                                          onClick={() => handleToggleStatus(approver.id, 'activate')}
                                          disabled={isActionLoading}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Activate
                                        </DropdownMenuItem>
                                      )}
                                      {approver.status === "active" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => handleToggleStatus(approver.id, 'suspend')}
                                            disabled={isActionLoading}
                                            className="text-orange-600"
                                          >
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Suspend
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleToggleStatus(approver.id, 'deactivate')}
                                            disabled={isActionLoading}
                                          >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Deactivate
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {(approver.status === "suspended" || approver.status === "inactive") && (
                                        <DropdownMenuItem
                                          onClick={() => handleToggleStatus(approver.id, 'activate')}
                                          disabled={isActionLoading}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Activate
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteApprover(approver.id)}
                                        className="text-red-600"
                                        disabled={isActionLoading}
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

                      {totalPages > 1 ? (
                        <div className="flex items-center justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                            {total ? ` · ${total} total` : ""}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {/* Team Performance Stats */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading stats...</span>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {approvers
                    .filter((a) => a.status === "active")
                    .map((approver) => (
                      <Card key={approver.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="/generic-placeholder-graphic.png" />
                              <AvatarFallback>
                                {approver.username?.charAt(0).toUpperCase() || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-sm font-medium">@{approver.username}</CardTitle>
                          </div>
                          {getStatusBadge(approver.status)}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Approval Rate:</span>
                              <span className="font-medium">{approver.performance?.approvalRate || 0}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Avg Response:</span>
                              <span className="font-medium">{approver.performance?.averageResponseTime || 0}s</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Posts Reviewed:</span>
                              <span className="font-medium">{approver.totalPosts || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Approved:</span>
                              <span className="font-medium">{approver.totalApprovedPosts || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Resend Invitation Dialog */}
        <Dialog
          open={!!resendTarget}
          onOpenChange={(open) => {
            if (!open) {
              setResendTarget(null)
              setResendResult(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {resendResult ? "Invitation resent" : "Resend invitation"}
              </DialogTitle>
              <DialogDescription>
                {resendResult
                  ? `A fresh onboarding link was emailed to ${resendTarget?.email}.`
                  : `Send a new onboarding link to ${resendTarget?.email}.`}
              </DialogDescription>
            </DialogHeader>

            {resendResult ? (
              <div className="space-y-3">
                {resendResult.expiresInHours ? (
                  <p className="text-sm text-muted-foreground">
                    The new link expires in {resendResult.expiresInHours} hours and can only
                    be used once.
                  </p>
                ) : null}
                {resendResult.onboardingLink ? (
                  <div className="space-y-2">
                    <Label>Onboarding link</Label>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 rounded-md border bg-muted/40 p-2 text-xs break-all">
                        {resendResult.onboardingLink}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyOnboardingLink(resendResult.onboardingLink!)}
                        aria-label="Copy onboarding link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This link is credential-equivalent — only share it with the invitee.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The link previously emailed will stop working immediately. Avoid resending
                  while the invitee may be filling in the onboarding form.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              {resendResult ? (
                <Button
                  onClick={() => {
                    setResendTarget(null)
                    setResendResult(null)
                  }}
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setResendTarget(null)}
                    disabled={resendLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleResendInvite} disabled={resendLoading}>
                    {resendLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Resend invitation
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Approver Dialog */}
        <Dialog
          open={addApproverDialogOpen}
          onOpenChange={(open) => {
            setAddApproverDialogOpen(open)
            if (!open) setInvitePendingHint(null)
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invite New Approver</DialogTitle>
              <DialogDescription>
                Send an invitation email to create a new approver account. They will complete onboarding via the email link.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newApprover.email}
                  onChange={(e) => setNewApprover((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="approver@talentix.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  An onboarding link will be sent to this email address. It expires in 48
                  hours and can only be used once.
                </p>
              </div>
              {invitePendingHint && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{invitePendingHint}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddApproverDialogOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddApprover}
                disabled={!newApprover.email || isActionLoading}
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Approver Dialog */}
        <Dialog open={viewApproverDialogOpen} onOpenChange={setViewApproverDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Approver Details</DialogTitle>
              <DialogDescription>View detailed information about this approver account.</DialogDescription>
            </DialogHeader>

            {selectedApprover && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/generic-placeholder-graphic.png" />
                    <AvatarFallback className="text-lg">
                      {selectedApprover.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">@{selectedApprover.username}</h3>
                    <p className="text-muted-foreground">{selectedApprover.email}</p>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(selectedApprover.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Account Information</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">ID:</span> {selectedApprover.id}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span> {selectedApprover.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Join Date:</span>{" "}
                          {selectedApprover.joinedDate
                            ? new Date(selectedApprover.joinedDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Last Active:</span>{" "}
                          {selectedApprover.lastActive
                            ? new Date(selectedApprover.lastActive).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Performance</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Approval Rate:</span>{" "}
                          {selectedApprover.performance?.approvalRate || 0}%
                        </p>
                        <p>
                          <span className="text-muted-foreground">Avg Response Time:</span>{" "}
                          {selectedApprover.performance?.averageResponseTime || 0}s
                        </p>
                        <p>
                          <span className="text-muted-foreground">Total Posts:</span>{" "}
                          {selectedApprover.totalPosts || 0}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Approved Posts:</span>{" "}
                          {selectedApprover.totalApprovedPosts || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewApproverDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
