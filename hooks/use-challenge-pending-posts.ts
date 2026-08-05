import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { ChallengePendingPost, ModerationMode } from '@/lib/types/challenge'

export type PendingPostsPortal = 'admin' | 'approver'
export type PendingPostsSource = 'challenge-queue' | 'global-pending'

function unwrapPosts(data: unknown): ChallengePendingPost[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.posts ?? payload.items ?? payload.data
  return Array.isArray(list) ? (list as ChallengePendingPost[]) : []
}

function unwrapPagination(data: unknown) {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  return (payload.pagination ?? raw?.pagination) as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined
}

export function useChallengePendingPosts(options: {
  portal: PendingPostsPortal
  source?: PendingPostsSource
  challengeId?: string
  page?: number
  limit?: number
  challenge_only?: boolean
  moderation_mode?: ModerationMode
  enabled?: boolean
}) {
  const {
    portal,
    source = 'challenge-queue',
    challengeId,
    page = 1,
    limit = 20,
    challenge_only,
    moderation_mode,
    enabled = true,
  } = options
  const [posts, setPosts] = useState<ChallengePendingPost[]>([])
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    if (!enabled) return
    try {
      setLoading(true)
      setError(null)
      let response
      if (portal === 'admin') {
        if (challengeId && source === 'challenge-queue') {
          response = await apiClient.getChallengePendingPosts(challengeId, { page, limit })
        } else {
          response = await apiClient.getAdminPendingPosts({
            page,
            limit,
            challenge_id: challengeId,
            challenge_only,
            moderation_mode,
          })
        }
      } else if (source === 'global-pending') {
        response = await apiClient.getApproverPendingPosts({
          page,
          limit,
          challenge_id: challengeId,
          challenge_only,
          moderation_mode,
        })
      } else {
        response = await apiClient.getApproverChallengePendingPosts({
          page,
          limit,
          challenge_id: challengeId,
        })
      }
      if (response.success && response.data) {
        setPosts(unwrapPosts(response.data))
        const pag = unwrapPagination(response.data)
        setPagination(pag ?? null)
      } else {
        setError(response.error ?? 'Failed to load pending posts')
        setPosts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [
    portal,
    source,
    challengeId,
    page,
    limit,
    challenge_only,
    moderation_mode,
    enabled,
  ])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  return { posts, pagination, loading, error, refetch: fetchPosts }
}
