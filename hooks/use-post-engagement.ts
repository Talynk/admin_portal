import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { PostEngagementResponse, TimeFrame } from '@/lib/types/admin'

const DEFAULT_FRAME: TimeFrame = '24h'

export function usePostEngagement(postId: string, frame: TimeFrame = DEFAULT_FRAME) {
  const [buckets, setBuckets] = useState<PostEngagementResponse['buckets']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEngagement = useCallback(async () => {
    if (!postId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getPostEngagement(postId, { frame })
      if (response.success && response.data) {
        const data = response.data as PostEngagementResponse
        setBuckets(data.buckets ?? [])
      } else {
        setError(response.error ?? 'Failed to fetch post engagement')
        setBuckets([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setBuckets([])
    } finally {
      setLoading(false)
    }
  }, [postId, frame])

  useEffect(() => {
    fetchEngagement()
  }, [fetchEngagement])

  return { buckets, frame, loading, error, refetch: fetchEngagement }
}
