import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

export interface Post {
  id: string
  title: string
  caption?: string
  description?: string
  username?: string
  userId?: string
  thumbnail_url?: string
  thumbnail?: string
  file_url?: string
  videoUrl?: string
  mediaUrl?: string
  type?: 'video' | 'image'
  fileType?: 'video' | 'image'
  status: 'active' | 'draft' | 'suspended'
  duration?: string
  views: number
  viewCount?: number
  viewCountFromTable?: number
  likes: number
  comments_count?: number
  comments?: number
  shares: number
  createdAt?: string
  uploadDate?: string
  approvedDate?: string
  tags?: string[]
  flagged?: boolean
  frozen?: boolean
  featured?: boolean
  moderationNotes?: string
  category?: {
    id: number
    name: string
  }
  user?: {
    id: string
    username: string
    email?: string
    profile_picture?: string
    bio?: string
  }
  isLiked?: boolean
  _count?: {
    postLikes?: number
    postViews?: number
    comments?: number
    shares?: number
    reports?: number
  }
  analytics?: {
    totalEngagements?: number
    engagementRate?: number
    avgEngagementPerView?: number
    isHighPerforming?: boolean
    isControversial?: boolean
    riskScore?: number
  }
  aiModeration?: {
    flagged: boolean
    summary: {
      overallAssessment: string
      flagged: boolean
      concerns: Array<{
        severity: string
        category: string
      }>
    }
    detailedResults: Record<string, {
      title: string
      flagged: boolean
      items: Array<{
        label: string
        percentage: number
        severity: string
        confidence: number
        status: string
      }>
    }>
    fileName: string
    processingType: string
    taskId: string
    processedAt: string
    processingTime: number
  }
}

interface PostsResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UsePostsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  userId?: string
  flagged?: boolean
  featured?: boolean
  frozen?: boolean
}

export function usePosts(params: UsePostsParams = {}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getPosts(params)
      
      if (response.success && response.data) {
        const data = response.data as PostsResponse
        setPosts(data.posts)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      } else {
        setError(response.error || 'Failed to fetch posts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.search, params.status, params.userId, params.flagged, params.featured, params.frozen])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const updatePost = async (postId: string, postData: {
    title?: string
    description?: string
    status?: string
    featured?: boolean
    frozen?: boolean
    moderationNotes?: string
  }) => {
    try {
      const response = await apiClient.updatePost(postId, postData)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const deletePost = async (postId: string) => {
    try {
      const response = await apiClient.deletePost(postId)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const approvePost = async (postId: string, reason?: string) => {
    try {
      const response = await apiClient.approvePost(postId, reason)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const rejectPost = async (postId: string, reason: string) => {
    try {
      const response = await apiClient.rejectPost(postId, reason)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const freezePost = async (postId: string, reason?: string) => {
    try {
      const response = await apiClient.freezePost(postId, reason)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const unfreezePost = async (postId: string, reason?: string) => {
    try {
      const response = await apiClient.unfreezePost(postId, reason)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const featurePost = async (postId: string, data?: {
    reason?: string
    expiresAt?: string
  }) => {
    try {
      const response = await apiClient.featurePost(postId, data)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const unfeaturePost = async (postId: string) => {
    try {
      const response = await apiClient.unfeaturePost(postId)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const flagPost = async (postId: string, reason: string) => {
    try {
      const response = await apiClient.flagPost(postId, reason)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const unflagPost = async (postId: string, reason?: string) => {
    try {
      const response = await apiClient.unflagPost(postId, reason)
      if (response.success) {
        await fetchPosts() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  return {
    posts,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchPosts,
    updatePost,
    deletePost,
    approvePost,
    rejectPost,
    freezePost,
    unfreezePost,
    featurePost,
    unfeaturePost,
    flagPost,
    unflagPost,
  }
}

export function usePost(postId: string) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    if (!postId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getPostById(postId)
      
      if (response.success && response.data) {
        setPost(response.data as Post)
      } else {
        setError(response.error || 'Failed to fetch post')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  return {
    post,
    loading,
    error,
    refetch: fetchPost,
  }
}
