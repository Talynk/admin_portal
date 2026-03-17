import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import type {
  SupportEmailListItem,
  SupportEmailListResponse,
  SupportEmailStats,
} from '@/lib/types/admin'

export interface UseSupportEmailsParams {
  page?: number
  limit?: number
  isRead?: boolean
  category?: string
  timeBucket?: string
}

export function useSupportEmails(params: UseSupportEmailsParams = {}) {
  const [emails, setEmails] = useState<SupportEmailListItem[]>([])
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [stats, setStats] = useState<SupportEmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getSupportEmails({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        isRead: params.isRead,
        category: params.category,
        timeBucket: params.timeBucket,
      })

      if (res.success && res.data) {
        const raw = res.data as unknown
        const data =
          raw && typeof raw === 'object' && 'items' in (raw as any)
            ? (raw as SupportEmailListResponse)
            : ((raw as any).data as SupportEmailListResponse | undefined) ?? { items: [], total: 0, page: 1, limit: params.limit ?? 20 }

        const items = Array.isArray(data.items) ? data.items : []
        setEmails(items)

        setPagination({
          page: typeof data.page === 'number' ? data.page : params.page ?? 1,
          limit: typeof data.limit === 'number' ? data.limit : params.limit ?? 20,
          total: typeof data.total === 'number' ? data.total : items.length,
          totalPages:
            typeof (data as any).totalPages === 'number'
              ? (data as any).totalPages
              : Math.max(1, Math.ceil((typeof data.total === 'number' ? data.total : items.length) / (params.limit ?? 20))),
        })
      } else {
        setEmails([])
        setPagination(null)
        setError((res as { error?: string }).error ?? 'Failed to load support emails')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load support emails')
      setEmails([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.isRead, params.category, params.timeBucket])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await apiClient.getSupportEmailStats(
        params.timeBucket ? { timeBucket: params.timeBucket as any } : undefined,
      )
      if (res.success && res.data) {
        const raw = res.data as any
        const container = raw?.data ?? raw
        const nextStats: SupportEmailStats = {
          total: container?.total ?? 0,
          unread: container?.unread ?? 0,
          byCategory: container?.byCategory ?? {},
        }
        setStats(nextStats)
      }
    } catch {
      // ignore stats errors
    } finally {
      setStatsLoading(false)
    }
  }, [params.timeBucket])

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const res = await apiClient.markSupportEmailAsRead(id)
        if (res.success) {
          setEmails((prev) =>
            prev.map((email) => (email.id === id ? { ...email, isRead: true } : email)),
          )
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  unread: Math.max(0, prev.unread - 1),
                }
              : prev,
          )
        }
      } catch {
        // leave error handling to caller if needed
      }
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await apiClient.markAllSupportEmailsAsRead()
      if (res.success) {
        setEmails((prev) => prev.map((email) => ({ ...email, isRead: true })))
        setStats((prev) =>
          prev
            ? {
                ...prev,
                unread: 0,
              }
            : prev,
        )
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    emails,
    pagination,
    stats,
    loading,
    statsLoading,
    error,
    refetchEmails: fetchEmails,
    refetchStats: fetchStats,
    markAsRead,
    markAllAsRead,
  }
}

