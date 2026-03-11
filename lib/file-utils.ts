/**
 * File URL Utilities
 * 
 * Handles media URLs from Cloudflare R2 CDN
 * All URLs from the API are already absolute HTTPS URLs pointing to https://media.talentix.net
 * Use URLs directly - no processing needed
 */

/**
 * Gets the media URL - all URLs from API are already complete R2 CDN URLs
 * @param url - Media URL from API (already absolute HTTPS URL)
 * @returns Full URL or null if invalid
 */
export function getFileUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // All URLs from API are already absolute R2 URLs (https://media.talentix.net)
  // Just validate and return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Fallback for relative URLs (should not occur in production with R2)
  // Only used for backward compatibility during migration
  console.warn('Unexpected relative URL detected:', url)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.talentix.net'
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

/**
 * Gets thumbnail URL for a video (if available)
 * @param videoUrl - Video URL or path
 * @returns Thumbnail URL or null
 */
export function getThumbnailUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null
  
  const fileUrl = getFileUrl(videoUrl)
  if (!fileUrl) return null
  
  // Try multiple thumbnail naming conventions
  // 1. Same name with .jpg extension
  const jpgThumbnail = fileUrl.replace(/\.(mp4|mov|avi|webm|mkv|flv)$/i, '.jpg')
  
  // 2. Same name with _thumb.jpg suffix
  const thumbSuffix = fileUrl.replace(/\.(mp4|mov|avi|webm|mkv|flv)$/i, '_thumb.jpg')
  
  // 3. Same name with .png extension
  const pngThumbnail = fileUrl.replace(/\.(mp4|mov|avi|webm|mkv|flv)$/i, '.png')
  
  // Return the first potential thumbnail (you can add validation if needed)
  // For now, return jpg version as it's most common
  return jpgThumbnail
}

/**
 * Gets profile picture URL with fallback
 * @param profilePicture - Profile picture path from API
 * @param fallback - Fallback image path (default: generic placeholder)
 * @returns Full URL to profile picture or fallback
 */
export function getProfilePictureUrl(
  profilePicture: string | null | undefined,
  fallback: string = '/generic-placeholder-graphic.png'
): string {
  if (!profilePicture) return fallback
  
  const fullUrl = getFileUrl(profilePicture)
  return fullUrl || fallback
}

/**
 * Determines file type from URL/path
 * @param fileUrl - File URL or path
 * @returns File type: 'image', 'video', or null
 */
export function getFileType(fileUrl: string | null | undefined): 'image' | 'video' | null {
  if (!fileUrl) return null

  const extension = fileUrl.split('.').pop()?.toLowerCase()
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv']

  if (extension && imageExtensions.includes(extension)) return 'image'
  if (extension && videoExtensions.includes(extension)) return 'video'
  return null
}

/**
 * Returns the best URL for downloading media from a post-like object.
 * Prefers direct video_url / fullUrl over hls_url when available.
 */
export function getBestDownloadUrl(post: {
  video_url?: string | null
  fullUrl?: string | null
  videoUrl?: string | null
  hls_url?: string | null
  thumbnail_url?: string | null
}): string | null {
  const direct = getFileUrl(post.video_url ?? post.fullUrl ?? post.videoUrl)
  if (direct) return direct
  const hls = getFileUrl(post.hls_url)
  if (hls) return hls
  return getFileUrl(post.thumbnail_url)
}

/**
 * Derives a download filename from URL and optional post id/type
 */
export function getDownloadFilename(
  url: string | null | undefined,
  postId?: string,
  type?: 'video' | 'image'
): string {
  const ext = url ? url.split('.').pop()?.split('?')[0]?.toLowerCase() : null
  const base = postId || 'post'
  if (ext && /^(mp4|mov|avi|webm|mkv|flv|jpg|jpeg|png|gif|webp)$/.test(ext)) {
    return `${base}.${ext}`
  }
  if (type === 'image') return `${base}.jpg`
  return `${base}.mp4`
}

/**
 * Triggers download of a media file from URL.
 * Tries fetch + blob first (works with CORS); falls back to opening in new tab.
 */
export async function downloadMediaFile(
  url: string | null | undefined,
  filename: string
): Promise<boolean> {
  const resolved = getFileUrl(url)
  if (!resolved) return false

  try {
    const res = await fetch(resolved, { mode: 'cors' })
    if (!res.ok) throw new Error('Fetch failed')
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
    return true
  } catch {
    const a = document.createElement('a')
    a.href = resolved
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  }
}

