import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'

const DEFAULT_THRESHOLD = 5

const VALIDATION_MESSAGES = {
  required: 'Threshold is required.',
  numeric: 'Threshold must be a number.',
  integer: 'Threshold must be an integer.',
  min: 'Threshold must be greater than or equal to 1.',
}

type SaveResult = {
  success: boolean
  threshold?: number
  error?: string
}

export function usePostReportThreshold() {
  const [thresholdInput, setThresholdInput] = useState<string>('')
  const [initialThreshold, setInitialThreshold] = useState<number>(DEFAULT_THRESHOLD)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return VALIDATION_MESSAGES.required
    }

    const parsed = Number(trimmed)
    if (Number.isNaN(parsed)) {
      return VALIDATION_MESSAGES.numeric
    }

    if (!Number.isInteger(parsed)) {
      return VALIDATION_MESSAGES.integer
    }

    if (parsed < 1) {
      return VALIDATION_MESSAGES.min
    }

    return null
  }, [])

  const fetchThreshold = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getPostReportThreshold()
      if (response.success && response.data) {
        const currentValue = response.data.post_report_suspend_threshold ?? DEFAULT_THRESHOLD
        const normalized = Number.isInteger(currentValue) && currentValue >= 1 ? currentValue : DEFAULT_THRESHOLD
        setInitialThreshold(normalized)
        setThresholdInput(String(normalized))
      } else {
        setError(response.error ?? 'Failed to fetch post report suspension threshold.')
        setInitialThreshold(DEFAULT_THRESHOLD)
        setThresholdInput(String(DEFAULT_THRESHOLD))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch post report suspension threshold.')
      setInitialThreshold(DEFAULT_THRESHOLD)
      setThresholdInput(String(DEFAULT_THRESHOLD))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThreshold()
  }, [fetchThreshold])

  const save = useCallback(async (): Promise<SaveResult> => {
    const validationError = validate(thresholdInput)
    if (validationError) {
      setError(validationError)
      return {
        success: false,
        error: validationError,
      }
    }

    setSaving(true)
    setError(null)
    try {
      const nextThreshold = Number(thresholdInput.trim())
      const response = await apiClient.updatePostReportThreshold(nextThreshold)

      if (response.success && response.data) {
        const savedValue = response.data.post_report_suspend_threshold ?? nextThreshold
        const normalized = Number.isInteger(savedValue) && savedValue >= 1 ? savedValue : nextThreshold
        setInitialThreshold(normalized)
        setThresholdInput(String(normalized))
        return {
          success: true,
          threshold: normalized,
        }
      }

      const apiError = response.error ?? 'Failed to update post report suspension threshold.'
      setError(apiError)
      return {
        success: false,
        error: apiError,
      }
    } catch (err) {
      const fallbackError = err instanceof Error ? err.message : 'Failed to update post report suspension threshold.'
      setError(fallbackError)
      return {
        success: false,
        error: fallbackError,
      }
    } finally {
      setSaving(false)
    }
  }, [thresholdInput, validate])

  const reset = useCallback(() => {
    setThresholdInput(String(initialThreshold))
    setError(null)
  }, [initialThreshold])

  const threshold = useMemo(() => {
    const parsed = Number(thresholdInput.trim())
    if (!Number.isInteger(parsed) || parsed < 1) {
      return null
    }
    return parsed
  }, [thresholdInput])

  return {
    thresholdInput,
    threshold,
    initialThreshold,
    loading,
    saving,
    error,
    setThresholdInput,
    validate,
    save,
    reset,
    refetch: fetchThreshold,
  }
}
