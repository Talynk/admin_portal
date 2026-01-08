import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

interface UserDemographic {
  age_group: string
  count: number
}

interface DeviceUsage {
  device_type: string
  count: number
}

interface TopCountry {
  country: string
  flag_emoji: string
  user_count: number
  percentage: number
}

interface TopCategory {
  category: string
  post_count: number
  percentage: number
}

interface AnalyticsData {
  period: string
  totalUsers: number
  totalViews: number
  totalPosts: number
  totalEngagements: number
  userDemographics: Array<{
    range: string
    percentage: number
    count: number
    age_group?: string
  }>
  deviceUsage: Array<{
    type: string
    percentage: number
    count: number
  }>
  topCountries: TopCountry[]
  topCategories: TopCategory[]
  avgSessionTimes: number
  bounceRate: number
  completionRate: number
}

interface UseAnalyticsReturn {
  analytics: AnalyticsData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d'): UseAnalyticsReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Map UI period to API period
  const mapPeriod = (period: string): '1h' | '1d' | '7d' | '1m' | '3m' | '1y' => {
    switch (period) {
      case '30d':
        return '1m'
      case '90d':
        return '3m'
      case '1y':
        return '1y'
      case '7d':
      default:
        return '7d'
    }
  }

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const apiPeriod = mapPeriod(period)
      const response = await apiClient.getAnalytics({ period: apiPeriod })

      if (response.success && response.data) {
        const responseData = response.data as any
        // Handle nested structure: data.data.analytics
        const data = responseData.data || responseData
        const analyticsData = data.analytics || {}

        // Calculate percentages for demographics
        const totalUsersForDemographics = analyticsData.userDemographics?.reduce(
          (sum: number, item: UserDemographic) => sum + item.count,
          0
        ) || 0

        const ageGroupsWithPercentage = analyticsData.userDemographics?.map((item: UserDemographic) => {
          const percentage = totalUsersForDemographics > 0
            ? (item.count / totalUsersForDemographics) * 100
            : 0
          
          // Map age_group from API to UI format
          let range = item.age_group
          if (item.age_group === 'Under 18') range = '13-17'
          else if (item.age_group === '18-24') range = '18-24'
          else if (item.age_group === '25-34') range = '25-34'
          else if (item.age_group === '35-44') range = '35-44'
          else if (item.age_group === '45-54' || item.age_group === '55-64' || item.age_group === '65+') range = '45+'
          else if (item.age_group === 'Unknown') range = 'Unknown'
          
          return {
            range,
            percentage: Math.round(percentage * 10) / 10,
            count: item.count,
            age_group: item.age_group // Keep original for reference
          }
        }) || []

        // Calculate percentages for device usage
        const totalDeviceViews = analyticsData.deviceUsage?.reduce(
          (sum: number, item: DeviceUsage) => sum + item.count,
          0
        ) || 0

        const devicesWithPercentage = analyticsData.deviceUsage?.map((item: DeviceUsage) => {
          const percentage = totalDeviceViews > 0
            ? (item.count / totalDeviceViews) * 100
            : 0
          return {
            type: item.device_type,
            percentage: Math.round(percentage * 10) / 10,
            count: item.count
          }
        }) || []

        // Calculate percentages for countries
        const totalCountryUsers = analyticsData.topCountries?.reduce(
          (sum: number, item: TopCountry) => sum + (item.user_count || 0),
          0
        ) || 0

        const countriesWithPercentage = analyticsData.topCountries?.map((item: TopCountry) => {
          // Use existing percentage if it's a valid number, otherwise calculate it
          let percentage = typeof item.percentage === 'number' && !isNaN(item.percentage)
            ? item.percentage
            : totalCountryUsers > 0
            ? ((item.user_count || 0) / totalCountryUsers) * 100
            : 0
          
          return {
            country: item.country || '',
            flag_emoji: item.flag_emoji || '',
            user_count: item.user_count || 0,
            percentage: Math.round(percentage * 10) / 10
          }
        }) || []

        // Ensure topCategories percentages are numbers
        const categoriesWithPercentage = analyticsData.topCategories?.map((item: TopCategory) => {
          const percentage = typeof item.percentage === 'number' && !isNaN(item.percentage)
            ? item.percentage
            : 0
          
          return {
            category: item.category || '',
            post_count: item.post_count || 0,
            percentage: Math.round(percentage * 10) / 10
          }
        }) || []

        // Format session time
        const formatSessionTime = (minutes: number): string => {
          if (minutes < 60) {
            return `${Math.round(minutes)}m`
          }
          const hours = Math.floor(minutes / 60)
          const mins = Math.round(minutes % 60)
          return `${hours}h ${mins}m`
        }

        setAnalytics({
          period: data.period || period,
          totalUsers: analyticsData.totalUsers || 0,
          totalViews: analyticsData.totalViews || 0,
          totalPosts: analyticsData.totalPosts || 0,
          totalEngagements: analyticsData.totalEngagements || 0,
          userDemographics: ageGroupsWithPercentage,
          deviceUsage: devicesWithPercentage,
          topCountries: countriesWithPercentage,
          topCategories: categoriesWithPercentage,
          avgSessionTimes: analyticsData.avgSessionTimes || 0,
          bounceRate: analyticsData.bounceRate || 0,
          completionRate: analyticsData.completionRate || 0
        } as any)
      } else {
        setError(response.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  }
}

