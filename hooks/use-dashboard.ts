import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface DashboardStats {
  period: string
  totalUsers: number
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
        
        setStats({
          period: data.period || '7d',
          totalUsers: statsData.totalUsers || 0,
          totalVideos: statsData.totalVideos || 0,
          pendingReviews: statsData.pendingReviews || 0,
          flaggedContents: statsData.flaggedContents || 0,
          totalViews: statsData.totalViews || 0,
          totalPosts: statsData.totalPosts || 0,
          totalEngagements: statsData.totalEngagements || 0,
          engagementRate: statsData.engagementRate || 0,
          recentContent: data.recentContent || []
        })
      } else {
        // Fallback to empty stats if API fails
        setStats({
          period: '7d',
          totalUsers: 0,
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
