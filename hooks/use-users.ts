import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'
import { normalizeQuery, userMatchesSearch } from '@/lib/user-search'

interface User {
  id: string
  username: string
  email: string
  fullName?: string
  display_name?: string
  status: 'active' | 'suspended' | 'pending' | 'frozen'
  role: 'user' | 'creator' | 'admin'
  followers?: number
  following?: number
  videos?: number
  createdAt: string
  last_active_date: string
  verified?: boolean
  posts_count: number
  profile_picture: string | null
  date_of_birth: string | null
  country_id?: number | null
  country?: { id: number; name: string; code: string; flag_emoji: string }
  phone1?: string | null
  phone2?: string | null
  last_login?: string | null
  follower_count?: number
  postsApproved?: number
  postsPending?: number
  bio?: string
  totalPostViews?: number
  total_profile_views?: number
  suspended_at?: string
  suspension_reason?: string
  summary?: { totalPosts: number; totalPostViews: number; totalReportsOnContent: number }
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UseUsersParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  role?: string
  country_id?: number
  sort?: string
  order?: 'asc' | 'desc'
  verified?: boolean
  has_posts?: boolean
  date_from?: string
  date_to?: string
}

function isUsersResponse(value: unknown): value is UsersResponse {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return Array.isArray(o.users) && typeof o.total === 'number'
}

function searchParamForApi(s: unknown): string | undefined {
  const normalized = normalizeQuery(s)
  return normalized ?? undefined
}

export function useUsers(params: UseUsersParams = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const search = searchParamForApi(params.search)
      const page = typeof params.page === 'number' && params.page >= 1 ? params.page : 1
      const limit = typeof params.limit === 'number' && params.limit >= 1 && params.limit <= 100 ? params.limit : 20
      const status = typeof params.status === 'string' && params.status.trim().length > 0 ? params.status.trim() : undefined
      const role = typeof params.role === 'string' && params.role.trim().length > 0 ? params.role.trim() : undefined
      const country_id = typeof params.country_id === 'number' && !Number.isNaN(params.country_id) ? params.country_id : undefined
      const sort = typeof params.sort === 'string' && params.sort.trim().length > 0 ? params.sort.trim() : undefined
      const order = params.order === 'asc' || params.order === 'desc' ? params.order : undefined
      const verified = typeof params.verified === 'boolean' ? params.verified : undefined
      const has_posts = typeof params.has_posts === 'boolean' ? params.has_posts : undefined
      const date_from = typeof params.date_from === 'string' && params.date_from.trim().length > 0 ? params.date_from.trim() : undefined
      const date_to = typeof params.date_to === 'string' && params.date_to.trim().length > 0 ? params.date_to.trim() : undefined

      const response = await apiClient.getUsers({
        page,
        limit,
        search,
        status,
        role,
        country_id,
        sort,
        order,
        verified,
        has_posts,
        date_from,
        date_to,
      })

      if (!response.success) {
        setError((response as { error?: string }).error || 'Failed to fetch users')
        setUsers([])
        setTotal(0)
        setTotalPages(0)
        return
      }

      const raw = (response as ApiResponse).data
      let list: User[] = []
      if (isUsersResponse(raw)) {
        list = Array.isArray(raw.users) ? raw.users : []
        setTotal(Number(raw.total) || 0)
        setTotalPages(typeof raw.totalPages === 'number' ? raw.totalPages : Math.ceil((Number(raw.total) || 0) / limit))
      } else if (raw != null && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).users)) {
        const fallback = raw as Record<string, unknown>
        list = (fallback.users as User[]) ?? []
        setTotal(Number(fallback.total) ?? 0)
        setTotalPages(typeof fallback.totalPages === 'number' ? fallback.totalPages : Math.ceil((Number(fallback.total) ?? 0) / limit))
      } else {
        setTotal(0)
        setTotalPages(0)
      }
      setUsers(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUsers([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [
    params.page,
    params.limit,
    params.search,
    params.status,
    params.role,
    params.country_id,
    params.sort,
    params.order,
    params.verified,
    params.has_posts,
    params.date_from,
    params.date_to,
  ])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const createUser = async (userData: {
    username: string
    email: string
    fullName: string
    role?: string
  }) => {
    try {
      const response = await apiClient.createUser(userData)
      if (response.success) {
        await fetchUsers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const updateUser = async (userId: string, userData: {
    username?: string
    email?: string
    fullName?: string
    role?: string
    status?: string
    verified?: boolean
  }) => {
    try {
      const response = await apiClient.updateUser(userId, userData)
      if (response.success) {
        await fetchUsers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await apiClient.deleteUser(userId)
      if (response.success) {
        await fetchUsers() // Refresh the list
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const suspendUser = async (userId: string, reason?: string) => {
    try {
      const response = await apiClient.suspendUser(userId, reason)
      if (response.success) {
        await fetchUsers() // Refresh the list
        return { success: true, data: response.data }
      }
      const errMsg = response.error || (response as any).message || 'Failed to suspend user'
      // Fallback: try PATCH status if manage endpoint failed (e.g. wrong id format or endpoint)
      const fallback = await apiClient.updateUserStatus(userId, 'suspended')
      if (fallback.success) {
        await fetchUsers()
        return { success: true, data: fallback.data }
      }
      return { success: false, error: errMsg }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const unsuspendUser = async (userId: string, reason?: string) => {
    try {
      const response = await apiClient.unsuspendUser(userId, reason)
      if (response.success) {
        await fetchUsers() // Refresh the list
        return { success: true, data: response.data }
      }
      const errMsg = response.error || (response as any).message || 'Failed to unsuspend user'
      const fallback = await apiClient.updateUserStatus(userId, 'active')
      if (fallback.success) {
        await fetchUsers()
        return { success: true, data: fallback.data }
      }
      return { success: false, error: errMsg }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const activateUser = async (userId: string, reason?: string) => {
    try {
      const response = await apiClient.activateUser(userId, reason)
      if (response.success) {
        await fetchUsers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const normalizedSearch = normalizeQuery(params.search)
  const displayUsers = useMemo(() => {
    if (!normalizedSearch) return users
    return users.filter((u) => userMatchesSearch(u, normalizedSearch))
  }, [users, normalizedSearch])

  return {
    users: displayUsers,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    unsuspendUser,
    activateUser,
  }
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return

    // Frontend safety: ensure we only call the admin user-details API with a UUID
    const uuidRegex = /^[0-9a-fA-F-]{36}$/
    if (!uuidRegex.test(userId)) {
      console.error('Frontend bug: userId passed to useUser is not a UUID', { userId })
      setError('Invalid user id passed from frontend. Expected UUID.')
      setUser(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getUserById(userId)
      
      if (response.success && response.data) {
        setUser(response.data as User)
      } else {
        setError(response.error || 'Failed to fetch user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  }
}
