import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface DashboardStats {
  totalUsers: number
  totalVideos: number
  pendingReviews: number
  engagementRate: number
  userGrowth: number
  videoGrowth: number
  recentActivity: any[]
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
      const [dashboardResponse, usersResponse, videosResponse] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getUsers({ limit: 1 }), // Just to get total count
        apiClient.getPosts({ limit: 1 }) // Just to get total count
      ])

      if (dashboardResponse.success && dashboardResponse.data) {
        const dashboardData = dashboardResponse.data as any
        
        setStats({
          totalUsers: dashboardData.totalUsers || 0,
          totalVideos: dashboardData.totalVideos || 0,
          pendingReviews: dashboardData.pendingReviews || 0,
          engagementRate: dashboardData.engagementRate || 0,
          userGrowth: dashboardData.userGrowth || 0,
          videoGrowth: dashboardData.videoGrowth || 0,
          recentActivity: dashboardData.recentActivity || []
        })
      } else {
        // Fallback to individual API calls if dashboard stats not available
        const usersCount = usersResponse.success ? (usersResponse.data as any)?.total || 0 : 0
        const videosCount = videosResponse.success ? (videosResponse.data as any)?.total || 0 : 0
        
        setStats({
          totalUsers: usersCount,
          totalVideos: videosCount,
          pendingReviews: 0,
          engagementRate: 0,
          userGrowth: 0,
          videoGrowth: 0,
          recentActivity: []
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
