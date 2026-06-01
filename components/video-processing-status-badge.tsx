import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import type { VideoProcessingStatus } from '@/lib/types/video-pipeline'

export function VideoProcessingStatusBadge({
  status,
  showSpinner = true,
}: {
  status?: VideoProcessingStatus | string | null
  showSpinner?: boolean
}) {
  const value = status ?? 'unknown'

  switch (value) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1 w-fit">
          {showSpinner ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Pending
        </Badge>
      )
    case 'processing':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1 w-fit">
          {showSpinner ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Processing
        </Badge>
      )
    case 'uploading':
      return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Uploading</Badge>
    case 'failed':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
    default:
      return <Badge variant="secondary">{value || '—'}</Badge>
  }
}
