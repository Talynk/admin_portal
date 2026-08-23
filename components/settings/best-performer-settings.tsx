'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Star, X } from 'lucide-react'
import { useBestPerformer } from '@/hooks/use-best-performer'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { PostMediaThumbnail } from '@/components/media/post-media-thumbnail'
import type { LegacyMediaFields, PostPlaybackFields } from '@/lib/types/media'

interface SearchPost extends PostPlaybackFields, LegacyMediaFields {
  id: string
  title?: string | null
  status?: string
  user?: { username?: string }
}

export function BestPerformerSettings() {
  const { settings, loading, saving, error, save, refetch } = useBestPerformer()
  const [label, setLabel] = useState('Best Performer')
  const [expiresAt, setExpiresAt] = useState('')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchPost[]>([])
  const [currentPost, setCurrentPost] = useState<SearchPost | null>(null)
  const [loadingCurrent, setLoadingCurrent] = useState(false)

  useEffect(() => {
    setLabel(settings.label || 'Best Performer')
    if (settings.expires_at) {
      const d = new Date(settings.expires_at)
      if (!Number.isNaN(d.getTime())) {
        // datetime-local expects local YYYY-MM-DDTHH:mm
        const pad = (n: number) => String(n).padStart(2, '0')
        setExpiresAt(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        )
      } else {
        setExpiresAt('')
      }
    } else {
      setExpiresAt('')
    }
  }, [settings])

  useEffect(() => {
    if (!settings.post_id) {
      setCurrentPost(null)
      return
    }
    let cancelled = false
    setLoadingCurrent(true)
    void (async () => {
      try {
        const res = await apiClient.getPostById(settings.post_id!)
        if (cancelled) return
        if (res.success && res.data) {
          const data = res.data as Record<string, unknown>
          const post = (data.post ?? data) as SearchPost
          if (post?.id) {
            setCurrentPost(post)
            return
          }
        }
        setCurrentPost({ id: settings.post_id! })
      } catch {
        if (!cancelled) setCurrentPost({ id: settings.post_id! })
      } finally {
        if (!cancelled) setLoadingCurrent(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [settings.post_id])

  const runSearch = async () => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await apiClient.getPosts({ search: q, status: 'active', limit: 12, sort: 'newest' })
      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>
        const posts = (raw.posts ?? raw.data ?? []) as SearchPost[]
        setResults(Array.isArray(posts) ? posts : [])
      } else {
        setResults([])
        toast({
          title: 'Search failed',
          description: res.error || res.message || 'Could not search posts',
          variant: 'destructive',
        })
      }
    } finally {
      setSearching(false)
    }
  }

  const toIsoExpiry = (): string | null => {
    if (!expiresAt.trim()) return null
    const d = new Date(expiresAt)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  }

  const handleSet = async (postId: string) => {
    const iso = expiresAt.trim() ? toIsoExpiry() : null
    if (expiresAt.trim() && !iso) {
      toast({
        title: 'Invalid expiry',
        description: 'expiresAt must be a valid datetime',
        variant: 'destructive',
      })
      return
    }
    const result = await save({
      postId,
      label: label.trim() || 'Best Performer',
      expiresAt: iso,
    })
    if (result.success) {
      toast({ title: 'Best Performer set', description: result.message || 'Feed pin updated.' })
    } else {
      toast({ title: 'Could not set Best Performer', description: result.error, variant: 'destructive' })
    }
  }

  const handleClear = async () => {
    const result = await save({ postId: null })
    if (result.success) {
      toast({ title: 'Best Performer cleared', description: 'Pin removed from feeds.' })
    } else {
      toast({ title: 'Clear failed', description: result.error, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading Best Performer…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Current Best Performer
          </CardTitle>
          <CardDescription>
            Pinned first on public and personalized feeds. Does not replace the global app banner.
            Post must be feed-ready (active, not frozen; videos HLS-complete).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.post_id ? (
            <div className="flex flex-col sm:flex-row gap-4 rounded-lg border p-4">
              <div className="w-full sm:w-40 shrink-0">
                {loadingCurrent ? (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <PostMediaThumbnail
                    source={currentPost}
                    title={currentPost?.title}
                    className="rounded"
                  />
                )}
              </div>
              <div className="min-w-0 space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{settings.label || 'Best Performer'}</Badge>
                  {settings.expires_at ? (
                    <span className="text-xs text-muted-foreground">
                      Expires {new Date(settings.expires_at).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No expiry</span>
                  )}
                </div>
                <p className="font-medium truncate">{currentPost?.title || 'Pinned post'}</p>
                <p className="text-xs text-muted-foreground font-mono truncate" title={settings.post_id}>
                  {settings.post_id}
                </p>
                {currentPost?.user?.username ? (
                  <p className="text-sm text-muted-foreground">@{currentPost.user.username}</p>
                ) : null}
                <Button variant="destructive" size="sm" onClick={() => void handleClear()} disabled={saving}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Best Performer
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Best Performer is set.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bp-label">Label</Label>
              <Input
                id="bp-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Best Performer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-expires">Expiry (optional)</Label>
              <Input
                id="bp-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Set from active posts</CardTitle>
          <CardDescription>Search active posts, then pin one as Best Performer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or post id…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch()
              }}
            />
            <Button onClick={() => void runSearch()} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {results.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 rounded-md border p-2 hover:bg-muted/40"
                >
                  <div className="w-20 shrink-0">
                    <PostMediaThumbnail source={post} title={post.title} compact className="rounded" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {post.user?.username ? `@${post.user.username} · ` : ''}
                      {post.id}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={saving || settings.post_id === post.id}
                    onClick={() => void handleSet(post.id)}
                  >
                    Set as Best Performer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run a search to find feed-ready posts.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
