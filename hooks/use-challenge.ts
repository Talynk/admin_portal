import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface ChallengeDetail {
  id: string
  name: string
  description: string
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'ended' | 'stopped'
  start_date: string
  end_date: string
  has_rewards: boolean
  rewards?: string
  createdAt?: string
  updatedAt?: string
  organizer_id?: string
  organizer_name?: string
  organizer_contact?: string
  contact_email?: string
  eligibility_criteria?: string
  what_you_do?: string
  scoring_criteria?: string
  min_content_per_account?: number
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null
  winners_confirmed_at?: string | null
  winners_confirmed_by?: { id: string; username: string } | null
  // Primary FE winners field (final backend value after cap/default rules)
  max_winners?: number | null
  // Legacy compatibility fields (non-primary for FE display logic)
  default_max_winners?: number | null
  configured_max_winners?: number | null
  participant_count?: number | null
  effective_max_winners?: number | null
  is_featured?: boolean
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
    winner_rank?: number | null
    likes_at_challenge_end?: number | null
    post: {
      id: string
      video_url?: string
      thumbnail_url?: string
      hls_url?: string
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
  startChallengeNow: () => Promise<{ success: boolean; error?: string; message?: string }>
  updateChallengeDates: (payload: {
    start_date?: string
    end_date?: string
  }) => Promise<{ success: boolean; error?: string }>
  reorderWinners: (orderedChallengePostIds: string[]) => Promise<{ success: boolean; error?: string; errorCode?: string; errorData?: unknown }>
  confirmChallengeWinners: () => Promise<{ success: boolean; error?: string; errorCode?: string; errorData?: unknown }>
  updateMaxWinners: (max: number | null) => Promise<{ success: boolean; error?: string; errorCode?: string; errorData?: unknown }>
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

  const startChallengeNow = useCallback(async () => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.startChallengeNow(challengeId)
      if (response.success) {
        await fetchChallenge()
        const r = response as { message?: string; data?: { message?: string } }
        const message =
          r.message ||
          (r.data && typeof r.data === 'object' && 'message' in r.data
            ? (r.data as { message?: string }).message
            : undefined)
        return { success: true, message }
      }
      const err = response as { error?: string; message?: string }
      return {
        success: false,
        error: err.error || err.message || 'Failed to start challenge',
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }, [challengeId, fetchChallenge])

  const updateChallengeDates = useCallback(
    async (payload: { start_date?: string; end_date?: string }) => {
      if (!challengeId) return { success: false, error: 'Challenge ID is required' }
      if (!payload.start_date && !payload.end_date) {
        return { success: false, error: 'At least one of start_date or end_date is required' }
      }

      try {
        const response = await apiClient.updateChallengeDates(challengeId, payload)
        if (response.success) {
          await fetchChallenge()
          await fetchAnalytics()
          return { success: true }
        }
        const err = response as { error?: string; message?: string }
        return {
          success: false,
          error: err.error || err.message || 'Failed to update schedule',
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
      }
    },
    [challengeId, fetchChallenge, fetchAnalytics]
  )

  const reorderWinners = useCallback(async (orderedChallengePostIds: string[]) => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.reorderChallengeWinners(challengeId, orderedChallengePostIds)
      if (response.success) {
        await fetchChallenge()
        return { success: true }
      }
      return {
        success: false,
        error: response.error || 'Failed to reorder winners',
        errorCode: (response as { code?: string }).code,
        errorData: (response as { data?: unknown }).data,
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }, [challengeId, fetchChallenge])

  const confirmChallengeWinners = useCallback(async () => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.confirmChallengeWinners(challengeId)
      if (response.success) {
        await fetchChallenge()
        return { success: true }
      }
      return {
        success: false,
        error: response.error || 'Failed to confirm winners',
        errorCode: (response as { code?: string }).code,
        errorData: (response as { data?: unknown }).data,
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred' }
    }
  }, [challengeId, fetchChallenge])

  const updateMaxWinners = useCallback(async (max: number | null) => {
    if (!challengeId) return { success: false, error: 'Challenge ID is required' }

    try {
      const response = await apiClient.updateChallengeWinnersConfig(challengeId, { maxWinners: max })
      if (response.success) {
        await fetchChallenge()
        return { success: true }
      }
      return {
        success: false,
        error: response.error || 'Failed to update max winners',
        errorCode: (response as { code?: string }).code,
        errorData: (response as { data?: unknown }).data,
      }
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
    startChallengeNow,
    updateChallengeDates,
    reorderWinners,
    confirmChallengeWinners,
    updateMaxWinners,
  }
}



