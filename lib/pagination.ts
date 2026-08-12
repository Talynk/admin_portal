/** Normalized pagination consumed by queue components. */
export interface NormalizedPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type PaginationLike = Record<string, unknown>

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

/**
 * Normalizes the four pagination shapes documented in
 * ADMIN_APPROVER_PORTAL_INTEGRATION.md (A–D) into one structure.
 */
export function normalizePagination(
  data: unknown,
  fallbackLimit = 20
): NormalizedPagination | null {
  if (!data || typeof data !== 'object') return null

  const root = data as PaginationLike
  const payload = (root.data ?? root) as PaginationLike
  const nested = (payload.pagination ?? root.pagination) as PaginationLike | undefined

  const page = readNumber(
    nested?.page ?? nested?.currentPage ?? payload.currentPage ?? payload.page,
    1
  )
  const limit = readNumber(nested?.limit ?? payload.limit, fallbackLimit)
  const total = readNumber(nested?.total ?? nested?.totalCount ?? payload.total, 0)
  const totalPages = readNumber(
    nested?.totalPages ??
      nested?.pages ??
      payload.pages ??
      payload.totalPages ??
      (total > 0 && limit > 0 ? Math.ceil(total / limit) : 1),
    1
  )

  if (total === 0 && totalPages <= 1 && page === 1 && !nested && payload.total == null) {
    return null
  }

  return { page, limit, total, totalPages: Math.max(1, totalPages) }
}
