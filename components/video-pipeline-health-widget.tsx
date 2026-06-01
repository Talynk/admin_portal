'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowRight, Loader2, Server } from 'lucide-react'
import { useVideoPipelineStats } from '@/hooks/use-video-pipeline-stats'
import { cn } from '@/lib/utils'

export function VideoPipelineHealthWidget({ className }: { className?: string }) {
  const { stats, loading, error } = useVideoPipelineStats()

  const needsAttention = stats?.needsAttention ?? 0
  const recoverable = stats?.recoverableWithSource ?? 0
  const failed = stats?.byStatus?.failed ?? 0
  const inPipeline = stats?.inPipeline ?? 0

  return (
    <Card
      className={cn(
        needsAttention > 0 ? 'border-destructive/40 bg-destructive/5' : undefined,
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Video pipeline health
            {needsAttention > 0 ? (
              <Badge variant="destructive" className="font-normal">
                {needsAttention} need attention
              </Badge>
            ) : !loading && stats ? (
              <Badge variant="outline" className="font-normal text-green-700 border-green-300">
                Healthy
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>Upload / transcode monitor — refreshes every 60s</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/system">
            Open
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !stats ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pipeline stats…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Needs attention</p>
              <p className={cn('text-xl font-bold', needsAttention > 0 && 'text-destructive')}>
                {needsAttention}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Recoverable</p>
              <p className="text-xl font-bold">{recoverable}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Failed</p>
              <p className="text-xl font-bold">{failed}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">In pipeline</p>
              <p className="text-xl font-bold">{inPipeline}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
