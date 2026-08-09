'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resolvePlayback } from '@/lib/media'
import type { MediaSource } from '@/lib/types/media'

const MESSAGES: Record<string, string> = {
  uploading: 'The upload has not finished, so there is nothing to play yet.',
  pending: 'Queued for transcoding. The original upload plays in the meantime.',
  processing: 'Transcoding in progress. The original upload plays in the meantime.',
  failed: 'Transcoding failed, so only the original upload is available.',
}

/**
 * Explains why a video is missing, low quality, or stuck — otherwise reviewers
 * read a pipeline delay as a broken post.
 */
export function MediaProcessingNotice({ source }: { source: MediaSource | null | undefined }) {
  const playback = resolvePlayback(source)

  if (playback.kind !== 'video') return null
  if (!playback.processingStatus || playback.processingStatus === 'completed') return null

  const failed = playback.processingStatus === 'failed'
  const message = MESSAGES[playback.processingStatus] ?? playback.processingStatusLabel

  if (!message) return null

  return (
    <Alert variant={failed ? 'destructive' : 'default'}>
      {failed ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      <AlertDescription>
        <span className="font-medium">{playback.processingStatusLabel}.</span> {message}
        {playback.processingError ? ` (${playback.processingError})` : null}
      </AlertDescription>
    </Alert>
  )
}
