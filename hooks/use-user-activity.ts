import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { UserActivityResponse, TimeFrame } from '@/lib/types/admin'

const DEFAULT_FRAME: TimeFrame = '24h'

export function useUserActivity(userId: string, frame: TimeFrame = DEFAULT_FRAME) {
  const [buckets, setBuckets] = useState<UserActivityResponse['buckets']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getUserActivity(userId, { frame })
      if (response.success && response.data) {
        const data = response.data as UserActivityResponse
        setBuckets(data.buckets ?? [])
      } else {
        setError(response.error ?? 'Failed to fetch activity')
        setBuckets([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setBuckets([])
    } finally {
      setLoading(false)
    }
  }, [userId, frame])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  return { buckets, frame, loading, error, refetch: fetchActivity }
}
