\"use client\"

import { useMemo, useState } from \"react\"
import { ProtectedRoute } from \"@/components/protected-route\"
import { DashboardLayout } from \"@/components/dashboard-layout\"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \"@/components/ui/card\"
import { Button } from \"@/components/ui/button\"
import { Input } from \"@/components/ui/input\"
import { Badge } from \"@/components/ui/badge\"
import { Avatar, AvatarFallback } from \"@/components/ui/avatar\"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from \"@/components/ui/table\"
import {
  Search,
  Download,
  Activity,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from \"lucide-react\"
import { useActivityLogs } from \"@/hooks/use-activity-logs\"

type UiSeverity = \"high\" | \"medium\" | \"low\"

export default function ActivityPage() {
  const { logs, loading, error, refetch } = useActivityLogs({ page: 1, limit: 100 })
  const [searchTerm, setSearchTerm] = useState(\"\")
  const [actionFilter, setActionFilter] = useState(\"all\")
  const [severityFilter, setSeverityFilter] = useState(\"all\")
  const [userFilter, setUserFilter] = useState(\"all\")

  const deriveSeverity = (statusCode?: number, success?: boolean): UiSeverity => {
    if (statusCode && statusCode >= 500) return \"high\"
    if (success === false || (statusCode && statusCode >= 400)) return \"medium\"
    return \"low\"
  }

  const normalizedLogs = useMemo(() => {
    return (logs || []).map((log: any) => {
      const details = log.details || {}
      const statusCode = details.status_code as number | undefined
      const success = details.success as boolean | undefined
      const user = log.userName || details.user?.email || details.user?.username || \"system\"

      return {
        id: log.id,
        timestamp: details.created_at || log.timestamp,
        user,
        action: log.action || details.action_type || \"activity\",
        target: details.route || \"—\",
        targetId: details.trace_id || details.user_id || \"—\",
        details,
        ipAddress: details.ip || \"—\",
        severity: deriveSeverity(statusCode, success),
      }
    })
  }, [logs])

  const filteredLogs = normalizedLogs.filter((log) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      log.user.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term) ||
      String(log.details?.error_message || \"\").toLowerCase().includes(term) ||
      log.id.toLowerCase().includes(term)

    const matchesAction = actionFilter === \"all\" || log.action.toLowerCase().includes(actionFilter.toLowerCase())
    const matchesSeverity = severityFilter === \"all\" || log.severity === severityFilter
    const matchesUser = userFilter === \"all\" || log.user === userFilter

    return matchesSearch && matchesAction && matchesSeverity && matchesUser
  })

  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase()
    if (lower.includes(\"user\")) return <User className=\"h-4 w-4\" />
    if (lower.includes(\"approved\")) return <CheckCircle className=\"h-4 w-4 text-green-500\" />
    if (lower.includes(\"rejected\") || lower.includes(\"suspended\") || lower.includes(\"error\"))
      return <XCircle className=\"h-4 w-4 text-red-500\" />
    if (lower.includes(\"flag\") || lower.includes(\"warn\")) return <AlertTriangle className=\"h-4 w-4 text-orange-500\" />
    return <Activity className=\"h-4 w-4\" />
  }

  const getSeverityBadge = (severity: UiSeverity) => {
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

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return \"—\"
    return new Date(timestamp).toLocaleString()
  }

  const exportLogs = () => {
    const csvContent = [
      ["ID", "Timestamp", "User", "Action", "Target", "Details", "Severity", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.id,
          log.timestamp,
          log.user,
          log.action,
          log.target,
          `\"${String(log.details?.error_message || \"\").replace(/\"/g, '\"')}\"`,
          log.severity,
          log.ipAddress,
        ].join(
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

  const uniqueUsers = [...new Set(normalizedLogs.map((log) => log.user))]
  const uniqueActions = [...new Set(normalizedLogs.map((log) => (log.action || '').split(\"_\")[0]))]

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
                <div className="text-2xl font-bold">{normalizedLogs.length}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{normalizedLogs.filter((l) => l.severity === "high").length}</div>
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
                <div className="text-2xl font-bold">
                  {normalizedLogs.filter((l) => l.action.toLowerCase().includes("content")).length}
                </div>
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
                      <TableHead>Route</TableHead>
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
                        <TableCell className="text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{log.target}</span>
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

              {filteredLogs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity logs found matching your criteria.</p>
                </div>
              )}
              {loading && (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading activity logs...</div>
              )}
              {error && (
                <div className="text-center py-4 text-sm text-red-600 flex flex-col gap-2 items-center">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
