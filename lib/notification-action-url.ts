/**
 * Maps backend notification actionUrl (e.g. /admin/posts/<id>) to frontend dashboard routes.
 * The backend uses /admin/* paths; the admin portal uses /dashboard/*.
 */
export function toDashboardActionUrl(actionUrl: string | null | undefined): string | null {
  if (!actionUrl || typeof actionUrl !== 'string') return null
  const path = actionUrl.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '')
  // /admin/posts/<id> or /admin/posts/<id>/... -> /dashboard/content/<id>
  const postsMatch = path.match(/^\/admin\/posts\/([^/]+)/)
  if (postsMatch) return `/dashboard/content/${postsMatch[1]}`
  // /admin/users/<id> -> /dashboard/users/<id>
  const usersMatch = path.match(/^\/admin\/users\/([^/]+)/)
  if (usersMatch) return `/dashboard/users/${usersMatch[1]}`
  // /admin/support/... or /support/... with id -> /dashboard/support/<id>
  const supportMatch = path.match(/\/(?:admin\/)?support(?:\/issues)?\/([^/]+)/)
  if (supportMatch) return `/dashboard/support/${supportMatch[1]}`
  // /admin/appeals/<id> or similar -> /dashboard/appeals (list; detail by id if needed)
  if (path.startsWith('/admin/appeals')) return '/dashboard/appeals'
  // /admin/reports -> /dashboard/reports
  if (path.startsWith('/admin/reports')) return '/dashboard/reports'
  // Already a dashboard path
  if (path.startsWith('/dashboard/')) return path
  return null
}
