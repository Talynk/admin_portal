import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface UserStats {
  period: string
  users: {
    total: number
    active: number
    suspended: number
    newInPeriod: number
    withPosts: number
    withVerifiedEmail: number
    withoutPosts: number
  }
  registration: {
    newUsers: number
    periodDays: number
    averagePerDay: number
    todayRegistrations: number
    growthRate: number
  }
  ageDistribution: Array<{
    ageGroup: string
    count: number
    percentage: number
  }>
  topCountries: Array<{
    id: number
    country: string
    flagEmoji: string
    userCount: number
    percentage: number
  }>
  engagement: {
    usersWithPosts: number
    usersWithoutPosts: number
    postCreationRate: number
  }
  verification: {
    verified: number
    unverified: number
    verificationRate: number
  }
}

interface UseUserStatsReturn {
  stats: UserStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUserStats(period: '7d' | '30d' | '90d' | '1y' = '30d'): UseUserStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getUserStats({ period })

      if (response.success && response.data) {
        const responseData = response.data as any
        const data = responseData.data || responseData

        setStats({
          period: data.period || period,
          users: data.users || {
            total: 0,
            active: 0,
            suspended: 0,
            newInPeriod: 0,
            withPosts: 0,
            withVerifiedEmail: 0,
            withoutPosts: 0,
          },
          registration: data.registration || {
            newUsers: 0,
            periodDays: 0,
            averagePerDay: 0,
            todayRegistrations: 0,
            growthRate: 0,
          },
          ageDistribution: data.ageDistribution || [],
          topCountries: data.topCountries || [],
          engagement: data.engagement || {
            usersWithPosts: 0,
            usersWithoutPosts: 0,
            postCreationRate: 0,
          },
          verification: data.verification || {
            verified: 0,
            unverified: 0,
            verificationRate: 0,
          },
        })
      } else {
        setError(response.error || 'Failed to fetch user stats')
        setStats(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}








