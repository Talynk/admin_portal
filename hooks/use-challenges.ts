import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Challenge {
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
  _count: {
    participants: number
    posts: number
  }
}

interface UseChallengesParams {
  page?: number
  limit?: number
  status?: 'pending' | 'approved' | 'active' | 'rejected' | 'ended'
}

interface UseChallengesReturn {
  challenges: Challenge[]
  loading: boolean
  error: string | null
  total: number
  totalPages: number
  refetch: () => Promise<void>
}

export function useChallenges(params?: UseChallengesParams): UseChallengesReturn {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getChallenges({
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
      })

      if (response.success && response.data) {
        const responseData = response.data as any
        const data = responseData.data || responseData
        
        if (Array.isArray(data)) {
          setChallenges(data)
        } else if (data.challenges) {
          setChallenges(data.challenges)
        } else {
          setChallenges([])
        }

        if (responseData.pagination) {
          setTotal(responseData.pagination.total || 0)
          setTotalPages(responseData.pagination.pages || 0)
        }
      } else {
        setError(response.error || 'Failed to fetch challenges')
        setChallenges([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }, [params?.page, params?.limit, params?.status])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  return {
    challenges,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchChallenges,
  }
}

