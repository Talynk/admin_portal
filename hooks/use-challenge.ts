import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface ChallengeDetail {
  id: string
  name: string
  description: string
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'ended'
  start_date: string
  end_date: string
  has_rewards: boolean
  createdAt: string
  organizer: {
    id: string
    username: string
    display_name?: string
    email: string
    profile_picture?: string
  }
  approver?: {
    id: string
    username: string
    email: string
  }
  participants: Array<{
    id: string
    user_id: string
    challenge_id: string
    joined_at: string
    post_count: number
    user: {
      id: string
      username: string
      display_name?: string
      profile_picture?: string
      posts_count: number
      follower_count: number
    }
  }>
  posts: Array<{
    id: string
    challenge_id: string
    user_id: string
    post_id: string
    submitted_at: string
    post: {
      id: string
      user: {
        id: string
        username: string
        display_name?: string
        profile_picture?: string
      }
    }
  }>
  statistics: {
    total_participants: number
    total_posts: number
    participants_with_posts: number
    participants_without_posts: number
    average_posts_per_participant: number
    recent_activity: {
      participants_last_7_days: number
      posts_last_7_days: number
    }
  }
  _count: {
    participants: number
    posts: number
  }
}

export interface ChallengeAnalytics {
  challenge: {
    id: string
    name: string
    description: string
    status: string
    start_date: string
    end_date: string
    has_rewards: boolean
    organizer: {
      id: string
      username: string
      display_name?: string
      email: string
      profile_picture?: string
    }
    approver?: {
      id: string
      username: string
      email: string
    }
    participant_count: number
    post_count: number
  }
  growth: {
    daily_data: Array<{
      date: string
      participants: number
      posts: number
    }>
    cumulative_data: Array<{
      date: string
      participants: number
      posts: number
    }>
    period_days: number
  }
  participant_stats: {
    total: number
    top_contributors: Array<{
      user_id: string
      username: string
      display_name?: string
      profile_picture?: string
      post_count: number
      joined_at: string
    }>
    participants_with_posts: number
    participants_without_posts: number
    average_posts_per_participant: number
  }
}

interface UseChallengeReturn {
  challenge: ChallengeDetail | null
  analytics: ChallengeAnalytics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  refetchAnalytics: (days?: number) => Promise<void>
  approveChallenge: () => Promise<{ success: boolean; error?: string }>
  rejectChallenge: (reason?: string) => Promise<{ success: boolean; error?: string }>
  stopChallenge: () => Promise<{ success: boolean; error?: string }>
}

export function useChallenge(challengeId: string, analyticsDays: number = 30): UseChallengeReturn {
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [analytics, setAnalytics] = useState<ChallengeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChallenge = useCallback(async () => {
    if (!challengeId) return

    try {
      setError(null)
      const response = await apiClient.getChallengeById(challengeId)

      if (response.success && response.data) {
        const responseData = response.data as any
        const data = responseData.data || responseData
        setChallenge(data)
      } else {
        setError(response.error || 'Failed to fetch challenge')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [challengeId])

  const fetchAnalytics = useCallback(async (days: number = analyticsDays) => {
    if (!challengeId) return

    try {
      setError(null)
      const response = await apiClient.getChallengeAnalytics(challengeId, { days })

      if (response.success && response.data) {
        const responseData = response.data as any
        const data = responseData.data || responseData
        setAnalytics(data)
      } else {
        setError(response.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [challengeId, analyticsDays])

  const fetchAll = useCallback(async () => {
    if (!challengeId) return

    setLoading(true)
    try {
      await Promise.all([fetchChallenge(), fetchAnalytics()])
    } finally {
      setLoading(false)
    }
  }, [challengeId, fetchChallenge, fetchAnalytics])

  const approveChallenge = useCallback(async () => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.approveChallenge(challengeId)
      if (response.success) {
        await fetchChallenge()
        return { success: true }
      }
      return { success: false, error: response.error || 'Failed to approve challenge' }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }, [challengeId, fetchChallenge])

  const rejectChallenge = useCallback(async (reason?: string) => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.rejectChallenge(challengeId, reason)
      if (response.success) {
        await fetchChallenge()
        return { success: true }
      }
      return { success: false, error: response.error || 'Failed to reject challenge' }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }, [challengeId, fetchChallenge])

  const stopChallenge = useCallback(async () => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.stopChallenge(challengeId)
      if (response.success) {
        await fetchChallenge()
        return { success: true }
      }
      return { success: false, error: response.error || 'Failed to stop challenge' }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }, [challengeId, fetchChallenge])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    challenge,
    analytics,
    loading,
    error,
    refetch: fetchAll,
    refetchAnalytics: fetchAnalytics,
    approveChallenge,
    rejectChallenge,
    stopChallenge,
  }
}

