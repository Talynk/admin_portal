/**
 * The API uses two success envelopes: `{ success: true }` on the approver
 * invitation endpoints and `{ status: 'success' }' elsewhere. Some controllers
 * send both. Treat either as success.
 */
export interface ApiEnvelope {
  success?: boolean
  status?: string
  message?: string
  error?: string
  code?: string
  data?: unknown
}

export function isOk(response: ApiEnvelope | null | undefined): boolean {
  if (!response) return false
  if (response.success === true) return true
  if (response.success === false) return false
  return response.status === 'success'
}

/** Prefers the server's human-readable message over a generic fallback. */
export function getMessage(
  response: ApiEnvelope | null | undefined,
  fallback: string
): string {
  if (!response) return fallback
  return response.message || response.error || fallback
}

/** Reads a field from the `data` block that errors also carry. */
export function getErrorData<T = unknown>(
  response: ApiEnvelope | null | undefined,
  key: string
): T | undefined {
  const data = response?.data
  if (!data || typeof data !== 'object') return undefined
  return (data as Record<string, T>)[key]
}
