"use client"

import { useState } from "react"
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
  Info,
  Flag,
  Users,
  Video,
  Shield,
  Clock,
  KanbanSquareDashed as MarkAsUnread,
} from "lucide-react"

// Mock notifications data
const mockNotifications = [
  {
    id: "N001",
    type: "moderation",
    title: "Content flagged for review",
    message: "Video 'Dance Tutorial' by @dancer_pro has been flagged by multiple users",
    timestamp: "2024-03-16T10:30:00Z",
    read: false,
    priority: "high",
    actionRequired: true,
    relatedId: "V001",
    relatedType: "video",
  },
  {
    id: "N002",
    type: "system",
    title: "System maintenance completed",
    message: "Scheduled maintenance has been completed successfully. All systems are operational.",
    timestamp: "2024-03-16T09:15:00Z",
    read: true,
    priority: "medium",
    actionRequired: false,
    relatedId: null,
    relatedType: null,
  },
  {
    id: "N003",
    type: "user",
    title: "New user registration spike",
    message: "User registrations increased by 45% in the last 24 hours",
    timestamp: "2024-03-16T08:45:00Z",
    read: false,
    priority: "low",
    actionRequired: false,
    relatedId: null,
    relatedType: null,
  },
  {
    id: "N004",
    type: "security",
    title: "Multiple failed login attempts",
    message: "User @suspicious_user has 5 failed login attempts from IP 192.168.1.100",
    timestamp: "2024-03-16T07:20:00Z",
    read: false,
    priority: "high",
    actionRequired: true,
    relatedId: "U999",
    relatedType: "user",
  },
  {
    id: "N005",
    type: "content",
    title: "Viral content detected",
    message: "Video 'Funny Cat Compilation' is trending with 100K+ views in 2 hours",
    timestamp: "2024-03-15T22:10:00Z",
    read: true,
    priority: "medium",
    actionRequired: false,
    relatedId: "V123",
    relatedType: "video",
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const filteredNotifications = notifications
    .filter((notification) => {
      if (filter === "all") return true
      if (filter === "unread") return !notification.read
      if (filter === "action-required") return notification.actionRequired
      return notification.type === filter
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
      if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return (
          priorityOrder[b.priority as keyof typeof priorityOrder] -
          priorityOrder[a.priority as keyof typeof priorityOrder]
        )
      }
      return 0
    })

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "moderation":
        return <Flag className="h-4 w-4 text-orange-500" />
      case "system":
        return <Info className="h-4 w-4 text-blue-500" />
      case "user":
        return <Users className="h-4 w-4 text-green-500" />
      case "security":
        return <Shield className="h-4 w-4 text-red-500" />
      case "content":
        return <Video className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const actionRequiredCount = notifications.filter((n) => n.actionRequired && !n.read).length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                System alerts and important updates
                {unreadCount > 0 && <Badge className="ml-2 bg-red-100 text-red-800">{unreadCount} unread</Badge>}
              </p>
            </div>
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <MarkAsUnread className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadCount}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Action Required</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{actionRequiredCount}</div>
                <p className="text-xs text-muted-foreground">Need immediate action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notifications.filter((n) => n.priority === "high" && !n.read).length}
                </div>
                <p className="text-xs text-muted-foreground">Critical alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Stay updated with platform activities and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter notifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="action-required">Action Required</SelectItem>
                    <SelectItem value="moderation">Moderation</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="user">User Activity</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                      !notification.read ? "bg-blue-50 border-blue-200 hover:bg-blue-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(notification.timestamp)}
                            {notification.relatedId && (
                              <>
                                <span>•</span>
                                <span>ID: {notification.relatedId}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getPriorityBadge(notification.priority)}
                          {notification.actionRequired && (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Action Required</Badge>
                          )}
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs"
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
