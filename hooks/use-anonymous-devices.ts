import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

export interface AnonymousDevice {
  id: string
  fingerprint_hash: string
  first_seen_at: string
  last_seen_at: string
  user_agent: string | null
  os: string | null
  browser: string | null
  locale: string | null
  claimed: boolean
  _count: { activity_logs: number; user_devices: number }
}

interface DevicesResponse {
  items: AnonymousDevice[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface UseAnonymousDevicesParams {
  page?: number
  limit?: number
  fingerprint?: string
  claimed?: boolean
  activeSinceDays?: number
}

function isDevicesResponse(value: unknown): value is DevicesResponse {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return Array.isArray(o.items) && typeof o.pagination === 'object'
}

export function useAnonymousDevices(params: UseAnonymousDevicesParams = {}) {
  const [devices, setDevices] = useState<AnonymousDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const page = typeof params.page === 'number' && params.page >= 1 ? params.page : 1
      const limit = typeof params.limit === 'number' && params.limit >= 1 && params.limit <= 100 ? params.limit : 20

      const response = await apiClient.getDevices({
        page,
        limit,
        fingerprint: params.fingerprint,
        claimed: params.claimed,
        activeSinceDays: params.activeSinceDays,
      })

      if (!response.success) {
        setError((response as { error?: string }).error || 'Failed to fetch anonymous devices')
        setDevices([])
        setTotal(0)
        setTotalPages(0)
        return
      }

      const raw = (response as ApiResponse<DevicesResponse>).data
      if (isDevicesResponse(raw)) {
        setDevices(raw.items)
        setTotal(raw.pagination.total)
        setTotalPages(raw.pagination.totalPages)
      } else {
        setDevices([])
        setTotal(0)
        setTotalPages(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDevices([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [params.page, params.limit, params.fingerprint, params.claimed, params.activeSinceDays])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  return { devices, loading, error, total, totalPages, refetch: fetchDevices }
}
