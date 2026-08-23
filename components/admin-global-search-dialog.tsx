'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, Users, Video, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api-client'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

interface SearchUser {
  id: string
  username?: string
  display_name?: string
  email?: string
}

interface SearchPost {
  id: string
  title?: string
  status?: string
  user?: { username?: string }
}

interface SearchChallenge {
  id: string
  title?: string
  name?: string
  status?: string
}

export function AdminGlobalSearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 350)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<SearchUser[]>([])
  const [posts, setPosts] = useState<SearchPost[]>([])
  const [challenges, setChallenges] = useState<SearchChallenge[]>([])

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setUsers([])
      setPosts([])
      setChallenges([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.adminSearch({
        q: trimmed,
        type: 'all',
        limit: 8,
        page: 1,
      })
      if (res.success && res.data) {
        const data = res.data as {
          users?: SearchUser[]
          posts?: SearchPost[]
          challenges?: SearchChallenge[]
        }
        setUsers(data.users ?? [])
        setPosts(data.posts ?? [])
        setChallenges(data.challenges ?? [])
      } else {
        setError(res.error ?? 'Search failed')
        setUsers([])
        setPosts([])
        setChallenges([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setUsers([])
      setPosts([])
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void runSearch(debouncedQuery)
  }, [debouncedQuery, open, runSearch])

  const close = () => setOpen(false)

  const hasResults = users.length > 0 || posts.length > 0 || challenges.length > 0
  const showEmpty = debouncedQuery.trim() && !loading && !error && !hasResults

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setQuery('')
          setUsers([])
          setPosts([])
          setChallenges([])
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Find users, posts, and challenges across the admin portal.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            className="pl-8"
            placeholder="Search users, posts, challenges…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto space-y-4 min-h-[80px]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive py-4 text-center">{error}</p> : null}
          {showEmpty ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No results for “{debouncedQuery.trim()}”.</p>
          ) : null}
          {!debouncedQuery.trim() && !loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Type to search.</p>
          ) : null}

          {users.length > 0 ? (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Users
              </h3>
              <ul className="space-y-1">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/dashboard/users?search=${encodeURIComponent(u.username || u.email || u.id)}`}
                      onClick={close}
                      className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{u.display_name || u.username || 'User'}</span>
                      {u.username ? (
                        <span className="text-muted-foreground"> @{u.username}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {posts.length > 0 ? (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" /> Posts
              </h3>
              <ul className="space-y-1">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/content?search=${encodeURIComponent(p.title || p.id)}`}
                      onClick={close}
                      className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{p.title || 'Untitled post'}</span>
                      {p.user?.username ? (
                        <span className="text-muted-foreground"> · @{p.user.username}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {challenges.length > 0 ? (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> Challenges
              </h3>
              <ul className="space-y-1">
                {challenges.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/challenges/${c.id}`}
                      onClick={close}
                      className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{c.title || c.name || 'Challenge'}</span>
                      {c.status ? (
                        <span className="text-muted-foreground"> · {c.status}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
