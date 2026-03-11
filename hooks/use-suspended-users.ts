import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SuspendedUserItem, SuspendedUsersResponse } from '@/lib/types/admin'

interface UseSuspendedUsersParams {
  page?: number
  limit?: number
  sort?: 'suspended_at_desc' | 'created_at_desc'
}

export function useSuspendedUsers(params: UseSuspendedUsersParams = {}) {
  const [users, setUsers] = useState<SuspendedUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const fetchSuspendedUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getSuspendedUsers({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        sort: params.sort ?? 'suspended_at_desc',
      })
      if (response.success && response.data) {
        const data = response.data as SuspendedUsersResponse
        setUsers(data.users ?? [])
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 })
      } else {
        setError(response.error ?? 'Failed to fetch suspended users')
        setUsers([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.sort])

  useEffect(() => {
    fetchSuspendedUsers()
  }, [fetchSuspendedUsers])

  return {
    users,
    pagination,
    loading,
    error,
    refetch: fetchSuspendedUsers,
  }
}
