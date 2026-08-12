import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { normalizePagination } from '@/lib/pagination'
import type { PendingDocumentItem } from '@/lib/types/challenge'

export type DocumentPortal = 'admin' | 'approver'

function unwrapDocuments(data: unknown): PendingDocumentItem[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.items ?? payload.documents ?? payload.data
  return Array.isArray(list) ? (list as PendingDocumentItem[]) : []
}

export function useChallengePendingDocuments(options: {
  portal: DocumentPortal
  challengeId?: string
  page?: number
  limit?: number
  enabled?: boolean
}) {
  const { portal, challengeId, page = 1, limit = 20, enabled = true } = options
  const [documents, setDocuments] = useState<PendingDocumentItem[]>([])
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!enabled) return
    try {
      setLoading(true)
      setError(null)
      let response
      if (portal === 'admin') {
        response = challengeId
          ? await apiClient.getChallengePendingDocuments(challengeId, { page, limit })
          : await apiClient.getAdminPendingDocuments({ page, limit })
      } else {
        response = challengeId
          ? await apiClient.getApproverChallengePendingDocuments(challengeId, { page, limit })
          : await apiClient.getApproverPendingDocuments({ page, limit })
      }
      if (response.success && response.data) {
        setDocuments(unwrapDocuments(response.data))
        setPagination(normalizePagination(response.data, limit))
      } else {
        setError(response.error ?? 'Failed to load pending documents')
        setDocuments([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [portal, challengeId, page, limit, enabled])

  useEffect(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  return { documents, pagination, loading, error, refetch: fetchDocuments }
}
