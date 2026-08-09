'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, FileText, Image as ImageIcon, Loader2, Video } from 'lucide-react'
import { resolvePlayback, getUnplayableLabel } from '@/lib/media'
import type { MediaSource, ResolvedPlayback } from '@/lib/types/media'
import { cn } from '@/lib/utils'

function MediaPlaceholder({
  label,
  detail,
  icon: Icon = Video,
}: {
  label: string
  detail?: string | null
  icon?: typeof Video
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="rounded-full bg-background/80 p-4 shadow-sm">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {detail ? (
        <p className="max-w-sm text-xs text-destructive dark:text-red-300">{detail}</p>
      ) : null}
    </div>
  )
}

function VideoSurface({
  playback,
  autoPlay,
  className,
}: {
  playback: ResolvedPlayback
  autoPlay?: boolean
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const { url, rawUrl, streamType } = playback

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    setLoading(true)
    setFailed(false)

    let destroyed = false
    let cleanup: (() => void) | undefined

    const playNatively = (src: string) => {
      video.src = src
    }

    // Safari plays .m3u8 natively; every other browser needs hls.js, which
    // fetches the playlist over XHR and is therefore CORS-checked.
    const needsHlsJs =
      streamType === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')

    if (!needsHlsJs) {
      playNatively(url)
      return
    }

    void import('hls.js')
      .then(({ default: Hls }) => {
        if (destroyed) return

        if (!Hls.isSupported()) {
          playNatively(rawUrl ?? url)
          return
        }

        const hls = new Hls({ enableWorker: true })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return
          hls.destroy()
          if (rawUrl) {
            // Playlist unreachable (commonly the media bucket CORS rule) —
            // degrade to the original MP4, which needs no CORS.
            playNatively(rawUrl)
          } else {
            setFailed(true)
            setLoading(false)
          }
        })

        cleanup = () => hls.destroy()
      })
      .catch(() => {
        if (!destroyed) playNatively(rawUrl ?? url)
      })

    return () => {
      destroyed = true
      cleanup?.()
    }
  }, [url, rawUrl, streamType])

  if (failed) {
    return (
      <MediaPlaceholder
        label="Playback failed"
        detail="The video stream could not be loaded."
        icon={AlertTriangle}
      />
    )
  }

  return (
    <>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        // Omit poster entirely when null: an empty string makes Chrome fire a
        // bogus request. Never set crossOrigin — it would make the request
        // CORS-checked and break on the CDN.
        {...(playback.posterUrl ? { poster: playback.posterUrl } : {})}
        className={cn('h-full w-full bg-black object-contain', className)}
        onLoadedData={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setFailed(true)
        }}
      />
    </>
  )
}

/**
 * Single playback surface for post media across both portals. Handles HLS,
 * raw MP4 fallback, images, and the pipeline states where nothing can play.
 */
export function PostMediaPlayer({
  source,
  autoPlay,
  className,
  title,
}: {
  source: MediaSource | null | undefined
  autoPlay?: boolean
  className?: string
  title?: string | null
}) {
  const playback = resolvePlayback(source)
  const [imageFailed, setImageFailed] = useState(false)

  let body: React.ReactNode

  if (playback.kind === 'text') {
    body = <MediaPlaceholder label="Text post — no media" icon={FileText} />
  } else if (!playback.url) {
    body = <MediaPlaceholder label="No media available" icon={ImageIcon} />
  } else if (playback.kind === 'image') {
    body = imageFailed ? (
      <MediaPlaceholder label="Image unavailable" icon={ImageIcon} />
    ) : (
      <img
        src={playback.url}
        alt={title || 'Post media'}
        loading="lazy"
        className="h-full w-full bg-black object-contain"
        onError={() => setImageFailed(true)}
      />
    )
  } else if (!playback.playable) {
    body = (
      <MediaPlaceholder
        label={getUnplayableLabel(playback)}
        detail={playback.processingError}
      />
    )
  } else {
    body = <VideoSurface playback={playback} autoPlay={autoPlay} />
  }

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-lg bg-muted/40 dark:bg-muted/20',
        className
      )}
    >
      {body}
    </div>
  )
}
