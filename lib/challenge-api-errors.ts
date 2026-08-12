export type ChallengeApiErrorResponse = {
  error?: string
  message?: string
  code?: string
  /** Errors carry `code` / `message` here; success payloads carry anything. */
  data?: unknown
}

function readDataField(
  response: ChallengeApiErrorResponse,
  key: 'code' | 'message'
): string | undefined {
  const data = response.data
  if (!data || typeof data !== 'object') return undefined
  const value = (data as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

export function getChallengeApiErrorCode(
  response: ChallengeApiErrorResponse
): string | undefined {
  return response.code ?? readDataField(response, 'code')
}

/** True when the item was already handled by another reviewer. */
export function isStaleQueueItemError(response: ChallengeApiErrorResponse): boolean {
  const code = getChallengeApiErrorCode(response)
  if (code === 'DOCUMENT_NOT_PENDING') return true

  const msg = (
    response.message ??
    readDataField(response, 'message') ??
    response.error ??
    ''
  ).toLowerCase()

  return (
    msg.includes('already processed') ||
    msg.includes('already been used') ||
    msg.includes('not found or already')
  )
}

/** Map known challenge API error codes to user-facing messages. */
export function getChallengeApiErrorMessage(
  response: ChallengeApiErrorResponse,
  fallback = 'Request failed'
): string {
  const code = getChallengeApiErrorCode(response)
  const msg = response.message ?? readDataField(response, 'message') ?? response.error

  switch (code) {
    case 'OPEN_CANNOT_REQUIRE_DOCUMENT':
      return 'Cannot set open mode while this challenge requires participant documents.'
    case 'DOCUMENT_NOT_PENDING':
      return 'Someone already reviewed this document. The queue has been refreshed.'
    case 'DOCUMENT_NOT_REQUIRED':
      return 'This challenge does not require participant documents.'
    default:
      if (isStaleQueueItemError(response)) {
        return 'Someone already reviewed this post. The queue has been refreshed.'
      }
      return msg || fallback
  }
}
