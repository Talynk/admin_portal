import { getFileUrl, getThumbnailUrl } from '@/lib/file-utils'
import type {
  MediaKind,
  MediaSource,
  ResolvedPlayback,
  StreamType,
} from '@/lib/types/media'

const PROCESSING_LABELS: Record<string, string> = {
  uploading: 'Uploading',
  pending: 'Waiting in queue',
  processing: 'Processing',
  completed: 'Ready',
  failed: 'Processing failed',
}

/** Statuses where the bytes are not in storage yet, so nothing can play. */
const NOT_YET_PLAYABLE = new Set(['uploading'])

function isHlsUrl(url: string | null): boolean {
  return !!url && url.split('?')[0].toLowerCase().endsWith('.m3u8')
}

function inferKind(source: MediaSource, url: string | null): MediaKind {
  const declared = source.mediaKind
  if (declared === 'video' || declared === 'image' || declared === 'text') {
    return declared
  }

  const legacyType = (source.type ?? source.fileType ?? '').toString().toLowerCase()
  if (legacyType === 'video' || legacyType === 'image' || legacyType === 'text') {
    return legacyType as MediaKind
  }

  if (isHlsUrl(url)) return 'video'
  const path = (url ?? '').split('?')[0].toLowerCase()
  if (/\.(mp4|mov|avi|webm|mkv|flv)$/.test(path)) return 'video'
  if (/\.(jpg|jpeg|png|gif|webp|svg|avif)$/.test(path)) return 'image'
  return url ? 'video' : 'text'
}

/**
 * Normalizes the API's resolved playback fields, falling back to the legacy
 * `video_url` / `hls_url` / `thumbnail_url` trio for endpoints that have not
 * been migrated yet.
 */
export function resolvePlayback(source: MediaSource | null | undefined): ResolvedPlayback {
  if (!source) {
    return {
      kind: 'text',
      url: null,
      hlsUrl: null,
      rawUrl: null,
      streamType: null,
      posterUrl: null,
      playable: false,
      processingStatus: null,
      processingStatusLabel: null,
      processingError: null,
    }
  }

  const hlsUrl = getFileUrl(source.hlsUrl ?? source.hls_url)
  const rawUrl = getFileUrl(source.rawUrl ?? source.video_url ?? source.videoUrl)
  const url = getFileUrl(source.fullUrl) ?? hlsUrl ?? rawUrl

  const kind = inferKind(source, url)

  const streamType: StreamType | null =
    source.streamType === 'hls' || source.streamType === 'raw'
      ? source.streamType
      : kind === 'video' && url
        ? isHlsUrl(url)
          ? 'hls'
          : 'raw'
        : null

  const processingStatus =
    (source.processingStatus ?? source.processing_status ?? null) as string | null

  const posterUrl =
    getFileUrl(source.posterUrl) ??
    getFileUrl(source.thumbnail_url) ??
    (kind === 'image' ? url : getThumbnailUrl(rawUrl))

  const playable =
    typeof source.playable === 'boolean'
      ? source.playable
      : kind === 'text'
        ? false
        : !!url && !(processingStatus && NOT_YET_PLAYABLE.has(processingStatus))

  const processingStatusLabel =
    source.processingStatusLabel ??
    (processingStatus ? PROCESSING_LABELS[processingStatus] ?? null : null)

  return {
    kind,
    url,
    hlsUrl,
    rawUrl,
    streamType,
    posterUrl: kind === 'image' ? url : posterUrl,
    playable,
    processingStatus,
    processingStatusLabel,
    processingError: source.processing_error ?? null,
  }
}

/** Human label for why media cannot be played right now. */
export function getUnplayableLabel(playback: ResolvedPlayback): string {
  if (playback.kind === 'text') return 'Text post — no media'
  if (!playback.url) return 'No media available'
  return playback.processingStatusLabel ?? 'Not available yet'
}
