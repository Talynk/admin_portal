/**
 * File URL Utilities
 * 
 * Converts relative file paths from the API to full URLs
 * Files are stored on the server in /uploads/ directory
 */

// Get API base URL from environment or use default
// Files are served from the server root at /uploads/, not from /api
// So we need the base server URL without the /api suffix
const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  
  // Default to the documented server URL
  if (!envUrl) return 'https://talynkbackend-8fkrb.sevalla.app'
  
  // If URL contains /api, remove it since files are served from root
  if (envUrl.includes('/api')) {
    return envUrl.replace('/api', '')
  }
  
  // If it's already a base URL, use it
  return envUrl
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Converts a relative file path to a full URL
 * @param relativePath - Relative path from API (e.g., "/uploads/filename.mp4")
 * @returns Full URL or null if path is invalid
 */
export function getFileUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null
  
  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }
  
  // If it's a relative path starting with /uploads/, prepend API base URL
  if (relativePath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${relativePath}`
  }
  
  // If it doesn't start with /uploads/, add it
  if (relativePath.startsWith('uploads/')) {
    return `${API_BASE_URL}/${relativePath}`
  }
  
  // If it's just a filename, add the /uploads/ prefix
  return `${API_BASE_URL}/uploads/${relativePath}`
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
  
  // Thumbnails are typically stored with same name but .jpg extension
  // Adjust based on your actual thumbnail naming convention
  return fileUrl.replace(/\.(mp4|mov|avi|webm|mkv|flv)$/i, '.jpg')
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

