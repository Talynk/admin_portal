'use client'

import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAdminNotifications } from '@/components/admin-notifications-provider'
import { Bell, CheckCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminNotification } from '@/lib/types/admin'

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function NotificationsDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    recentNotifications,
    listLoading,
    markAsRead,
    markAllAsRead,
  } = useAdminNotifications()

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className={cn(
          'flex h-full w-full flex-col border-l p-0 sm:max-w-md',
          'inset-y-0 right-0 h-full'
        )}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          {listLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading…
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Bell className="h-12 w-12 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y">
              {recentNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={() => markAsRead(n.id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
        <SheetFooter className="flex-row gap-2 border-t px-4 py-3 sm:flex-row">
          {recentNotifications.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mr-auto"
              onClick={() => markAllAsRead()}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard/notifications" onClick={() => setDrawerOpen(false)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View all notifications
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AdminNotification
  onMarkRead: () => void
}) {
  const isUnread = !notification.readAt
  return (
    <li
      className={cn(
        'px-4 py-3 transition-colors',
        isUnread && 'bg-muted/50'
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium', isUnread && 'font-semibold')}>
            {notification.title}
          </p>
          {isUnread && (
            <button
              type="button"
              onClick={onMarkRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark read
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatNotificationTime(notification.createdAt)}
          </span>
          {notification.actionUrl && (
            <Link
              href={notification.actionUrl}
              className="text-xs text-primary hover:underline"
              onClick={() => {}}
            >
              View
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
