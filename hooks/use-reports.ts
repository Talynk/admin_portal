import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface ContentReport {
  id: string
  postId?: string
  post_id?: string
  userId?: string
  user_id?: string
  reporterId?: string
  reporter_id?: string
  reason?: string
  description?: string
  status?: string
  createdAt?: string
  created_at?: string
  reporter?: { id: string; username?: string; email?: string }
  post?: { id: string; title?: string; status?: string }
  [key: string]: unknown
}

export interface ReportsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseReportsParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  startDate?: string
  endDate?: string
}

export function useReports(params: UseReportsParams = {}) {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [pagination, setPagination] = useState<ReportsPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getReports({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        type: params.type,
        status: params.status,
        startDate: params.startDate,
        endDate: params.endDate,
      })
      if (res.success && res.data) {
        const data = res.data as Record<string, unknown>
        const list = (Array.isArray(data.reports) ? data.reports : Array.isArray(data.data) ? data.data : []) as ContentReport[]
        setReports(list)
        const pag = data.pagination as Record<string, unknown> | undefined
        if (pag) {
          setPagination({
            page: (pag.page as number) ?? params.page ?? 1,
            limit: (pag.limit as number) ?? params.limit ?? 20,
            total: (pag.total as number) ?? (pag.totalCount as number) ?? list.length,
            totalPages: (pag.totalPages as number) ?? 1,
          })
        } else {
          setPagination({
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            total: list.length,
            totalPages: 1,
          })
        }
      } else {
        setReports([])
        setPagination(null)
        setError((res as { error?: string }).error ?? 'Failed to load reports')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports')
      setReports([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.type, params.status, params.startDate, params.endDate])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, pagination, loading, error, refetch: fetchReports }
}
