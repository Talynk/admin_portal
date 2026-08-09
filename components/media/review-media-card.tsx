'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostMediaPlayer } from '@/components/media/post-media-player'
import { PostMediaThumbnail } from '@/components/media/post-media-thumbnail'
import type { MediaSource } from '@/lib/types/media'

/**
 * Card header media for review queues: a poster tile that swaps to an inline
 * player on demand, so a reviewer can watch without leaving the list.
 */
export function ReviewMediaCard({
  source,
  title,
  onDetails,
  duration,
}: {
  source: MediaSource | null | undefined
  title?: string | null
  onDetails?: () => void
  duration?: string | null
}) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="relative">
        <PostMediaPlayer
          source={source}
          title={title}
          autoPlay
          className="rounded-t-lg rounded-b-none"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-2 z-10 h-8 w-8 border border-white/20 bg-black/70 text-white hover:bg-black/90"
          onClick={(e) => {
            e.stopPropagation()
            setPlaying(false)
          }}
          aria-label="Close media"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <PostMediaThumbnail
      source={source}
      title={title}
      duration={duration}
      onPlay={() => setPlaying(true)}
      onDetails={onDetails}
    />
  )
}
