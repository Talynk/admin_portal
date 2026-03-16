import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface SupportIssueUser {
  id?: string
  username?: string
  email?: string
  display_name?: string
  [key: string]: unknown
}

export interface SupportIssue {
  id: string
  user_id?: string | null
  email: string
  subject: string
  message: string
  category?: string | null
  status: string
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
  user?: SupportIssueUser | null
  [key: string]: unknown
}

export interface SupportIssuesPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext?: boolean
  hasPrev?: boolean
}

export interface UseSupportIssuesParams {
  page?: number
  limit?: number
  status?: string
  category?: string
  email?: string
  q?: string
}

export function useSupportIssues(params: UseSupportIssuesParams = {}) {
  const [issues, setIssues] = useState<SupportIssue[]>([])
  const [pagination, setPagination] = useState<SupportIssuesPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getSupportIssues({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
        category: params.category,
        email: params.email,
        q: params.q,
      })
      if (res.success && res.data) {
        const data = res.data as {
          issues?: SupportIssue[]
          pagination?: {
            page?: number
            limit?: number
            total?: number
            totalPages?: number
            hasNext?: boolean
            hasPrev?: boolean
          }
        }
        const list = Array.isArray(data.issues) ? data.issues : []
        setIssues(list)
        const pag = data.pagination
        if (pag) {
          setPagination({
            page: pag.page ?? (params.page ?? 1),
            limit: pag.limit ?? (params.limit ?? 20),
            total: pag.total ?? 0,
            totalPages: pag.totalPages ?? 1,
            hasNext: pag.hasNext,
            hasPrev: pag.hasPrev,
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
        setIssues([])
        setPagination(null)
        setError((res as { error?: string }).error ?? 'Failed to load support issues')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load support issues')
      setIssues([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [
    params.page,
    params.limit,
    params.status,
    params.category,
    params.email,
    params.q,
  ])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  return {
    issues,
    pagination,
    loading,
    error,
    refetch: fetchIssues,
  }
}
