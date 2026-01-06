"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Download,
  Activity,
  User,
  Video,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"

// Mock activity logs data
const mockActivityLogs = [
  {
    id: "AL001",
    timestamp: "2024-03-16T14:30:00Z",
    user: "admin@talentix.com",
    action: "user_suspended",
    target: "@suspicious_user",
    targetId: "U999",
    targetType: "user",
    details: "User suspended for violating community guidelines",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: "high",
  },
  {
    id: "AL002",
    timestamp: "2024-03-16T14:15:00Z",
    user: "moderator@talentix.com",
    action: "content_approved",
    target: "Dance Tutorial",
    targetId: "V001",
    targetType: "video",
    details: "Video approved after manual review",
    ipAddress: "10.0.0.50",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    severity: "low",
  },
  {
    id: "AL003",
    timestamp: "2024-03-16T13:45:00Z",
    user: "admin@talentix.com",
    action: "settings_changed",
    target: "Platform Settings",
    targetId: "SETTINGS",
    targetType: "system",
    details: "Updated maximum video length from 180s to 300s",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: "medium",
  },
  {
    id: "AL004",
    timestamp: "2024-03-16T13:20:00Z",
    user: "approver@talentix.com",
    action: "content_rejected",
    target: "Inappropriate Content",
    targetId: "V456",
    targetType: "video",
    details: "Video rejected for violating content policy",
    ipAddress: "172.16.0.25",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    severity: "medium",
  },
  {
    id: "AL005",
    timestamp: "2024-03-16T12:55:00Z",
    user: "admin@talentix.com",
    action: "user_created",
    target: "@new_creator",
    targetId: "U1001",
    targetType: "user",
    details: "New user account created with creator privileges",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: "low",
  },
  {
    id: "AL006",
    timestamp: "2024-03-16T12:30:00Z",
    user: "system",
    action: "backup_completed",
    target: "Database Backup",
    targetId: "BACKUP_001",
    targetType: "system",
    details: "Automated daily database backup completed successfully",
    ipAddress: "127.0.0.1",
    userAgent: "System/1.0",
    severity: "low",
  },
  {
    id: "AL007",
    timestamp: "2024-03-16T11:45:00Z",
    user: "moderator@talentix.com",
    action: "content_flagged",
    target: "Spam Video",
    targetId: "V789",
    targetType: "video",
    details: "Content flagged for spam and promotional content",
    ipAddress: "10.0.0.50",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    severity: "high",
  },
]

export default function ActivityPage() {
  const [logs, setLogs] = useState(mockActivityLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("24h")

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter)
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter
    const matchesUser = userFilter === "all" || log.user === userFilter

    return matchesSearch && matchesAction && matchesSeverity && matchesUser
  })

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="h-4 w-4" />
    if (action.includes("content")) return <Video className="h-4 w-4" />
    if (action.includes("settings")) return <Settings className="h-4 w-4" />
    if (action.includes("approved")) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (action.includes("rejected") || action.includes("suspended")) return <XCircle className="h-4 w-4 text-red-500" />
    if (action.includes("flagged")) return <AlertTriangle className="h-4 w-4 text-orange-500" />
    return <Activity className="h-4 w-4" />
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const exportLogs = () => {
    const csvContent = [
      ["ID", "Timestamp", "User", "Action", "Target", "Details", "Severity", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [log.id, log.timestamp, log.user, log.action, log.target, `"${log.details}"`, log.severity, log.ipAddress].join(
          ",",
        ),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const uniqueUsers = [...new Set(logs.map((log) => log.user))]
  const uniqueActions = [...new Set(logs.map((log) => log.action.split("_")[0]))]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
              <p className="text-muted-foreground">Monitor and audit all platform activities</p>
            </div>
            <Button onClick={exportLogs} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.filter((l) => l.severity === "high").length}</div>
                <p className="text-xs text-muted-foreground">Critical actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueUsers.length}</div>
                <p className="text-xs text-muted-foreground">Performed actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Actions</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.filter((l) => l.action.includes("content")).length}</div>
                <p className="text-xs text-muted-foreground">Moderation activities</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Detailed log of all platform activities and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs by user, action, target, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="user">User Actions</SelectItem>
                    <SelectItem value="content">Content Actions</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full lg:w-[130px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {log.user === "system" ? "SYS" : log.user.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{log.user}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm font-medium">
                              {log.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{log.target}</p>
                            <p className="text-xs text-muted-foreground">ID: {log.targetId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-xs truncate" title={log.details}>
                            {log.details}
                          </p>
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">{log.ipAddress}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity logs found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
