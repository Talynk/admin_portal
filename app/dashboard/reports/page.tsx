"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Download, Calendar, Users, Video, AlertTriangle, CheckCircle, Clock, BarChart3, Search, Loader2, MessageSquare } from "lucide-react"
import { useReports } from "@/hooks/use-reports"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import type { ContentReport } from "@/hooks/use-reports"

// Mock reports data
const mockReports = {
  scheduled: [
    {
      id: "R001",
      name: "Weekly User Activity Report",
      description: "Comprehensive user engagement and activity metrics",
      frequency: "weekly",
      nextRun: "2024-03-17T09:00:00Z",
      lastRun: "2024-03-10T09:00:00Z",
      status: "active",
      recipients: ["admin@talentix.com", "analytics@talentix.com"],
    },
    {
      id: "R002",
      name: "Monthly Content Moderation Summary",
      description: "Content approval, rejection, and moderation statistics",
      frequency: "monthly",
      nextRun: "2024-04-01T08:00:00Z",
      lastRun: "2024-03-01T08:00:00Z",
      status: "active",
      recipients: ["moderation@talentix.com"],
    },
    {
      id: "R003",
      name: "Daily Security Alert Digest",
      description: "Security incidents, failed logins, and threat analysis",
      frequency: "daily",
      nextRun: "2024-03-17T06:00:00Z",
      lastRun: "2024-03-16T06:00:00Z",
      status: "paused",
      recipients: ["security@talentix.com", "admin@talentix.com"],
    },
  ],
  generated: [
    {
      id: "GR001",
      name: "User Growth Analysis - March 2024",
      type: "user_analytics",
      generatedAt: "2024-03-15T14:30:00Z",
      size: "2.4 MB",
      format: "PDF",
      downloadUrl: "/reports/user-growth-march-2024.pdf",
    },
    {
      id: "GR002",
      name: "Content Performance Report - Q1 2024",
      type: "content_analytics",
      generatedAt: "2024-03-14T10:15:00Z",
      size: "5.1 MB",
      format: "Excel",
      downloadUrl: "/reports/content-performance-q1-2024.xlsx",
    },
    {
      id: "GR003",
      name: "Moderation Activity Summary - Week 11",
      type: "moderation_summary",
      generatedAt: "2024-03-13T16:45:00Z",
      size: "1.8 MB",
      format: "PDF",
      downloadUrl: "/reports/moderation-week-11-2024.pdf",
    },
    {
      id: "GR004",
      name: "Platform Health Check - March 2024",
      type: "system_health",
      generatedAt: "2024-03-12T08:00:00Z",
      size: "3.2 MB",
      format: "PDF",
      downloadUrl: "/reports/platform-health-march-2024.pdf",
    },
  ],
}

const REPORT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
]

