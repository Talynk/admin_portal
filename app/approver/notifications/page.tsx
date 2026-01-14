"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Flag,
  Clock,
  Loader2,
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  status: 'unread' | 'read'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export default function ApproverNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadNotifications()
  }, [page, filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getApproverNotifications({
        page,
        limit: 20,
        unreadOnly: filter === 'unread',
      })
      if (response.success && response.data) {
        setNotifications(response.data.notifications || [])
        setTotalPages(response.data.pagination?.totalPages || 1)
      } else {
        setError(response.error || 'Failed to load notifications')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.markApproverNotificationAsRead(notificationId)
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, status: 'read' as const } : n)
        )
      }
    } catch (err) {
      // Silent fail
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'moderation':
        return <Flag className="h-5 w-5 text-red-600" />
      case 'system':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'security':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread'
    if (filter === 'read') return n.status === 'read'
    return true
  })

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your review tasks and system alerts
              </p>
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error loading notifications</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-colors ${
                    notification.status === 'unread'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-medium ${notification.status === 'unread' ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h3>
                              {notification.status === 'unread' && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(notification.createdAt)}
                            </div>
                          </div>
                          {notification.status === 'unread' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="ml-4"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
