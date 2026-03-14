import { useState, useCallback, useEffect, useMemo } from 'react'
import { apiClient } from '@/lib/api-client'
import { normalizeQuery, userMatchesSearch } from '@/lib/user-search'

export interface RankingParticipantUser {
  id: string
  username: string
  display_name?: string
  profile_picture?: string
  follower_count?: number
  posts_count?: number
}

export interface RankingParticipantRow {
  user: RankingParticipantUser
  total_posts: number
  total_likes: number
  latest_submission_at?: string
}

export interface UseChallengeParticipantsRankingReturn {
  participants: RankingParticipantRow[]
  pagination: { page: number; limit: number; total?: number; totalPages?: number } | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setPage: (p: number) => void
  setSearch: (s: string) => void
  search: string
  page: number
}

export function useChallengeParticipantsRanking(
  challengeId: string | undefined,
  options: { page?: number; limit?: number; search?: string; enabled?: boolean } = {}
): UseChallengeParticipantsRankingReturn {
  const { limit = 10, enabled = true } = options
  const [page, setPage] = useState(options.page ?? 1)
  const [search, setSearch] = useState(options.search ?? '')
  const [participants, setParticipants] = useState<RankingParticipantRow[]>([])
  const [pagination, setPagination] = useState<UseChallengeParticipantsRankingReturn['pagination']>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = useCallback(async () => {
    if (!challengeId || !enabled) {
      setParticipants([])
      setPagination(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const searchNorm = normalizeQuery(search) ?? undefined
      const res = await apiClient.getChallengeParticipantsRanking(challengeId, {
        page,
        limit,
        search: searchNorm,
      })
      const data = res?.data as any
      const raw = data?.data ?? data?.participants ?? data?.ranking ?? data
      const list = Array.isArray(raw) ? raw : raw?.rows ?? []
      setParticipants(list)
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
      setError(e instanceof Error ? e.message : 'Failed to load participants ranking')
      setParticipants([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [challengeId, page, limit, search, enabled])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  const setSearchAndResetPage = useCallback((s: string) => {
    setSearch(s)
    setPage(1)
  }, [])

  const normalizedSearch = normalizeQuery(search)
  const displayParticipants = useMemo(() => {
    if (!normalizedSearch) return participants
    return participants.filter((row) => userMatchesSearch(row.user, normalizedSearch))
  }, [participants, normalizedSearch])

  return {
    participants: displayParticipants,
    pagination,
    loading,
    error,
    refetch: fetchRanking,
    setPage,
    setSearch: setSearchAndResetPage,
    search,
    page,
  }
}
