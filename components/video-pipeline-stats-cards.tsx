import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Loader2, Server, Upload, Wrench } from 'lucide-react'
import type { VideoPipelineStats } from '@/lib/types/video-pipeline'
import { cn } from '@/lib/utils'

export function VideoPipelineStatsCards({
  stats,
  loading,
  className,
}: {
  stats: VideoPipelineStats | null
  loading?: boolean
  className?: string
}) {
  const needsAttention = stats?.needsAttention ?? 0
  const recoverable = stats?.recoverableWithSource ?? 0
  const failed = stats?.byStatus?.failed ?? 0
  const inPipeline = stats?.inPipeline ?? 0
  const uploadingWithoutSource = stats?.uploadingWithoutSource ?? 0

  const cards = [
    {
      title: 'Needs attention',
      value: loading ? '—' : needsAttention,
      hint: 'Failed + stuck pipeline items',
      icon: AlertTriangle,
      accent: needsAttention > 0 ? 'text-destructive' : 'text-muted-foreground',
      border: needsAttention > 0 ? 'border-destructive/40 bg-destructive/5' : undefined,
    },
    {
      title: 'Recoverable',
      value: loading ? '—' : recoverable,
      hint: 'Has source video — can requeue',
      icon: Wrench,
      accent: recoverable > 0 ? 'text-amber-600' : 'text-muted-foreground',
    },
    {
      title: 'Failed',
      value: loading ? '—' : failed,
      hint: 'Transcode / queue errors',
      icon: Server,
      accent: failed > 0 ? 'text-red-600' : 'text-muted-foreground',
    },
    {
      title: 'In pipeline',
      value: loading ? '—' : inPipeline,
      hint: 'Uploading + pending + processing + failed',
      icon: Loader2,
      accent: 'text-muted-foreground',
    },
    {
      title: 'Uploading (no file)',
      value: loading ? '—' : uploadingWithoutSource,
      hint: 'Abandoned uploads — cleanup only',
      icon: Upload,
      accent: 'text-muted-foreground',
    },
  ]

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-5', className)}>
      {cards.map((card) => (
        <Card key={card.title} className={card.border}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={cn('h-4 w-4', card.accent)} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', card.accent)}>{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
      {!loading && stats && needsAttention === 0 && inPipeline === 0 ? (
        <div className="md:col-span-2 lg:col-span-5 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Pipeline is healthy — no items need attention.
        </div>
      ) : null}
    </div>
  )
}
