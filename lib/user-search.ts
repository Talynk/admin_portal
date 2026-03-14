/**
 * Client-side user search utility. Mirrors SEARCHING_USERS_IMPROVED.md:
 * multi-field (username, display_name, email, bio, phone1, phone2, id),
 * multi-term (each term must match at least one field), case-insensitive.
 */

const UUID_REGEX = /^[0-9a-fA-F-]{36}$/

export interface SearchableUser {
  id?: string
  username?: string
  display_name?: string
  fullName?: string
  email?: string
  bio?: string
  phone1?: string | null
  phone2?: string | null
}

/**
 * Normalize query: coerce to string, trim, collapse internal whitespace.
 * Returns null if empty after trim.
 */
export function normalizeQuery(input: unknown): string | null {
  if (input == null) return null
  const s = typeof input === 'string' ? input : String(input)
  const trimmed = s.trim()
  if (trimmed.length === 0) return null
  return trimmed.replace(/\s+/g, ' ')
}

/**
 * Split normalized query by spaces; return non-empty terms.
 */
export function getSearchTerms(query: string | null): string[] {
  if (!query || query.trim().length === 0) return []
  return query.split(/\s+/).filter((t) => t.length > 0)
}

function safeLower(s: string | undefined | null): string {
  if (s == null || typeof s !== 'string') return ''
  return s.toLowerCase()
}

/**
 * Check if a single term matches the user (any of the searchable fields, or exact id if term is UUID).
 */
function termMatchesUser(user: SearchableUser, term: string): boolean {
  const lower = term.toLowerCase()
  const fields = [
    user.username,
    user.display_name,
    user.fullName,
    user.email,
    user.bio,
    user.phone1,
    user.phone2,
  ]
  for (const f of fields) {
    if (f != null && safeLower(f).includes(lower)) return true
  }
  if (UUID_REGEX.test(term.trim()) && user.id) {
    return safeLower(user.id) === lower || user.id === term
  }
  return false
}

/**
 * Returns true if the user matches the search query:
 * - No query / empty → true
 * - Multi-term: every term must match at least one field (AND of OR-blocks).
 * Case-insensitive.
 */
export function userMatchesSearch(
  user: SearchableUser,
  query: string | null | undefined
): boolean {
  const normalized = normalizeQuery(query)
  if (normalized === null) return true
  const terms = getSearchTerms(normalized)
  if (terms.length === 0) return true
  return terms.every((term) => termMatchesUser(user, term))
}
