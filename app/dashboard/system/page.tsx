"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Loader2,
  PlayCircle,
  RefreshCw,
  User,
  Video,
} from "lucide-react"
import { useVideoPipeline } from "@/hooks/use-posts-processing"
import { useVideoPipelineStats } from "@/hooks/use-video-pipeline-stats"
import { VideoPipelineStatsCards } from "@/components/video-pipeline-stats-cards"
import { VideoProcessingStatusBadge } from "@/components/video-processing-status-badge"
import { VideoPipelineRecoveryDialog } from "@/components/video-pipeline-recovery-dialog"
import { AdminUserContactLines } from "@/components/admin-user-contact-lines"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import type {
  FailStaleUploadsResponse,
  RecoverAllResponse,
  ReconcileResponse,
  RequeueResponse,
  VideoPipelineStatusFilter,
} from "@/lib/types/video-pipeline"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type StatusTab = "all" | VideoPipelineStatusFilter

function unwrapPayload<T>(data: unknown): T {
  const raw = data as Record<string, unknown>
  return (raw?.data ?? raw) as T
}

export default function SystemPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get("status")
  const validStatuses = ["failed", "pending", "processing", "uploading"] as const
  const initialTab: StatusTab =
    initialStatus && validStatuses.includes(initialStatus as (typeof validStatuses)[number])
      ? (initialStatus as StatusTab)
      : "all"

  const [statusTab, setStatusTab] = useState<StatusTab>(initialTab)

  useEffect(() => {
    const param = searchParams.get("status")
    if (param && validStatuses.includes(param as (typeof validStatuses)[number])) {
      setStatusTab(param as StatusTab)
    }
  }, [searchParams])
  const statusFilter: VideoPipelineStatusFilter =
    statusTab === "all" ? undefined : statusTab

  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } =
    useVideoPipelineStats()
  const { posts, pipeline, total, loading, error, refetch: refetchList } = useVideoPipeline({
    limit: 100,
    status: statusFilter,
  })

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmRecoverOpen, setConfirmRecoverOpen] = useState(false)
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false)
  const [recoveryResult, setRecoveryResult] = useState<
    | { kind: "recover-all"; data: RecoverAllResponse }
    | { kind: "reconcile"; data: ReconcileResponse }
    | { kind: "requeue"; data: RequeueResponse }
    | { kind: "fail-stale"; data: FailStaleUploadsResponse }
    | null
  >(null)
  const [recoveryDialogTitle, setRecoveryDialogTitle] = useState("Recovery result")
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const refreshAll = useCallback(async () => {
    await Promise.all([refetchStats(), refetchList()])
  }, [refetchStats, refetchList])

  const showRecoveryResult = (
    title: string,
    result:
      | { kind: "recover-all"; data: RecoverAllResponse }
      | { kind: "reconcile"; data: ReconcileResponse }
      | { kind: "requeue"; data: RequeueResponse }
      | { kind: "fail-stale"; data: FailStaleUploadsResponse }
  ) => {
    setRecoveryDialogTitle(title)
    setRecoveryResult(result)
    setRecoveryDialogOpen(true)
  }

  const handlePreviewRecovery = async () => {
    setActionLoading("preview-recover")
    try {
      const res = await apiClient.recoverAllVideoProcessing({ dryRun: true, limit: 100 })
      if (res.success && res.data) {
        showRecoveryResult("Recovery preview", {
          kind: "recover-all",
          data: unwrapPayload<RecoverAllResponse>(res.data),
        })
      } else {
        toast({
          title: "Preview failed",
          description: res.error ?? "Could not preview recovery",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Preview failed", description: "Network error", variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunRecovery = async () => {
    setConfirmRecoverOpen(false)
    setActionLoading("run-recover")
    try {
      const res = await apiClient.recoverAllVideoProcessing({ dryRun: false, limit: 100 })
      if (res.success && res.data) {
        const data = unwrapPayload<RecoverAllResponse>(res.data)
        showRecoveryResult("Recovery applied", { kind: "recover-all", data })
        await refreshAll()
        if (data.statsAfter?.recoverableWithSource > 0) {
          toast({
            title: "Recovery incomplete",
            description: `${data.statsAfter.recoverableWithSource} post(s) still recoverable — run recovery again.`,
          })
        } else {
          toast({ title: "Recovery complete", description: data.message })
        }
      } else {
        toast({
          title: "Recovery failed",
          description: res.error ?? "Could not run recovery",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Recovery failed", description: "Network error", variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReconcile = async (apply: boolean) => {
    setActionLoading(apply ? "reconcile-apply" : "reconcile-preview")
    try {
      const res = await apiClient.reconcileVideoProcessingFromCdn({
        dryRun: !apply,
        limit: 50,
      })
      if (res.success && res.data) {
        const data = unwrapPayload<ReconcileResponse>(res.data)
        showRecoveryResult(apply ? "CDN reconcile applied" : "CDN reconcile preview", {
          kind: "reconcile",
          data,
        })
        if (apply) await refreshAll()
      } else {
        toast({
          title: "Reconcile failed",
          description: res.error ?? "Request failed",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequeue = async (apply: boolean) => {
    setActionLoading(apply ? "requeue-apply" : "requeue-preview")
    try {
      const res = await apiClient.requeueStuckVideoProcessing({
        dryRun: !apply,
        limit: 30,
      })
      if (res.success && res.data) {
        const data = unwrapPayload<RequeueResponse>(res.data)
        showRecoveryResult(apply ? "Requeue applied" : "Requeue preview", {
          kind: "requeue",
          data,
        })
        if (apply) await refreshAll()
      } else {
        toast({
          title: "Requeue failed",
          description: res.error ?? "Request failed",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleFailStale = async (apply: boolean) => {
    setActionLoading(apply ? "fail-stale-apply" : "fail-stale-preview")
    try {
      const res = await apiClient.failStaleVideoUploads({
        dryRun: !apply,
        olderThanMinutes: 720,
        limit: 200,
      })
      if (res.success && res.data) {
        const data = unwrapPayload<FailStaleUploadsResponse>(res.data)
        showRecoveryResult(
          apply ? "Stale uploads marked failed" : "Fail stale uploads preview",
          { kind: "fail-stale", data }
        )
        if (apply) await refreshAll()
      } else {
        toast({
          title: "Cleanup failed",
          description: res.error ?? "Request failed",
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const displayStats = stats ?? pipeline
  const isRefreshing = loading || statsLoading

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Video Processing</h1>
              <p className="text-muted-foreground">
                Monitor upload/transcode pipeline, recover stuck videos after outages
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refreshAll()} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The API runs periodic background recovery when healthy. After large Redis/processor outages, use{" "}
              <strong>Preview recovery</strong> then <strong>Run recovery</strong> until recoverable count reaches zero.
              Ensure Redis and the video processor are up before applying.
            </AlertDescription>
          </Alert>

          {(error || statsError) && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading pipeline data</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{error ?? statsError}</p>
                <Button variant="outline" size="sm" onClick={() => void refreshAll()} className="mt-2">
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          <VideoPipelineStatsCards stats={displayStats} loading={statsLoading} />

          <p className="text-xs text-muted-foreground">
            Summary counts are platform-wide and not limited to the table filter below.
          </p>

          {/* Action bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recovery actions</CardTitle>
              <CardDescription>
                Primary workflow: preview, confirm, then repeat until recoverable is zero
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!!actionLoading}
                onClick={() => void handlePreviewRecovery()}
              >
                {actionLoading === "preview-recover" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Preview recovery
              </Button>
              <Button
                disabled={!!actionLoading}
                onClick={() => setConfirmRecoverOpen(true)}
              >
                {actionLoading === "run-recover" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Run recovery
              </Button>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Advanced
                    <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="w-full pt-4 space-y-3">
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-sm font-medium">Reconcile from CDN</p>
                    <p className="text-xs text-muted-foreground">
                      When HLS exists on CDN but DB is stale (pending/processing/failed).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!actionLoading}
                        onClick={() => void handleReconcile(false)}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        disabled={!!actionLoading}
                        onClick={() => void handleReconcile(true)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-sm font-medium">Requeue stuck jobs</p>
                    <p className="text-xs text-muted-foreground">
                      Re-enqueue BullMQ jobs for posts with source video.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!actionLoading}
                        onClick={() => void handleRequeue(false)}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        disabled={!!actionLoading}
                        onClick={() => void handleRequeue(true)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-3 space-y-2 border-amber-200/60">
                    <p className="text-sm font-medium">Fail stale uploads</p>
                    <p className="text-xs text-muted-foreground">
                      Cleanup only — marks old uploading rows with no source file as failed. Does not recover content.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!actionLoading}
                        onClick={() => void handleFailStale(false)}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!!actionLoading}
                        onClick={() => void handleFailStale(true)}
                      >
                        Apply cleanup
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Filter tabs + table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Pipeline queue
                  </CardTitle>
                  <CardDescription>
                    {total} post(s) matching filter · includes failed after outages
                  </CardDescription>
                </div>
                <Tabs
                  value={statusTab}
                  onValueChange={(v) => setStatusTab(v as StatusTab)}
                >
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="processing">Processing</TabsTrigger>
                    <TabsTrigger value="uploading">Uploading</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading queue...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">
                    {statusTab === "all"
                      ? "No posts in pipeline"
                      : `No ${statusTab} posts in pipeline`}
                  </p>
                  <p className="text-sm">
                    {statusTab === "all"
                      ? "The pipeline is clear."
                      : "Try another filter or refresh after recovery."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recoverable</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[90px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/content/${post.id}`}
                              className="font-medium hover:underline truncate max-w-[180px] block"
                            >
                              {post.title || "Untitled"}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {post.id}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <VideoProcessingStatusBadge status={post.processing_status} />
                            {post.processing_error ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-destructive mt-1 truncate cursor-help">
                                    {post.processing_error}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  {post.processing_error}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {post.recoverable ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {post.has_source_video ? (
                              <Badge variant="outline" className="text-green-700">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2 min-w-[120px]">
                              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium">
                                  @{post.user?.username ?? "—"}
                                </p>
                                {post.user?.display_name ? (
                                  <p className="text-xs text-muted-foreground">
                                    {post.user.display_name}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[160px]">
                            {post.user ? (
                              <AdminUserContactLines user={post.user} />
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {post.createdAt || post.uploadDate
                              ? new Date(post.createdAt || post.uploadDate!).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/content/${post.id}`} target="_blank" rel="noopener">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={confirmRecoverOpen} onOpenChange={setConfirmRecoverOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run video recovery?</DialogTitle>
              <DialogDescription>
                This runs CDN reconcile and bulk requeue (limit 100 per phase). Redis and the video processor must be
                healthy. Continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmRecoverOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleRunRecovery()} disabled={!!actionLoading}>
                Run recovery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <VideoPipelineRecoveryDialog
          open={recoveryDialogOpen}
          onOpenChange={setRecoveryDialogOpen}
          result={recoveryResult}
          title={recoveryDialogTitle}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
