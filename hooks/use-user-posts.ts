import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { UserPostItem, UserPostsResponse, UserPostsStatusFilter, UserPostsSort, TimeFrame } from '@/lib/types/admin'

interface UseUserPostsParams {
  page?: number
  limit?: number
  status?: UserPostsStatusFilter
  sort?: UserPostsSort
  frame?: TimeFrame
}

export function useUserPosts(userId: string, params: UseUserPostsParams = {}) {
  const [posts, setPosts] = useState<UserPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const fetchPosts = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getUserPosts(userId, {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
        sort: params.sort ?? 'newest',
        frame: params.frame,
      })
      if (response.success && response.data) {
        const data = response.data as UserPostsResponse
        setPosts(data.posts ?? [])
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 })
      } else {
        setError(response.error ?? 'Failed to fetch user posts')
        setPosts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [userId, params.page, params.limit, params.status, params.sort, params.frame])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    pagination,
    loading,
    error,
    refetch: fetchPosts,
  }
}
