'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PostMediaPlayer } from '@/components/media/post-media-player'
import { MediaProcessingNotice } from '@/components/media/media-processing-notice'
import { resolvePlayback } from '@/lib/media'
import type { MediaSource } from '@/lib/types/media'

/** Modal viewer used wherever a reviewer opens media full-size. */
export function PostMediaDialog({
  source,
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  source: MediaSource | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string | null
  description?: string | null
  children?: React.ReactNode
}) {
  const playback = resolvePlayback(source)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="line-clamp-2">{title || 'Media preview'}</DialogTitle>
          <DialogDescription>
            {description ||
              (playback.processingStatusLabel
                ? `Processing: ${playback.processingStatusLabel}`
                : 'Review the submitted media before deciding.')}
          </DialogDescription>
        </DialogHeader>

        <PostMediaPlayer source={source} title={title} autoPlay className="rounded-lg" />

        <MediaProcessingNotice source={source} />

        {children}
      </DialogContent>
    </Dialog>
  )
}
