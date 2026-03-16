import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Session {
  id: string
  device_fingerprint_id?: string | null
  user_agent?: string | null
  ip_address?: string | null
  created_at: string
  last_active_at?: string | null
  revoked_at?: string | null
}

export function useUserSessions(userId: string) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!userId) {
      setSessions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getUserSessions(userId)
      if (res.success && res.data) {
        const data = res.data as { sessions?: Session[] }
        const list = Array.isArray(data.sessions) ? data.sessions : []
        setSessions(
          list.map((s) => ({
            id: s.id,
            device_fingerprint_id: s.device_fingerprint_id ?? null,
            user_agent: s.user_agent ?? null,
            ip_address: s.ip_address ?? null,
            created_at: s.created_at,
            last_active_at: s.last_active_at ?? null,
            revoked_at: s.revoked_at ?? null,
          }))
        )
      } else {
        setSessions([])
        setError((res as { error?: string }).error ?? 'Failed to load sessions')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const revokeSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return { success: false, error: 'No user' }
      try {
        const res = await apiClient.revokeUserSession(userId, sessionId)
        if (res.success) {
          await fetchSessions()
          return { success: true }
        }
        return {
          success: false,
          error: (res as { error?: string }).error ?? 'Failed to revoke session',
        }
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Failed to revoke session',
        }
      }
    },
    [userId, fetchSessions]
  )

  return { sessions, loading, error, refetch: fetchSessions, revokeSession }
}
