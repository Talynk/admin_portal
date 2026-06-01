'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VideoProcessingStatusBadge } from '@/components/video-processing-status-badge'
import { toast } from '@/hooks/use-toast'
import type { Post } from '@/hooks/use-posts'
import { Copy, Check, ExternalLink } from 'lucide-react'

function CopyUrlButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast({ title: 'Copied', description: `${label} copied to clipboard.` })
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }
  return (
    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => void copy()}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function UrlRow({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) {
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">{label}:</span> <span className="text-muted-foreground">N/A</span>
      </div>
    )
  }
  return (
    <div className="text-sm flex items-start gap-1 min-w-0">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="break-all flex-1">{url}</span>
      <CopyUrlButton value={url} label={label} />
    </div>
  )
}

export function PostVideoProcessingCard({ post }: { post: Post }) {
  const isVideo = post.type === 'video' || post.fileType === 'video'
  const hasProcessing = post.processing_status != null

  if (!isVideo && !hasProcessing) return null

  const pipelineHref =
    post.processing_status === 'failed'
      ? '/dashboard/system?status=failed'
      : '/dashboard/system'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          Video processing
          <Button variant="outline" size="sm" asChild>
            <Link href={pipelineHref}>
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Open in Video Processing
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <VideoProcessingStatusBadge status={post.processing_status} />
          {post.recoverable === true ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Recoverable</Badge>
          ) : post.recoverable === false ? (
            <Badge variant="secondary">Not recoverable</Badge>
          ) : null}
          {post.has_source_video === true ? (
            <Badge variant="outline">Has source video</Badge>
          ) : post.has_source_video === false ? (
            <Badge variant="outline" className="text-muted-foreground">
              No source video
            </Badge>
          ) : null}
        </div>
        {post.processing_error ? (
          <p className="text-destructive whitespace-pre-wrap">{post.processing_error}</p>
        ) : null}
        <UrlRow label="Source (video_url)" url={post.video_url} />
        <UrlRow label="HLS (hls_url)" url={post.hls_url} />
      </CardContent>
    </Card>
  )
}
