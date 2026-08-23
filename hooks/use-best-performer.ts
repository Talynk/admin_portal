import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type {
  BestPerformerSettings,
  BestPerformerUpdatePayload,
} from '@/lib/types/social-feed-settings'

function normalizeBestPerformer(data: unknown): BestPerformerSettings {
  const raw = (data ?? {}) as Record<string, unknown>
  return {
    post_id: typeof raw.post_id === 'string' ? raw.post_id : raw.post_id === null ? null : null,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label : 'Best Performer',
    expires_at:
      typeof raw.expires_at === 'string'
        ? raw.expires_at
        : raw.expires_at === null
          ? null
          : null,
  }
}

export function useBestPerformer() {
  const [settings, setSettings] = useState<BestPerformerSettings>({
    post_id: null,
    label: 'Best Performer',
    expires_at: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getBestPerformer()
      if (res.success && res.data) {
        setSettings(normalizeBestPerformer(res.data))
      } else {
        setError(res.error || res.message || 'Failed to load best performer')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load best performer')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const save = useCallback(async (payload: BestPerformerUpdatePayload) => {
    setSaving(true)
    setError(null)
    try {
      const res = await apiClient.updateBestPerformer(payload)
      if (res.success) {
        if (res.data) {
          setSettings(normalizeBestPerformer(res.data))
        } else {
          await refetch()
        }
        return { success: true as const, message: res.message }
      }
      return {
        success: false as const,
        error: res.error || res.message || 'Failed to save best performer',
      }
    } catch (err) {
      return {
        success: false as const,
        error: err instanceof Error ? err.message : 'Failed to save best performer',
      }
    } finally {
      setSaving(false)
    }
  }, [refetch])

  return { settings, loading, saving, error, refetch, save }
}
