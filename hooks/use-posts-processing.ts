import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

export interface ProcessingPost {
  id: string
  title: string
  status: string
  type: string
  processing_status: string
  processing_error: string | null
  uploadDate?: string
  createdAt?: string
  user_id: string
  user?: {
    id: string
    username: string
    display_name?: string
  }
}

export interface PostsProcessingResponse {
  posts: ProcessingPost[]
  total: number
  summary: {
    pending: number
    processing: number
    uploading: number
    totalInPipeline: number
  }
}

export function usePostsProcessing(limit: number = 50) {
  const [posts, setPosts] = useState<ProcessingPost[]>([])
  const [summary, setSummary] = useState<PostsProcessingResponse['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProcessing = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getPostsProcessing({ limit })
      if (response.success && response.data) {
        const data = response.data as any
        const payload = data.data ?? data
        setPosts(payload.posts ?? [])
        setSummary(payload.summary ?? null)
      } else {
        setError(response.error ?? 'Failed to fetch processing queue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchProcessing()
  }, [fetchProcessing])

  return { posts, summary, loading, error, refetch: fetchProcessing }
}
