import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface ChallengeDashboardStats {
  overview: {
    total: number
    pending: number
    approved: number
    active: number
    rejected: number
    ended: number
  }
  engagement: {
    total_participants: number
    total_posts: number
    challenges_with_rewards: number
    average_participants_per_challenge: number
    average_posts_per_challenge: number
  }
  recent_challenges: Array<{
    id: string
    name: string
    status: string
    organizer: {
      id: string
      username: string
      display_name?: string
    }
    participant_count: number
    post_count: number
    createdAt: string
  }>
}

export interface ChallengeGrowthAnalytics {
  daily_data: Array<{
    date: string
    challenges: number
    participants: number
    posts: number
  }>
  cumulative_data: Array<{
    date: string
    challenges: number
    participants: number
    posts: number
  }>
  summary: {
    total_challenges: number
    total_participants: number
    total_posts: number
    period_days: number
  }
}

interface UseChallengeStatsReturn {
  stats: ChallengeDashboardStats | null
  growthAnalytics: ChallengeGrowthAnalytics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  refetchGrowth: (days?: number) => Promise<void>
}

export function useChallengeStats(days: number = 30): UseChallengeStatsReturn {
  const [stats, setStats] = useState<ChallengeDashboardStats | null>(null)
  const [growthAnalytics, setGrowthAnalytics] = useState<ChallengeGrowthAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const response = await apiClient.getChallengeDashboardStats()

      if (response.success && response.data) {
        const responseData = response.data as any
        const data = responseData.data || responseData
        setStats(data)
      } else {
        setError(response.error || 'Failed to fetch challenge stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [])

  const fetchGrowthAnalytics = useCallback(async (analyticsDays: number = days) => {
    try {
      setError(null)
      const response = await apiClient.getChallengeGrowthAnalytics({ days: analyticsDays })

      if (response.success && response.data) {
        const responseData = response.data as any
        const data = responseData.data || responseData
        setGrowthAnalytics(data)
      } else {
        setError(response.error || 'Failed to fetch growth analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [days])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchStats(), fetchGrowthAnalytics()])
    } finally {
      setLoading(false)
    }
  }, [fetchStats, fetchGrowthAnalytics])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    stats,
    growthAnalytics,
    loading,
    error,
    refetch: fetchAll,
    refetchGrowth: fetchGrowthAnalytics,
  }
}



