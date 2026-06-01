import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type {
  AdminProcessingPostRow,
  VideoPipelineListResponse,
  VideoPipelineStats,
  VideoPipelineStatusFilter,
} from '@/lib/types/video-pipeline'

export type { AdminProcessingPostRow as ProcessingPost }

function unwrapPayload<T>(data: unknown): T {
  const raw = data as Record<string, unknown>
  return (raw?.data ?? raw) as T
}

function normalizePipelineStats(
  pipeline?: VideoPipelineStats | null,
  summary?: VideoPipelineListResponse['summary'] | null
): VideoPipelineStats | null {
  if (pipeline) return pipeline
  if (!summary) return null
  return {
    byStatus: {
      pending: summary.pending,
      processing: summary.processing,
      uploading: summary.uploading,
      failed: summary.failed,
      completed: summary.byStatus?.completed,
    },
    inPipeline: summary.totalInPipeline ?? summary.inPipeline ?? 0,
    recoverableWithSource: summary.recoverableWithSource ?? 0,
    uploadingWithoutSource: summary.uploadingWithoutSource ?? 0,
    completedWithoutHls: summary.completedWithoutHls ?? 0,
    needsAttention: summary.needsAttention ?? 0,
  }
}

export interface UseVideoPipelineOptions {
  limit?: number
  status?: VideoPipelineStatusFilter
  enabled?: boolean
}

export function useVideoPipeline(options: UseVideoPipelineOptions = {}) {
  const { limit = 50, status, enabled = true } = options
  const [posts, setPosts] = useState<AdminProcessingPostRow[]>([])
  const [pipeline, setPipeline] = useState<VideoPipelineStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProcessing = useCallback(async () => {
    if (!enabled) {
      setPosts([])
      setPipeline(null)
      setTotal(0)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getPostsProcessing({
        limit,
        status: status ?? undefined,
      })
      if (response.success && response.data) {
        const payload = unwrapPayload<VideoPipelineListResponse>(response.data)
        setPosts(payload.posts ?? [])
        setTotal(payload.total ?? payload.posts?.length ?? 0)
        setPipeline(normalizePipelineStats(payload.pipeline, payload.summary))
      } else {
        setError(response.error ?? 'Failed to fetch processing queue')
        setPosts([])
        setPipeline(null)
        setTotal(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPosts([])
      setPipeline(null)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [limit, status, enabled])

  useEffect(() => {
    fetchProcessing()
  }, [fetchProcessing])

  return { posts, pipeline, total, loading, error, refetch: fetchProcessing }
}

/** @deprecated Use useVideoPipeline */
export function usePostsProcessing(limit: number = 50) {
  const result = useVideoPipeline({ limit })
  return {
    posts: result.posts,
    summary: result.pipeline
      ? {
          pending: result.pipeline.byStatus.pending ?? 0,
          processing: result.pipeline.byStatus.processing ?? 0,
          uploading: result.pipeline.byStatus.uploading ?? 0,
          failed: result.pipeline.byStatus.failed ?? 0,
          totalInPipeline: result.pipeline.inPipeline,
        }
      : null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  }
}
