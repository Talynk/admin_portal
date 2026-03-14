import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface AggregatedWinnerUser {
  id: string
  username: string
  display_name?: string
  profile_picture?: string
  follower_count?: number
  posts_count?: number
}

export interface AggregatedWinnerPostSummary {
  id: string
  post_id?: string
  winner_rank?: number | null
  likes_at_challenge_end?: number | null
  submitted_at?: string
  [key: string]: unknown
}

export interface AggregatedWinnerRow {
  user: AggregatedWinnerUser
  total_winner_posts: number
  total_likes_during_challenge: number
  winner_rank?: number | null
  latest_submission_at?: string
  posts?: AggregatedWinnerPostSummary[]
}

export interface UseChallengeAggregatedWinnersReturn {
  winners: AggregatedWinnerRow[]
  pagination: { page: number; limit: number; total?: number; totalPages?: number } | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setPage: (p: number) => void
  page: number
}

export function useChallengeAggregatedWinners(
  challengeId: string | undefined,
  options: { page?: number; limit?: number; enabled?: boolean } = {}
): UseChallengeAggregatedWinnersReturn {
  const { limit = 10, enabled = true } = options
  const [page, setPage] = useState(options.page ?? 1)
  const [winners, setWinners] = useState<AggregatedWinnerRow[]>([])
  const [pagination, setPagination] = useState<UseChallengeAggregatedWinnersReturn['pagination']>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWinners = useCallback(async () => {
    if (!challengeId || !enabled) {
      setWinners([])
      setPagination(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getChallengeAggregatedWinners(challengeId, { page, limit })
      const data = res?.data as any
      const raw = data?.data ?? data?.winners ?? data
      const list = Array.isArray(raw) ? raw : raw?.rows ?? []
      setWinners(list)
      const pag = data?.pagination ?? (res as any)?.pagination
      if (pag) {
        setPagination({
          page: pag.page ?? page,
          limit: pag.limit ?? limit,
          total: pag.total ?? pag.totalCount,
          totalPages: pag.totalPages ?? (pag.total && pag.limit ? Math.ceil(pag.total / pag.limit) : undefined),
        })
      } else {
        setPagination({ page, limit })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load aggregated winners')
      setWinners([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [challengeId, page, limit, enabled])

  useEffect(() => {
    fetchWinners()
  }, [fetchWinners])

  return { winners, pagination, loading, error, refetch: fetchWinners, setPage, page }
}
