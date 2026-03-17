import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Appeal, AppealsResponse } from '@/lib/types/admin'

export interface UseAppealsParams {
  page?: number
  limit?: number
  status?: 'pending' | 'approved' | 'rejected'
}

export interface AppealsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext?: boolean
  hasPrev?: boolean
}

export function useAppeals(params: UseAppealsParams = {}) {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [pagination, setPagination] = useState<AppealsPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getAppeals({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
      })
      if (res.success && res.data) {
        const data = res.data as AppealsResponse | { appeals?: Appeal[]; data?: Appeal[]; pagination?: AppealsPagination }
        const list = Array.isArray(data.appeals) ? data.appeals : Array.isArray((data as { data?: Appeal[] }).data) ? (data as { data: Appeal[] }).data : []
        setAppeals(list)
        const pag = (data as AppealsResponse).pagination ?? (data as { pagination?: Record<string, unknown> }).pagination
        if (pag) {
          const p = pag as Record<string, unknown>
          setPagination({
            page: (p.page as number) ?? (p.currentPage as number) ?? params.page ?? 1,
            limit: (p.limit as number) ?? params.limit ?? 20,
            total: (p.total as number) ?? (p.totalCount as number) ?? list.length,
            totalPages: (p.totalPages as number) ?? 1,
            hasNext: p.hasNext as boolean | undefined,
            hasPrev: p.hasPrev as boolean | undefined,
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
        setAppeals([])
        setPagination(null)
        setError((res as { error?: string }).error ?? 'Failed to load appeals')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appeals')
      setAppeals([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.status])

  useEffect(() => {
    fetchAppeals()
  }, [fetchAppeals])

  return {
    appeals,
    pagination,
    loading,
    error,
    refetch: fetchAppeals,
  }
}
