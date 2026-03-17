"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Flag,
  Scale,
  LifeBuoy,
  Shield,
  Clock,
  Server,
  Video,
  KanbanSquareDashed as MarkAsUnread,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toDashboardActionUrl } from "@/lib/notification-action-url"
import {
  useAdminNotifications,
  ADMIN_NOTIFICATIONS_REFRESH_EVENT,
} from "@/components/admin-notifications-provider"
import type {
  AdminNotification,
  AdminNotificationCategory,
  AdminNotificationSeverity,
} from "@/lib/types/admin"

const SEVERITY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
  { value: "action_required", label: "Action required" },
]

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "appeal", label: "Appeal" },
  { value: "report", label: "Report" },
  { value: "support", label: "Support" },
  { value: "security", label: "Security" },
  { value: "queue", label: "Queue" },
  { value: "system", label: "System" },
]

const TIME_BUCKET_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "1h", label: "Last 1 hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
]

function parseListResponse(res: unknown): {
  items: AdminNotification[]
  total: number
  page: number
  limit: number
} {
  const raw = res && typeof res === "object" && "data" in res ? (res as { data: unknown }).data : res
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const items = Array.isArray(obj.items) ? (obj.items as AdminNotification[]) : []
  return {
    items,
    total: typeof obj.total === "number" ? obj.total : 0,
    page: typeof obj.page === "number" ? obj.page : 1,
    limit: typeof obj.limit === "number" ? obj.limit : 20,
  }
}

function parseStatsResponse(res: unknown): {
  total: number
  unread: number
  bySeverity: Record<string, number>
  byCategory: Record<string, number>
} {
  const raw = res && typeof res === "object" && "data" in res ? (res as { data: unknown }).data : res
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    total: typeof obj.total === "number" ? obj.total : 0,
    unread: typeof obj.unread === "number" ? obj.unread : 0,
    bySeverity: (obj.bySeverity as Record<string, number>) || {},
    byCategory: (obj.byCategory as Record<string, number>) || {},
  }
}

export default function NotificationsPage() {
  const {
    isProvided,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    refreshStats,
  } = useAdminNotifications()
  const [items, setItems] = useState<AdminNotification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, unread: 0, bySeverity: {} as Record<string, number>, byCategory: {} as Record<string, number> })
  const [statsLoading, setStatsLoading] = useState(true)
  const [severity, setSeverity] = useState("all")
  const [category, setCategory] = useState("all")
  const [timeBucket, setTimeBucket] = useState("all")
  const [unreadOnly, setUnreadOnly] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getAdminNotifications({
        page,
        limit,
        severity: severity === "all" ? undefined : severity,
        category: category === "all" ? undefined : category,
        timeBucket: timeBucket && timeBucket !== "all" ? timeBucket : undefined,
        unreadOnly: unreadOnly || undefined,
      })
      if (res.success && res.data != null) {
        const parsed = parseListResponse(res)
        setItems(parsed.items)
        setTotal(parsed.total)
      }
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, limit, severity, category, timeBucket, unreadOnly])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await apiClient.getAdminNotificationStats({
        timeBucket: timeBucket && timeBucket !== "all" ? timeBucket : undefined,
      })
      if (res.success && res.data != null) {
        setStats(parseStatsResponse(res))
      }
    } catch {
      // ignore
    } finally {
      setStatsLoading(false)
    }
  }, [timeBucket])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleMarkAsRead = async (id: string) => {
    if (isProvided) {
      await contextMarkAsRead(id)
    } else {
      await apiClient.markAdminNotificationRead(id)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ADMIN_NOTIFICATIONS_REFRESH_EVENT))
      }
    }
    await fetchList()
  }

  const handleMarkAllAsRead = async () => {
    if (isProvided) {
      await contextMarkAllAsRead()
      await refreshStats()
    } else {
      await apiClient.markAllAdminNotificationsRead()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ADMIN_NOTIFICATIONS_REFRESH_EVENT))
      }
    }
    await fetchList()
  }

  const getCategoryIcon = (cat: AdminNotificationCategory) => {
    switch (cat) {
      case "appeal":
        return <Scale className="h-4 w-4 text-amber-500" />
      case "report":
        return <Flag className="h-4 w-4 text-orange-500" />
      case "support":
        return <LifeBuoy className="h-4 w-4 text-blue-500" />
      case "security":
        return <Shield className="h-4 w-4 text-red-500" />
      case "queue":
        return <Video className="h-4 w-4 text-purple-500" />
      case "system":
        return <Server className="h-4 w-4 text-slate-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityBadge = (sev: AdminNotificationSeverity) => {
    switch (sev) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>
      case "action_required":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Action required</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>
      default:
        return <Badge variant="secondary">{sev}</Badge>
    }
  }

  const formatTimestamp = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const actionRequiredCount =
    (stats.bySeverity?.action_required ?? 0) + (stats.bySeverity?.critical ?? 0)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                System alerts and important updates
                {stats.unread > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {stats.unread} unread
                  </Badge>
                )}
              </p>
            </div>
            <Button onClick={handleMarkAllAsRead} variant="outline" disabled={stats.unread === 0}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? "—" : stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {timeBucket && timeBucket !== "all" ? `Last ${timeBucket}` : "All time"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <MarkAsUnread className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? "—" : stats.unread}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Action required</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? "—" : actionRequiredCount}</div>
                <p className="text-xs text-muted-foreground">Need immediate action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "—" : (stats.bySeverity?.critical ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Critical alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and list */}
          <Card>
            <CardHeader>
              <CardTitle>Recent notifications</CardTitle>
              <CardDescription>Filter by severity, category and time range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col flex-wrap gap-4 sm:flex-row">
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={timeBucket} onValueChange={setTimeBucket}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_BUCKET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={unreadOnly ? "unread" : "all"}
                  onValueChange={(v) => setUnreadOnly(v === "unread")}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Read status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex justify-center py-12 text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-4">
                  {items.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                        !notification.readAt
                          ? "bg-muted/50 border-muted-foreground/20"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        {getCategoryIcon(notification.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h3
                                className={`text-sm font-medium ${
                                  !notification.readAt ? "font-semibold" : ""
                                }`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.readAt && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                              {notification.consolidatedCount != null &&
                                notification.consolidatedCount > 1 && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({notification.consolidatedCount} consolidated)
                                  </span>
                                )}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(notification.createdAt)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {getSeverityBadge(notification.severity)}
                            {!notification.readAt && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs"
                              >
                                Mark read
                              </Button>
                            )}
                            {(() => {
                              const viewHref = toDashboardActionUrl(notification.actionUrl) ?? (notification.actionUrl?.startsWith("/dashboard/") ? notification.actionUrl : null)
                              return viewHref ? (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={viewHref}>View</Link>
                                </Button>
                              ) : null
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="py-8 text-center">
                  <Bell className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No notifications found matching your criteria.
                  </p>
                </div>
              )}

              {total > limit && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(total / limit)} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(total / limit)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
