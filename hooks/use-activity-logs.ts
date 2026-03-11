import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import type { ActivityLog, ActivityLogsResponse } from '@/lib/types/admin'

export interface ActivityLogsParams {
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  userId?: string
}

export function useActivityLogs(initialParams: ActivityLogsParams = {}) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [pagination, setPagination] = useState<ActivityLogsResponse['pagination'] | null>(null)
  const [params, setParams] = useState<ActivityLogsParams>({ page: 1, limit: 50, ...initialParams })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getActivityLogs(params)

      if (response.success && response.data) {
        const data = response.data as ActivityLogsResponse | { logs?: ActivityLog[]; data?: ActivityLog[] }

        if ('logs' in data) {
          const typed = data as ActivityLogsResponse
          setLogs(typed.logs || [])
          setPagination(typed.pagination)
        } else {
          const logsArray = (data.logs ?? data.data ?? []) as ActivityLog[]
          setLogs(Array.isArray(logsArray) ? logsArray : [])
          setPagination(null)
        }
      } else {
        setError((response as any).error || 'Failed to fetch activity logs')
        setLogs([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    pagination,
    loading,
    error,
    params,
    setParams,
    refetch: fetchLogs,
  }
}

