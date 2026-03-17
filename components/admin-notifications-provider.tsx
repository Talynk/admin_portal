'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useAdminNotificationsSocket } from '@/hooks/use-admin-notifications-socket'
import { disconnectAdminNotificationsSocket } from '@/lib/admin-notifications-socket'
import { toDashboardActionUrl } from '@/lib/notification-action-url'
import type { AdminNotification, AdminNotificationSocketPayload } from '@/lib/types/admin'

export const ADMIN_NOTIFICATIONS_REFRESH_EVENT = 'admin-notifications-refresh'

interface AdminNotificationsContextValue {
  isProvided: boolean
  unreadCount: number
  recentNotifications: AdminNotification[]
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  statsLoading: boolean
  listLoading: boolean
  refreshStats: () => Promise<void>
  refreshList: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const defaultContextValue: AdminNotificationsContextValue = {
  isProvided: false,
  unreadCount: 0,
  recentNotifications: [],
  drawerOpen: false,
  setDrawerOpen: () => {},
  statsLoading: false,
  listLoading: false,
  refreshStats: async () => {},
  refreshList: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
}

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null)

export function useAdminNotifications(): AdminNotificationsContextValue {
  const ctx = useContext(AdminNotificationsContext)
  return ctx ?? defaultContextValue
}

function parseListResponse(res: unknown): { items: AdminNotification[]; total: number; page: number; limit: number } {
  const raw = res && typeof res === 'object' && 'data' in res ? (res as { data: unknown }).data : res
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const items = Array.isArray(obj.items) ? (obj.items as AdminNotification[]) : []
  return {
    items,
    total: typeof obj.total === 'number' ? obj.total : 0,
    page: typeof obj.page === 'number' ? obj.page : 1,
    limit: typeof obj.limit === 'number' ? obj.limit : 20,
  }
}

function parseStatsResponse(res: unknown): { unread: number } {
  const raw = res && typeof res === 'object' && 'data' in res ? (res as { data: unknown }).data : res
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return { unread: typeof obj.unread === 'number' ? obj.unread : 0 }
}

function socketPayloadToNotification(p: AdminNotificationSocketPayload): AdminNotification {
  return {
    id: p.id,
    severity: p.severity,
    category: p.category,
    title: p.title,
    message: p.message,
    actionUrl: p.actionUrl,
    metadata: p.metadata,
    readAt: null,
    consolidatedCount: p.consolidatedCount,
    createdAt: p.createdAt,
  }
}

export function AdminNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<AdminNotification[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)

  const refreshStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await apiClient.getAdminNotificationStats()
      if (res.success && res.data != null) {
        const parsed = parseStatsResponse(res)
        setUnreadCount(parsed.unread)
      }
    } catch {
      // ignore
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const refreshList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await apiClient.getAdminNotifications({ limit: 15, page: 1 })
      if (res.success && res.data != null) {
        const { items } = parseListResponse(res)
        setRecentNotifications(items)
      }
    } catch {
      // ignore
    } finally {
      setListLoading(false)
    }
  }, [])

  const markAsRead = useCallback(
    async (id: string) => {
      const res = await apiClient.markAdminNotificationRead(id)
      if (res.success) {
        setRecentNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        )
        await refreshStats()
      }
    },
    [refreshStats]
  )

  const markAllAsRead = useCallback(async () => {
    const res = await apiClient.markAllAdminNotificationsRead()
    if (res.success) {
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
      await refreshStats()
    }
  }, [refreshStats])

  const handleSocketNotification = useCallback(
    (payload: AdminNotificationSocketPayload) => {
      const dashboardHref = toDashboardActionUrl(payload.actionUrl) ?? (payload.actionUrl?.startsWith('/dashboard/') ? payload.actionUrl : null)
      toast({
        title: payload.title,
        description: payload.message,
        variant:
          payload.severity === 'critical' || payload.severity === 'action_required' ? 'destructive' : undefined,
        action: dashboardHref ? (
          <ToastAction asChild>
            <Link href={dashboardHref}>View</Link>
          </ToastAction>
        ) : undefined,
      })
      setRecentNotifications((prev) => [socketPayloadToNotification(payload), ...prev.slice(0, 14)])
      refreshStats()
    },
    [refreshStats]
  )

  const enabled =
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false' &&
    !!localStorage.getItem('talentix_admin_token')

  useAdminNotificationsSocket({
    onNotification: handleSocketNotification,
    enabled,
  })

  useEffect(() => {
    if (!enabled) return
    refreshStats()
  }, [enabled, refreshStats])

  useEffect(() => {
    if (drawerOpen) {
      refreshList()
    }
  }, [drawerOpen, refreshList])

  useEffect(() => {
    return () => {
      disconnectAdminNotificationsSocket()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onRefresh = () => {
      refreshStats()
    }
    window.addEventListener(ADMIN_NOTIFICATIONS_REFRESH_EVENT, onRefresh)
    return () => window.removeEventListener(ADMIN_NOTIFICATIONS_REFRESH_EVENT, onRefresh)
  }, [refreshStats])

  const value: AdminNotificationsContextValue = {
    isProvided: true,
    unreadCount,
    recentNotifications,
    drawerOpen,
    setDrawerOpen,
    statsLoading,
    listLoading,
    refreshStats,
    refreshList,
    markAsRead,
    markAllAsRead,
  }

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  )
}
