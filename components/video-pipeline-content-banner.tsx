'use client'

import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useContentManagementStats } from '@/hooks/use-content-management-stats'
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export function VideoPipelineContentBanner() {
  const { stats, loading } = useContentManagementStats()
  const pipeline = stats?.videoPipeline

  if (loading && !pipeline) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Loading video pipeline status…</AlertDescription>
      </Alert>
    )
  }

  if (!pipeline) return null

  const needsAttention = pipeline.needsAttention ?? 0
  const recoverable = pipeline.recoverableWithSource ?? 0
  const failed = pipeline.byStatus?.failed ?? 0

  if (needsAttention === 0) {
    return (
      <Alert className="border-green-200/60 bg-green-50/50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-700" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>Video pipeline is healthy — no items need attention.</span>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <Link href="/dashboard/system">Video Processing</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span>
          <strong>{needsAttention}</strong> video(s) need attention ({failed} failed, {recoverable}{' '}
          recoverable). Run recovery from the Video Processing page after Redis/processor is healthy.
        </span>
        <Button size="sm" variant="secondary" asChild>
          <Link href="/dashboard/system">
            Open Video Processing
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
