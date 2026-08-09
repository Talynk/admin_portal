export type StreamType = 'hls' | 'raw'

export type MediaKind = 'video' | 'image' | 'text'

export type ProcessingStatus =
  | 'uploading'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

/**
 * Playback fields resolved server-side by the API.
 * Present on every admin/approver endpoint that returns posts.
 */
export interface PostPlaybackFields {
  fullUrl?: string | null
  hlsUrl?: string | null
  rawUrl?: string | null
  streamType?: StreamType | null
  posterUrl?: string | null
  mediaKind?: MediaKind | null
  playable?: boolean
  hlsReady?: boolean
  processingStatus?: ProcessingStatus | string | null
  processingStatusLabel?: string | null
  processing_error?: string | null
}

/** Legacy fields still returned by some endpoints, used as a fallback. */
export interface LegacyMediaFields {
  video_url?: string | null
  videoUrl?: string | null
  hls_url?: string | null
  thumbnail_url?: string | null
  type?: string | null
  fileType?: string | null
  processing_status?: string | null
}

export type MediaSource = PostPlaybackFields & LegacyMediaFields

/** Normalized playback descriptor consumed by the shared media components. */
export interface ResolvedPlayback {
  kind: MediaKind
  /** URL to play or display. Null when there is nothing to render. */
  url: string | null
  /** HLS master playlist when ready. */
  hlsUrl: string | null
  /** Original upload, used as the fallback when HLS cannot be fetched. */
  rawUrl: string | null
  streamType: StreamType | null
  /** Poster image. Omit the attribute entirely when this is null. */
  posterUrl: string | null
  playable: boolean
  processingStatus: string | null
  processingStatusLabel: string | null
  processingError: string | null
}
