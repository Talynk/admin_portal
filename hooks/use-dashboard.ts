import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface DashboardStats {
  period: string
  totalUsers: number
  anonymousDeviceCount: number
  totalAudience: number
  totalVideos: number
  pendingReviews: number
  flaggedContents: number
  totalViews: number
  totalPosts: number
  totalEngagements: number
  engagementRate: number
  recentContent: any[]
}

interface UseDashboardReturn {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard stats
      const dashboardResponse = await apiClient.getDashboardStats()

      if (dashboardResponse.success && dashboardResponse.data) {
        const responseData = dashboardResponse.data as any
        // Handle nested structure: data.data.stats and data.data.recentContent
        const data = responseData.data || responseData
        const statsData = data.stats || {}
        const allTimeStatsData = data.statsAllTime || {}

        setStats({
          period: data.period || '7d',
          totalUsers: statsData.totalUsers || 0,
          anonymousDeviceCount: statsData.anonymousDeviceCount || 0,
          totalAudience: statsData.totalAudience || statsData.totalUsers || 0,
          // "Total X" cards are labeled as all-time totals, so they must read
          // from statsAllTime, not the 7-day-scoped `stats` object -- mixing
          // the two is what made "Total Videos" (215, last 7 days) look wrong
          // next to "Total Posts" (1,155, all-time), and produced a nonsense
          // 715% "Engagement Rate" (7-day engagements over a tiny 7-day post
          // count).
          totalVideos: allTimeStatsData.totalVideos ?? statsData.totalVideos ?? 0,
          pendingReviews: statsData.pendingReviews || 0,
          flaggedContents: statsData.flaggedContents || 0,
          totalViews: allTimeStatsData.totalViewEvents ?? statsData.totalViews ?? 0,
          totalPosts: allTimeStatsData.totalPosts ?? statsData.totalPosts ?? 0,
          totalEngagements: allTimeStatsData.totalEngagements ?? statsData.totalEngagements ?? 0,
          engagementRate: allTimeStatsData.engagementRate ?? statsData.engagementRate ?? 0,
          recentContent: data.recentContent || []
        })
      } else {
        // Fallback to empty stats if API fails
        setStats({
          period: '7d',
          totalUsers: 0,
          anonymousDeviceCount: 0,
          totalAudience: 0,
          totalVideos: 0,
          pendingReviews: 0,
          flaggedContents: 0,
          totalViews: 0,
          totalPosts: 0,
          totalEngagements: 0,
          engagementRate: 0,
          recentContent: []
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
