import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { UserPostsEngagementResponse, TimeFrame } from '@/lib/types/admin'

const DEFAULT_FRAME: TimeFrame = '30d'

export function useUserPostsEngagement(userId: string, frame: TimeFrame = DEFAULT_FRAME) {
  const [summary, setSummary] = useState<UserPostsEngagementResponse['summary'] | null>(null)
  const [engagementRate, setEngagementRate] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEngagement = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getUserPostsEngagement(userId, { frame })
      if (response.success && response.data) {
        const data = response.data as UserPostsEngagementResponse
        setSummary(data.summary ?? null)
        setEngagementRate(data.engagementRate ?? 0)
      } else {
        setError(response.error ?? 'Failed to fetch engagement')
        setSummary(null)
        setEngagementRate(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSummary(null)
      setEngagementRate(0)
    } finally {
      setLoading(false)
    }
  }, [userId, frame])

  useEffect(() => {
    fetchEngagement()
  }, [fetchEngagement])

  return {
    summary,
    engagementRate,
    frame,
    loading,
    error,
    refetch: fetchEngagement,
  }
}
