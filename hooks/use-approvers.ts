import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Approver, ApproversResponse } from '@/lib/types/admin'

interface UseApproversParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function useApprovers(params: UseApproversParams = {}) {
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchApprovers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getApprovers(params)
      
      if (response.success && response.data) {
        const data = response.data as any
        // Handle the nested structure: data.data.approvers
        const approversData = data.data?.approvers || data.approvers || []
        setApprovers(approversData)
        setTotal(data.data?.total || data.total || approversData.length)
        setTotalPages(Math.ceil((data.data?.total || data.total || approversData.length) / (params.limit || 10)))
      } else {
        setError(response.error || 'Failed to fetch approvers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.search, params.status])

  useEffect(() => {
    fetchApprovers()
  }, [fetchApprovers])

  const createApproverInvitation = async (email: string) => {
    try {
      const response = await apiClient.createApproverInvitation(email)
      if (response.success) {
        await fetchApprovers() // Refresh the list
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, error: response.error, message: response.message }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  // Legacy method - kept for backward compatibility
  const createApprover = async (approverData: {
    username: string
    password: string
    email: string
  }) => {
    // Use invitation system instead
    return createApproverInvitation(approverData.email)
  }

  const updateApprover = async (approverId: string, approverData: {
    username?: string
    email?: string
    status?: string
  }) => {
    try {
      const response = await apiClient.updateApprover(approverId, approverData)
      if (response.success) {
        await fetchApprovers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const activateApprover = async (approverId: string) => {
    try {
      const response = await apiClient.activateApprover(approverId)
      if (response.success) {
        await fetchApprovers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const suspendApprover = async (approverId: string) => {
    try {
      const response = await apiClient.suspendApprover(approverId)
      if (response.success) {
        await fetchApprovers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const deactivateApprover = async (approverId: string) => {
    try {
      const response = await apiClient.deactivateApprover(approverId)
      if (response.success) {
        await fetchApprovers() // Refresh the list
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const deleteApprover = async (approverId: string) => {
    try {
      const response = await apiClient.deleteApprover(approverId)
      if (response.success) {
        await fetchApprovers() // Refresh the list
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const getApproverPosts = async (approverId: string, params?: {
    page?: number
    limit?: number
  }) => {
    try {
      const response = await apiClient.getApproverPosts(approverId, params)
      if (response.success) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  return {
    approvers,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchApprovers,
    createApprover,
    createApproverInvitation,
    updateApprover,
    activateApprover,
    suspendApprover,
    deactivateApprover,
    deleteApprover,
    getApproverPosts,
  }
}

export function useApprover(approverId: string) {
  const [approver, setApprover] = useState<Approver | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApprover = useCallback(async () => {
    if (!approverId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getApproverById(approverId)
      
      if (response.success && response.data) {
        setApprover(response.data as Approver)
      } else {
        setError(response.error || 'Failed to fetch approver')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [approverId])

  useEffect(() => {
    fetchApprover()
  }, [fetchApprover])

  return {
    approver,
    loading,
    error,
    refetch: fetchApprover,
  }
}

