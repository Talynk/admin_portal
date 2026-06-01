'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FailStaleUploadsResponse, RecoverAllResponse, ReconcileResponse, RequeueResponse } from '@/lib/types/video-pipeline'
import { VideoPipelineStatsCards } from '@/components/video-pipeline-stats-cards'

type RecoveryResult =
  | { kind: 'recover-all'; data: RecoverAllResponse }
  | { kind: 'reconcile'; data: ReconcileResponse }
  | { kind: 'requeue'; data: RequeueResponse }
  | { kind: 'fail-stale'; data: FailStaleUploadsResponse }

export function VideoPipelineRecoveryDialog({
  open,
  onOpenChange,
  result,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: RecoveryResult | null
  title?: string
}) {
  if (!result) return null

  const isDryRun = result.data.dryRun
  const message =
    result.kind === 'recover-all'
      ? result.data.message
      : result.kind === 'fail-stale'
        ? result.data.message
        : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title ?? 'Recovery result'}
            {isDryRun ? (
              <Badge variant="outline" className="font-normal">
                Preview only
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Applied</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {message ?? (isDryRun ? 'No changes were made to the database.' : 'Changes have been applied.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {result.kind === 'recover-all' && (
            <>
              <section className="space-y-2">
                <h4 className="font-medium">Reconcile from CDN</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>Scanned: {result.data.reconcile.scanned}</li>
                  <li>Matched on CDN: {result.data.reconcile.matched}</li>
                  {!isDryRun && result.data.reconcile.updatedIds.length > 0 ? (
                    <li>Updated: {result.data.reconcile.updatedIds.length} post(s)</li>
                  ) : null}
                  {result.data.reconcile.preview.length > 0 ? (
                    <li className="pt-1">
                      Preview ({result.data.reconcile.preview.length}):
                      <ul className="list-disc pl-5 mt-1 max-h-24 overflow-y-auto">
                        {result.data.reconcile.preview.slice(0, 10).map((p) => (
                          <li key={p.postId}>
                            {p.postId.slice(0, 8)}… → {p.previousStatus}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : null}
                </ul>
              </section>
              <section className="space-y-2">
                <h4 className="font-medium">Requeue jobs</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>Scanned: {result.data.requeue.scanned}</li>
                  <li>
                    Enqueued:{' '}
                    {isDryRun
                      ? result.data.requeue.enqueued.filter((e) => e.wouldEnqueue).length ||
                        result.data.requeue.enqueued.length
                      : result.data.requeue.enqueued.length}
                  </li>
                  {(result.data.requeue.skippedHlsAlreadyOnCdn?.length ?? 0) > 0 ? (
                    <li>Skipped (HLS on CDN): {result.data.requeue.skippedHlsAlreadyOnCdn!.length}</li>
                  ) : null}
                  {(result.data.requeue.skippedJobInQueue?.length ?? 0) > 0 ? (
                    <li>Skipped (already queued): {result.data.requeue.skippedJobInQueue!.length}</li>
                  ) : null}
                  {result.data.requeue.errors.length > 0 ? (
                    <li className="text-destructive pt-1">
                      Errors ({result.data.requeue.errors.length}):
                      <ul className="list-disc pl-5 mt-1 max-h-32 overflow-y-auto">
                        {result.data.requeue.errors.map((e) => (
                          <li key={e.postId}>
                            {e.postId.slice(0, 8)}…: {e.error}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : null}
                </ul>
              </section>
              {result.data.statsAfter ? (
                <section className="space-y-2 pt-2 border-t">
                  <h4 className="font-medium">Stats after</h4>
                  <VideoPipelineStatsCards stats={result.data.statsAfter} />
                </section>
              ) : null}
            </>
          )}

          {result.kind === 'reconcile' && (
            <ul className="text-muted-foreground space-y-1">
              <li>Scanned: {result.data.scanned}</li>
              <li>Matched: {result.data.matched}</li>
              {!isDryRun ? <li>Updated: {result.data.updatedIds.length}</li> : null}
              {result.data.preview.length > 0 ? (
                <li className="pt-1 max-h-40 overflow-y-auto">
                  Preview: {result.data.preview.map((p) => p.postId.slice(0, 8)).join(', ')}
                </li>
              ) : null}
            </ul>
          )}

          {result.kind === 'requeue' && (
            <ul className="text-muted-foreground space-y-1">
              <li>Scanned: {result.data.scanned}</li>
              <li>Enqueued: {result.data.enqueued.length}</li>
              {result.data.errors.length > 0 ? (
                <li className="text-destructive">
                  Errors: {result.data.errors.map((e) => `${e.postId.slice(0, 8)}: ${e.error}`).join('; ')}
                </li>
              ) : null}
            </ul>
          )}

          {result.kind === 'fail-stale' && (
            <ul className="text-muted-foreground space-y-1">
              {result.data.scanned != null ? <li>Scanned: {result.data.scanned}</li> : null}
              {result.data.failed != null ? <li>Marked failed: {result.data.failed}</li> : null}
              {(result.data.updatedIds?.length ?? 0) > 0 ? (
                <li>Updated IDs: {result.data.updatedIds!.length}</li>
              ) : null}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
