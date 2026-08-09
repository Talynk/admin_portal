'use client'

import { useState } from 'react'
import { Eye, Image as ImageIcon, Play, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { resolvePlayback } from '@/lib/media'
import type { MediaSource } from '@/lib/types/media'
import { cn } from '@/lib/utils'

/**
 * Poster tile with a hover play overlay. Falls back to a type icon whenever the
 * poster is missing or fails to load, so a broken thumbnail never leaves an
 * empty box in a grid or table.
 */
export function PostMediaThumbnail({
  source,
  title,
  className,
  onPlay,
  onDetails,
  duration,
  compact = false,
}: {
  source: MediaSource | null | undefined
  title?: string | null
  className?: string
  onPlay?: () => void
  onDetails?: () => void
  duration?: string | null
  compact?: boolean
}) {
  const playback = resolvePlayback(source)
  const [posterFailed, setPosterFailed] = useState(false)

  const Icon = playback.kind === 'image' ? ImageIcon : Video
  const showPoster = !!playback.posterUrl && !posterFailed

  return (
    <div
      className={cn(
        'group relative overflow-hidden bg-muted/50 dark:bg-muted/20',
        compact ? 'h-14 w-20 rounded' : 'aspect-video w-full rounded-t-lg',
        className
      )}
    >
      {showPoster ? (
        <img
          src={playback.posterUrl!}
          alt={title || 'Post media'}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setPosterFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
          <div
            className={cn(
              'rounded-full bg-background/80 shadow-sm',
              compact ? 'p-1.5' : 'p-4'
            )}
          >
            <Icon className={cn('text-muted-foreground', compact ? 'h-3 w-3' : 'h-8 w-8')} />
          </div>
          {!compact ? (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {playback.kind === 'image' ? 'Image' : 'Video'}
            </span>
          ) : null}
        </div>
      )}

      {duration && !compact ? (
        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white hover:bg-black/70">
          {duration}
        </Badge>
      ) : null}

      {playback.kind === 'video' && !playback.playable && playback.processingStatusLabel ? (
        <Badge className="absolute left-2 top-2 bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/60 dark:text-amber-100">
          {playback.processingStatusLabel}
        </Badge>
      ) : null}

      {(onPlay || onDetails) && !compact ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {onDetails ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDetails()
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Details
            </Button>
          ) : null}
          {onPlay && playback.url ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPlay()
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              {playback.kind === 'image' ? 'View' : 'Play'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {onPlay && compact ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-5 w-5 text-white drop-shadow" />
        </div>
      ) : null}
    </div>
  )
}
