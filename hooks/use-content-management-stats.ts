import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { ContentManagementStats } from '@/lib/types/admin'

function unwrapContentStats(data: unknown): ContentManagementStats | null {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as ContentManagementStats
  if (payload && typeof payload.totalContents === 'number') return payload
  return null
}

export function useContentManagementStats(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const [stats, setStats] = useState<ContentManagementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!enabled) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getContentManagementStats()
      if (response.success && response.data) {
        setStats(unwrapContentStats(response.data))
      } else {
        setError(response.error ?? 'Failed to fetch content stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