export default function ReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState("all")
  const [timeRange, setTimeRange] = useState("30d")
  const [searchTerm, setSearchTerm] = useState("")
  const [contentReportsPage, setContentReportsPage] = useState(1)
  const [contentReportStatus, setContentReportStatus] = useState("")
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null)
  const [reviewStatus, setReviewStatus] = useState<"reviewed" | "resolved" | "dismissed">("reviewed")
  const [adminNotes, setAdminNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { reports: contentReports, pagination: contentPagination, loading: contentReportsLoading, error: contentReportsError, refetch: refetchContentReports } = useReports({
    page: contentReportsPage,
    limit: 20,
    status: contentReportStatus || undefined,
  })

  const filteredScheduled = useMemo(() => {
    if (!searchTerm.trim()) return mockReports.scheduled
    const q = searchTerm.toLowerCase()
    return mockReports.scheduled.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.frequency ?? "").toLowerCase().includes(q)
    )
  }, [searchTerm])

  const filteredGenerated = useMemo(() => {
    if (!searchTerm.trim()) return mockReports.generated
    const q = searchTerm.toLowerCase()
    return mockReports.generated.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.type ?? "").toLowerCase().includes(q)
    )
  }, [searchTerm])

  const generateReport = (type: string) => {
    console.log(`[v0] Generating ${type} report...`)
    // In a real app, this would trigger report generation
  }

  const downloadReport = (report: any) => {
    console.log(`[v0] Downloading report: ${report.name}`)
    // In a real app, this would download the actual file
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "user_analytics":
        return <Users className="h-4 w-4 text-blue-500" />
      case "content_analytics":
        return <Video className="h-4 w-4 text-purple-500" />
      case "moderation_summary":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "system_health":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Paused</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const openReview = (report: ContentReport) => {
    setSelectedReport(report)
    setReviewStatus("reviewed")
    setAdminNotes("")
    setReviewDialogOpen(true)
  }

  const closeReview = () => {
    setReviewDialogOpen(false)
    setSelectedReport(null)
    setAdminNotes("")
  }

  const handleReviewSubmit = async () => {
    if (!selectedReport) return
    setSubmitting(true)
    try {
      const res = await apiClient.reviewReport(selectedReport.id, {
        status: reviewStatus,
        adminNotes: adminNotes.trim() || undefined,
      })
      if (res.success) {
        toast({
          title: "Report reviewed",
          description: reviewStatus === "resolved" ? "Post will be unfrozen and set to active; reporter and post owner will be notified." : "Reporter and post owner will be notified.",
        })
        closeReview()
        refetchContentReports()
      } else {
        const err = (res as { error?: string }).error
        if (err && err.includes("404") || err?.toLowerCase().includes("not found")) {
          const fallback = await apiClient.updateReportStatus(selectedReport.id, reviewStatus, adminNotes.trim() || undefined)
          if (fallback.success) {
            toast({ title: "Report updated", description: "Status and notes saved." })
            closeReview()
            refetchContentReports()
          } else {
            toast({ title: "Error", description: (fallback as { error?: string }).error ?? "Failed to update report", variant: "destructive" })
          }
        } else {
          toast({ title: "Error", description: err ?? "Failed to review report", variant: "destructive" })
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to review report", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case "reviewed":
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "dismissed":
        return <Badge variant="secondary">Dismissed</Badge>
      default:
        return <Badge variant="outline">{status ?? "Pending"}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate and manage platform reports</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Report Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Create custom reports for specific metrics and time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => generateReport("user_analytics")}
                >
                  <Users className="h-6 w-6 text-blue-500" />
                  <span>User Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => generateReport("content_analytics")}
                >
                  <Video className="h-6 w-6 text-purple-500" />
                  <span>Content Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => generateReport("moderation_summary")}
                >
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                  <span>Moderation Summary</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 bg-transparent"
                  onClick={() => generateReport("system_health")}
                >
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span>System Health</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList>
              <TabsTrigger value="content">Content Reports</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
              <TabsTrigger value="generated">Generated Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Content report queue
                  </CardTitle>
                  <CardDescription>
                    Review user reports on posts. Resolved: post is unfrozen and set to active; reporter and post owner are notified. Dismissed: reporter and owner get notifications; post unchanged.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <Label>Status</Label>
                    <Select value={contentReportStatus || "all"} onValueChange={(v) => { setContentReportStatus(v === "all" ? "" : v); setContentReportsPage(1); }}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value || "all"} value={opt.value || "all"}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {contentReportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : contentReportsError ? (
                    <p className="text-destructive text-center py-8">{contentReportsError}</p>
                  ) : !contentReports.length ? (
                    <p className="text-muted-foreground text-center py-8">No content reports found.</p>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Post</TableHead>
                              <TableHead>Reporter</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contentReports.map((r) => (
                              <TableRow
                                key={r.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => openReview(r)}
                              >
                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                  {r.createdAt || r.created_at ? formatDate(String(r.createdAt ?? r.created_at)) : "—"}
                                </TableCell>
                                <TableCell>
                                  {(r.postId ?? r.post_id ?? r.post?.id) && (
                                    <Link href={`/dashboard/content/${r.postId ?? r.post_id ?? r.post?.id}`} className="text-primary hover:underline font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                                      {r.postId ?? r.post_id ?? r.post?.id}
                                    </Link>
                                  )}
                                  {!(r.postId ?? r.post_id ?? r.post?.id) && "—"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {r.reporter?.username ? `@${r.reporter.username}` : r.reporter?.email ?? "—"}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-sm" title={String(r.reason ?? r.description ?? "")}>
                                  {String(r.reason ?? r.description ?? "—")}
                                </TableCell>
                                <TableCell>{getReportStatusBadge(String(r.status ?? "pending"))}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openReview(r); }}>Review</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {contentPagination && (contentPagination.totalPages ?? 1) > 1 && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Page {contentPagination.page} of {contentPagination.totalPages} ({contentPagination.total} total)
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={contentReportsPage <= 1} onClick={() => setContentReportsPage((p) => Math.max(1, p - 1))}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={contentReportsPage >= (contentPagination.totalPages ?? 1)} onClick={() => setContentReportsPage((p) => p + 1)}>Next</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>Automated reports that run on a regular schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredScheduled.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">{report.name}</h3>
                            {getStatusBadge(report.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {report.frequency}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Next: {formatDate(report.nextRun)}
                            </span>
                            <span>Recipients: {report.recipients.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Run Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="generated" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Reports</CardTitle>
                  <CardDescription>Previously generated reports available for download</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredGenerated.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {getReportTypeIcon(report.type)}
                          <div>
                            <h3 className="font-semibold">{report.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Generated: {formatDate(report.generatedAt)}</span>
                              <span>Size: {report.size}</span>
                              <Badge variant="outline">{report.format}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Report Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockReports.scheduled.filter((r) => r.status === "active").length}
                </div>
                <p className="text-xs text-muted-foreground">Automated reports</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockReports.generated.length}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">+23% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.7 GB</div>
                <p className="text-xs text-muted-foreground">Report archives</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={reviewDialogOpen} onOpenChange={(open) => !open && closeReview()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review report</DialogTitle>
              <DialogDescription>
                Resolved: post will be unfrozen and set to active; reporter and post owner will be notified. Dismissed: reporter and owner get appropriate notifications; post unchanged.
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 py-2">
                <div>
                  <Label>Outcome</Label>
                  <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v as "reviewed" | "resolved" | "dismissed")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved (unfreeze post)</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="report-admin-notes">Admin notes (included in notification to reporter)</Label>
                  <Textarea id="report-admin-notes" placeholder="Optional note for the reporter and post owner" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mt-1 min-h-[80px]" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeReview} disabled={submitting}>Cancel</Button>
              <Button onClick={handleReviewSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
