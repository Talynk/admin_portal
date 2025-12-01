import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

interface User {
  id: string
  username: string
  email: string
  fullName?: string
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
  country_id: number | null
  phone1?: string | null
  phone2?: string | null
  last_login?: string | null
  follower_count?: number
  postsApproved?: number
  postsPending?: number
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface UseUsersParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  role?: string
  country_id?: number
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
      
      const response = await apiClient.getUsers(params)
      
      //check the users repsonse object 
      console.log(response) 
      
      
      if (response.success && response.data) {
        const data = response.data as UsersResponse
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        setError(response.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.search, params.status, params.role])

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
      } else {
        return { success: false, error: response.error }
      }
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

  return {
    users,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    activateUser,
  }
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return

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
