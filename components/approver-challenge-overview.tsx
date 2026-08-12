'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { normalizePagination } from '@/lib/pagination'
import type { ChallengeContext, PendingDocumentItem } from '@/lib/types/challenge'
import type { ChallengePendingPost } from '@/lib/types/challenge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2, Trophy } from 'lucide-react'
import { ChallengeModerationBadge } from '@/components/challenge-moderation-badge'

interface ChallengeRow {
  id: string
  name: string
  status: string
  moderation_mode?: string
  requires_document?: boolean
  pendingPosts: number
  pendingDocs: number
}

function unwrapPosts(data: unknown): ChallengePendingPost[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.posts ?? payload.items ?? payload.data
  return Array.isArray(list) ? (list as ChallengePendingPost[]) : []
}

function unwrapDocuments(data: unknown): PendingDocumentItem[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.documents ?? payload.items ?? payload.data
  return Array.isArray(list) ? (list as PendingDocumentItem[]) : []
}

function contextFromPost(post: ChallengePendingPost): ChallengeContext | null {
  return post.challenge_context ?? null
}

export function ApproverChallengeOverview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<ChallengePendingPost[]>([])
  const [documents, setDocuments] = useState<PendingDocumentItem[]>([])
  const [postTotal, setPostTotal] = useState(0)
  const [docTotal, setDocTotal] = useState(0)

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        setError(null)
        const [postsRes, docsRes] = await Promise.all([
          apiClient.getApproverChallengePendingPosts({ page: 1, limit: 100 }),
          apiClient.getApproverPendingDocuments({ page: 1, limit: 100 }),
        ])

        if (postsRes.success && postsRes.data) {
          setPosts(unwrapPosts(postsRes.data))
          setPostTotal(normalizePagination(postsRes.data, 100)?.total ?? unwrapPosts(postsRes.data).length)
        }
        if (docsRes.success && docsRes.data) {
          setDocuments(unwrapDocuments(docsRes.data))
          setDocTotal(normalizePagination(docsRes.data, 100)?.total ?? unwrapDocuments(docsRes.data).length)
        }
        if (!postsRes.success && !docsRes.success) {
          setError(postsRes.error || docsRes.error || 'Failed to load challenges')
        }
      } catch {
        setError('An error occurred')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const rows = useMemo(() => {
    const map = new Map<string, ChallengeRow>()

    for (const post of posts) {
      const ctx = contextFromPost(post)
      if (!ctx?.challenge_id) continue
      const existing = map.get(ctx.challenge_id)
      if (existing) {
        existing.pendingPosts += 1
      } else {
        map.set(ctx.challenge_id, {
          id: ctx.challenge_id,
          name: ctx.challenge_name,
          status: ctx.challenge_status,
          moderation_mode: ctx.moderation_mode,
          requires_document: ctx.requires_document,
          pendingPosts: 1,
          pendingDocs: 0,
        })
      }
    }

    for (const doc of documents) {
      const id = doc.challenge_id
      const existing = map.get(id)
      if (existing) {
        existing.pendingDocs += 1
        if (!existing.name && doc.challenge?.name) existing.name = doc.challenge.name
      } else {
        map.set(id, {
          id,
          name: doc.challenge?.name ?? 'Challenge',
          status: doc.challenge?.status ?? 'active',
          moderation_mode: doc.challenge?.moderation_mode,
          requires_document: doc.challenge?.requires_document,
          pendingPosts: 0,
          pendingDocs: 1,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [posts, documents])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading challenges…
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No challenges with pending work</p>
        <p className="text-sm">
          {postTotal === 0 && docTotal === 0
            ? 'All moderated drafts and documents are cleared.'
            : 'Pending items exist but could not be grouped by challenge.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Derived from pending posts ({postTotal}) and documents ({docTotal}). Select a challenge to
        review its scoped queues.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challenge</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Moderation</TableHead>
              <TableHead className="text-right">Pending posts</TableHead>
              <TableHead className="text-right">Pending docs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/approver/challenges/${row.id}`)}
              >
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="capitalize">{row.status}</TableCell>
                <TableCell>
                  <ChallengeModerationBadge
                    mode={row.moderation_mode}
                    requiresDocument={row.requires_document}
                  />
                </TableCell>
                <TableCell className="text-right">{row.pendingPosts}</TableCell>
                <TableCell className="text-right">{row.pendingDocs}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/approver/challenges/${row.id}`)
                    }}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/** Challenge options for filter dropdowns on the pending-posts tab. */
export function useApproverChallengeFilterOptions() {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    void apiClient.getApproverChallengePendingPosts({ page: 1, limit: 100 }).then((res) => {
      if (!res.success || !res.data) return
      const posts = unwrapPosts(res.data)
      const seen = new Map<string, string>()
      for (const post of posts) {
        const ctx = contextFromPost(post)
        if (ctx?.challenge_id) {
          seen.set(ctx.challenge_id, ctx.challenge_name)
        }
      }
      setOptions(Array.from(seen.entries()).map(([id, name]) => ({ id, name })))
    })
  }, [])

  return options
}
