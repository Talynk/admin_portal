import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { AdminSearchParams, AdminSearchResponse, AdminSearchUser, AdminSearchPost } from '@/lib/types/admin'

interface UseAdminSearchParams {
  q: string
  type?: 'all' | 'users' | 'posts'
  page?: number
  limit?: number
  status?: string
  dateFrom?: string
  dateTo?: string
  hasReports?: string
  suspended?: string
}

export function useAdminSearch(params: UseAdminSearchParams) {
  const [users, setUsers] = useState<AdminSearchUser[]>([])
  const [posts, setPosts] = useState<AdminSearchPost[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [postTotal, setPostTotal] = useState(0)
  const [pagination, setPagination] = useState<AdminSearchResponse['pagination']>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async () => {
    if (!params.q?.trim()) {
      setUsers([])
      setPosts([])
      setUserTotal(0)
      setPostTotal(0)
      setPagination(null)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.adminSearch({
        q: params.q,
        type: params.type ?? 'all',
        page: params.page,
        limit: params.limit,
        status: params.status,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        hasReports: params.hasReports,
        suspended: params.suspended,
      })
      if (response.success && response.data) {
        const data = response.data as AdminSearchResponse
        setUsers(data.users ?? [])
        setPosts(data.posts ?? [])
        setUserTotal(data.userTotal ?? 0)
        setPostTotal(data.postTotal ?? 0)
        setPagination(data.pagination ?? null)
      } else {
        setError(response.error ?? 'Search failed')
        setUsers([])
        setPosts([])
        setUserTotal(0)
        setPostTotal(0)
        setPagination(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUsers([])
      setPosts([])
      setUserTotal(0)
      setPostTotal(0)
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [
    params.q,
    params.type,
    params.page,
    params.limit,
    params.status,
    params.dateFrom,
    params.dateTo,
    params.hasReports,
    params.suspended,
  ])

  return {
    users,
    posts,
    userTotal,
    postTotal,
    pagination,
    loading,
    error,
    search,
  }
}
