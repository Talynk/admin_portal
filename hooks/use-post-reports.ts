import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { PostReport } from '@/lib/types/admin'

export function usePostReports(postId: string) {
  const [reports, setReports] = useState<PostReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    if (!postId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getPostReports(postId)
      if (response.success && response.data) {
        const data = response.data as { reports?: PostReport[] } | PostReport[]
        const list = Array.isArray(data) ? data : (data as { reports?: PostReport[] }).reports ?? []
        setReports(list)
      } else {
        setError(response.error ?? 'Failed to fetch reports')
        setReports([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, loading, error, refetch: fetchReports }
}
