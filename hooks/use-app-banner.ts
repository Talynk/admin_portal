import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import {
  EMPTY_BANNER_TARGETING,
  type AppBannerSettings,
  type AppBannerTargeting,
  type AppBannerUpdatePayload,
} from '@/lib/types/social-feed-settings'

function normalizeBanner(data: unknown): AppBannerSettings {
  const raw = (data ?? {}) as Record<string, unknown>
  const targetingRaw = (raw.targeting ?? {}) as Record<string, unknown>
  const genders = Array.isArray(targetingRaw.genders)
    ? targetingRaw.genders.filter((g): g is 'male' | 'female' => g === 'male' || g === 'female')
    : []
  const countryIds = Array.isArray(targetingRaw.country_ids)
    ? targetingRaw.country_ids.filter((id): id is number => typeof id === 'number')
    : []

  return {
    banner_message:
      typeof raw.banner_message === 'string'
        ? raw.banner_message
        : raw.banner_message === null
          ? null
          : null,
    targeting: {
      genders,
      age_min: typeof targetingRaw.age_min === 'number' ? targetingRaw.age_min : null,
      age_max: typeof targetingRaw.age_max === 'number' ? targetingRaw.age_max : null,
      country_ids: countryIds,
    },
  }
}

export function useAppBanner() {
  const [settings, setSettings] = useState<AppBannerSettings>({
    banner_message: null,
    targeting: { ...EMPTY_BANNER_TARGETING },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getAppBanner()
      if (res.success && res.data) {
        setSettings(normalizeBanner(res.data))
      } else {
        setError(res.error || res.message || 'Failed to load app banner')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app banner')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const save = useCallback(async (payload: AppBannerUpdatePayload) => {
    setSaving(true)
    setError(null)
    try {
      const res = await apiClient.updateAppBanner(payload)
      if (res.success) {
        if (res.data) {
          setSettings(normalizeBanner(res.data))
        } else {
          await refetch()
        }
        return { success: true as const, message: res.message }
      }
      return {
        success: false as const,
        error: res.error || res.message || 'Failed to save app banner',
      }
    } catch (err) {
      return {
        success: false as const,
        error: err instanceof Error ? err.message : 'Failed to save app banner',
      }
    } finally {
      setSaving(false)
    }
  }, [refetch])

  const setLocalTargeting = useCallback((targeting: AppBannerTargeting) => {
    setSettings((prev) => ({ ...prev, targeting }))
  }, [])

  const setLocalMessage = useCallback((message: string) => {
    setSettings((prev) => ({ ...prev, banner_message: message }))
  }, [])

  return {
    settings,
    loading,
    saving,
    error,
    refetch,
    save,
    setLocalMessage,
    setLocalTargeting,
  }
}
