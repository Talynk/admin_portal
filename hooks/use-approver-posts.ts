import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { normalizePagination } from '@/lib/pagination'
import type { ChallengeContext } from '@/lib/types/challenge'
import type { LegacyMediaFields, PostPlaybackFields } from '@/lib/types/media'

export type ApproverPostVariant = 'pending' | 'suspended' | 'flagged' | 'approved'

export interface ApproverReviewPost extends PostPlaybackFields, LegacyMediaFields {
  id: string
  title?: string | null
  description?: string | null
  caption?: string | null
  status: string
  createdAt?: string
  uploadDate?: string
  approved_at?: string
  suspended_at?: string
  suspend_reason?: string
  report_count?: number
  challenge_context?: ChallengeContext | null
  user?: {
    id?: string
    username?: string
    email?: string
    profile_picture?: string | null
  }
}

function unwrapPosts(data: unknown): ApproverReviewPost[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.posts ?? payload.items ?? payload.data
  return Array.isArray(list) ? (list as ApproverReviewPost[]) : []
}

export function useApproverPosts(options: {
  variant: ApproverPostVariant
  page?: number
  limit?: number
  challenge_only?: boolean
  enabled?: boolean
}) {
  const { variant, page = 1, limit = 12, challenge_only, enabled = true } = options
  const [posts, setPosts] = useState<ApproverReviewPost[]>([])
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
      switch (variant) {
        case 'pending':
          response = await apiClient.getApproverPendingPosts({
            page,
            limit,
            challenge_only,
          })
          break
        case 'suspended':
          response = await apiClient.getApproverSuspendedPosts({ page, limit })
          break
        case 'flagged':
          response = await apiClient.getApproverFlaggedPosts({ page, limit })
          break
        case 'approved':
          response = await apiClient.getApproverApprovedPosts({ page, limit })
          break
      }

      if (response.success && response.data) {
        setPosts(unwrapPosts(response.data))
        setPagination(normalizePagination(response.data, limit))
      } else {
        setError(response.error ?? 'Failed to load posts')
        setPosts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [variant, page, limit, challenge_only, enabled])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  return { posts, pagination, loading, error, refetch: fetchPosts }
}
