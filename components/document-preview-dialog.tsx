'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'

type PreviewKind = 'pdf' | 'image' | 'download-only'

/** Signed download links live for 600s unless the API says otherwise. */
const DEFAULT_EXPIRY_SECONDS = 600

function detectKind(mime?: string | null, fileName?: string | null): PreviewKind {
  const type = (mime ?? '').toLowerCase()
  if (type === 'application/pdf') return 'pdf'
  if (type.startsWith('image/')) return 'image'

  const ext = (fileName ?? '').split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image'
  return 'download-only'
}

/**
 * Reviews a participant's document without leaving the queue. The signed URL is
 * fetched into a blob so it can render inline even though the CDN serves it with
 * `Content-Disposition: attachment`; if that fetch is blocked we fall back to a
 * plain download.
 */
export function DocumentPreviewDialog({
  open,
  onOpenChange,
  url,
  fileName,
  mimeType,
  expiresIn,
  onRefreshUrl,
  title = 'Document preview',
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url?: string | null
  fileName?: string | null
  mimeType?: string | null
  expiresIn?: number | null
  onRefreshUrl?: () => void | Promise<void>
  title?: string
  description?: string | null
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inlineBlocked, setInlineBlocked] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  const kind = useMemo(() => detectKind(mimeType, fileName), [mimeType, fileName])
  const expired = secondsLeft != null && secondsLeft <= 0

  const releaseBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setBlobUrl(null)
  }, [])

  useEffect(() => {
    if (!open || !url) return

    setSecondsLeft(expiresIn ?? DEFAULT_EXPIRY_SECONDS)
    setInlineBlocked(false)

    if (kind === 'download-only') return

    let cancelled = false
    setLoading(true)

    fetch(url, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const objectUrl = URL.createObjectURL(blob)
        blobUrlRef.current = objectUrl
        setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setInlineBlocked(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      releaseBlob()
    }
  }, [open, url, kind, expiresIn, releaseBlob])

  useEffect(() => {
    if (!open || secondsLeft == null || secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current == null ? null : Math.max(0, current - 1)))
    }, 1000)
    return () => clearInterval(timer)
  }, [open, secondsLeft])

  const handleRefresh = async () => {
    if (!onRefreshUrl) return
    setRefreshing(true)
    try {
      releaseBlob()
      await onRefreshUrl()
    } finally {
      setRefreshing(false)
    }
  }

  const handleDownload = () => {
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = blobUrl ?? url
    anchor.download = fileName || 'document'
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  let body: React.ReactNode

  if (!url) {
    body = (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No download link on this record. Refresh the queue to request a new one.
        </AlertDescription>
      </Alert>
    )
  } else if (expired) {
    body = (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          The download link has expired. Refresh to get a new one.
        </AlertDescription>
      </Alert>
    )
  } else if (loading) {
    body = (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading document…
      </div>
    )
  } else if (kind === 'download-only' || inlineBlocked) {
    body = (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border bg-muted/30 p-6 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">{fileName || 'Document'}</p>
          <p className="text-sm text-muted-foreground">
            {kind === 'download-only'
              ? 'This file type cannot be previewed in the browser.'
              : 'Inline preview is unavailable for this link.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
      </div>
    )
  } else if (kind === 'pdf') {
    body = (
      <iframe
        src={blobUrl ?? url}
        title={fileName || 'Document preview'}
        className="h-[70vh] w-full rounded-lg border bg-muted/20"
      />
    )
  } else {
    body = (
      <div className="flex max-h-[70vh] justify-center overflow-auto rounded-lg border bg-muted/20 p-2">
        <img
          src={blobUrl ?? url}
          alt={fileName || 'Document'}
          className="max-h-[68vh] w-auto object-contain"
          onError={() => setInlineBlocked(true)}
        />
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) releaseBlob()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName || title}</DialogTitle>
          <DialogDescription>
            {description ||
              (secondsLeft != null && !expired
                ? `Link valid for ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s.`
                : 'Review the submitted document.')}
          </DialogDescription>
        </DialogHeader>

        {body}

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            {onRefreshUrl ? (
              <Button variant="outline" onClick={() => void handleRefresh()} disabled={refreshing}>
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh link
              </Button>
            ) : null}
            {url && !expired ? (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            ) : null}
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
