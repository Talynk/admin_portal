import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { VideoPipelineStats } from '@/lib/types/video-pipeline'

const POLL_INTERVAL_MS = 60_000

function unwrapStats(data: unknown): VideoPipelineStats | null {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as VideoPipelineStats
  if (payload && typeof payload.inPipeline === 'number') return payload
  return null
}

export function useVideoPipelineStats(options: { enabled?: boolean; poll?: boolean } = {}) {
  const { enabled = true, poll = true } = options
  const [stats, setStats] = useState<VideoPipelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!enabled) return
    try {
      setError(null)
      const response = await apiClient.getVideoPipelineStats()
      if (response.success && response.data) {
        setStats(unwrapStats(response.data))
      } else {
        setError(response.error ?? 'Failed to fetch pipeline stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void fetchStats()
  }, [fetchStats, enabled])

  useEffect(() => {
    if (!enabled || !poll) return

    const onFocus = () => {
      if (document.visibilityState === 'visible') void fetchStats()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchStats()
    }, POLL_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      clearInterval(interval)
    }
  }, [enabled, poll, fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
