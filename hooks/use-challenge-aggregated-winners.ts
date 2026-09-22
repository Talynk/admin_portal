import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface AggregatedWinnerUser {
  id: string
  username: string
  display_name?: string
  profile_picture?: string
  follower_count?: number
  posts_count?: number
  email?: string | null
  phone1?: string | null
  phone2?: string | null
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
  is_winner?: boolean
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
  maxWinners: number | null
  participantCount: number | null
  orderedBy: string | null
  winnersConfirmedAt: string | null
}

export function useChallengeAggregatedWinners(
  challengeId: string | undefined,
  options: { page?: number; limit?: number; enabled?: boolean } = {}
): UseChallengeAggregatedWinnersReturn {
  const { limit = 10, enabled = true } = options
  const [page, setPage] = useState(options.page ?? 1)
  const [winners, setWinners] = useState<AggregatedWinnerRow[]>([])
  const [pagination, setPagination] = useState<UseChallengeAggregatedWinnersReturn['pagination']>(null)
  const [maxWinners, setMaxWinners] = useState<number | null>(null)
  const [participantCount, setParticipantCount] = useState<number | null>(null)
  const [orderedBy, setOrderedBy] = useState<string | null>(null)
  const [winnersConfirmedAt, setWinnersConfirmedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWinners = useCallback(async () => {
    if (!challengeId || !enabled) {
      setWinners([])
      setPagination(null)
      setMaxWinners(null)
      setParticipantCount(null)
      setOrderedBy(null)
      setWinnersConfirmedAt(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getChallengeAggregatedWinners(challengeId, { page, limit })
      const data = res?.data as any
      // The backend returns pagination/max_winners/ordered_by/winners_confirmed_at
      // as siblings of `data` (which is just the winners array), not nested
      // inside it — the API client now forwards those onto `res` itself.
      const meta = res as any
      const raw = data?.data ?? data?.winners ?? data
      const list = Array.isArray(raw) ? raw : raw?.rows ?? []
      setWinners(list)
      const pag = data?.pagination ?? meta?.pagination
      if (pag) {
        setPagination({
          page: pag.page ?? page,
          limit: pag.limit ?? limit,
          total: pag.total ?? pag.totalCount,
          totalPages: pag.totalPages ?? pag.pages ?? (pag.total && pag.limit ? Math.ceil(pag.total / pag.limit) : undefined),
        })
      } else {
        setPagination({ page, limit })
      }
      const maxWinnersValue = data?.max_winners ?? meta?.max_winners
      setMaxWinners(typeof maxWinnersValue === 'number' ? maxWinnersValue : null)
      const participantCountValue = data?.participant_count ?? meta?.participant_count
      setParticipantCount(typeof participantCountValue === 'number' ? participantCountValue : null)
      const orderedByValue = data?.ordered_by ?? meta?.ordered_by
      setOrderedBy(typeof orderedByValue === 'string' ? orderedByValue : null)
      const winnersConfirmedAtValue = data?.winners_confirmed_at ?? meta?.winners_confirmed_at
      setWinnersConfirmedAt(typeof winnersConfirmedAtValue === 'string' ? winnersConfirmedAtValue : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load aggregated winners')
      setWinners([])
      setPagination(null)
      setMaxWinners(null)
      setParticipantCount(null)
      setOrderedBy(null)
      setWinnersConfirmedAt(null)
    } finally {
      setLoading(false)
    }
  }, [challengeId, page, limit, enabled])

  useEffect(() => {
    fetchWinners()
  }, [fetchWinners])

  return {
    winners,
    pagination,
    loading,
    error,
    refetch: fetchWinners,
    setPage,
    page,
    maxWinners,
    participantCount,
    orderedBy,
    winnersConfirmedAt,
  }
}
