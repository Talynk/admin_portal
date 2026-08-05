/** Map known challenge API error codes to user-facing messages. */
export function getChallengeApiErrorMessage(
  response: { error?: string; message?: string; code?: string; data?: { code?: string; message?: string } },
  fallback = 'Request failed'
): string {
  const code =
    response.code ??
    (response.data && typeof response.data === 'object' ? response.data.code : undefined)
  const msg =
    response.message ??
    (response.data && typeof response.data === 'object' ? response.data.message : undefined) ??
    response.error

  switch (code) {
    case 'OPEN_CANNOT_REQUIRE_DOCUMENT':
      return 'Cannot set open mode while this challenge requires participant documents.'
    case 'DOCUMENT_NOT_PENDING':
      return 'This document is no longer pending review.'
    case 'DOCUMENT_NOT_REQUIRED':
      return 'This challenge does not require participant documents.'
    default:
      return msg || fallback
  }
}
