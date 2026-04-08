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
  maxWinners: number | null
  defaultMaxWinners: number | null
  configuredMaxWinners: number | null
  participantCount: number | null
  effectiveMaxWinners: number | null
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
  const [defaultMaxWinners, setDefaultMaxWinners] = useState<number | null>(null)
  const [configuredMaxWinners, setConfiguredMaxWinners] = useState<number | null>(null)
  const [participantCount, setParticipantCount] = useState<number | null>(null)
  const [effectiveMaxWinners, setEffectiveMaxWinners] = useState<number | null>(null)
  const [orderedBy, setOrderedBy] = useState<string | null>(null)
  const [winnersConfirmedAt, setWinnersConfirmedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWinners = useCallback(async () => {
    if (!challengeId || !enabled) {
      setWinners([])
      setPagination(null)
      setMaxWinners(null)
      setDefaultMaxWinners(null)
      setConfiguredMaxWinners(null)
      setParticipantCount(null)
      setEffectiveMaxWinners(null)
      setOrderedBy(null)
      setWinnersConfirmedAt(null)
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
      setMaxWinners(typeof data?.max_winners === 'number' ? data.max_winners : data?.max_winners ?? null)
      setDefaultMaxWinners(
        typeof data?.default_max_winners === 'number' ? data.default_max_winners : data?.default_max_winners ?? null
      )
      setConfiguredMaxWinners(
        typeof data?.configured_max_winners === 'number' ? data.configured_max_winners : data?.configured_max_winners ?? null
      )
      setParticipantCount(
        typeof data?.participant_count === 'number' ? data.participant_count : data?.participant_count ?? null
      )
      setEffectiveMaxWinners(
        typeof data?.effective_max_winners === 'number' ? data.effective_max_winners : data?.effective_max_winners ?? null
      )
      setOrderedBy(typeof data?.ordered_by === 'string' ? data.ordered_by : null)
      setWinnersConfirmedAt(typeof data?.winners_confirmed_at === 'string' ? data.winners_confirmed_at : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load aggregated winners')
      setWinners([])
      setPagination(null)
      setMaxWinners(null)
      setDefaultMaxWinners(null)
      setConfiguredMaxWinners(null)
      setParticipantCount(null)
      setEffectiveMaxWinners(null)
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
    defaultMaxWinners,
    configuredMaxWinners,
    participantCount,
    effectiveMaxWinners,
    orderedBy,
    winnersConfirmedAt,
  }
}
