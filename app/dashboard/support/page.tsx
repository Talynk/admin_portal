"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LifeBuoy, Loader2, Mail, Search } from "lucide-react"
import { useSupportIssues } from "@/hooks/use-support-issues"
import { useSupportEmails } from "@/hooks/use-support-emails"
import { apiClient } from "@/lib/api-client"

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
]

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "BUG", label: "Bug" },
  { value: "PAYMENT", label: "Payment" },
  { value: "GENERAL", label: "General" },
]

const EMAIL_TIME_BUCKETS = [
  { value: "", label: "All time" },
  { value: "1h", label: "Last 1 hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
]

function formatTimeAgo(dateInput: string | Date | null | undefined) {
  if (!dateInput) return "—"
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffSec < 60) return "Just now"
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

export default function SupportIssuesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [email, setEmail] = useState("")

  const [emailTimeBucket, setEmailTimeBucket] = useState<string>("")
  const [emailFilterRead, setEmailFilterRead] = useState<"all" | "unread">("all")
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [selectedEmailHtml, setSelectedEmailHtml] = useState<string | null>(null)
  const [selectedEmailText, setSelectedEmailText] = useState<string | null>(null)
  const [emailDetailLoading, setEmailDetailLoading] = useState(false)
  const [emailDetailError, setEmailDetailError] = useState<string | null>(null)

  const { issues, pagination, loading, error, refetch } = useSupportIssues({
    page,
    limit: 20,
    status: status || undefined,
    category: category || undefined,
    email: email.trim() || undefined,
    q: q.trim() || undefined,
  })

  const {
    emails,
    stats: emailStats,
    loading: emailLoading,
    error: emailError,
    markAsRead: markEmailAsRead,
    markAllAsRead: markAllEmailsAsRead,
  } = useSupportEmails({
    page: 1,
    limit: 30,
    isRead: emailFilterRead === "unread" ? false : undefined,
    timeBucket: emailTimeBucket || undefined,
  })

  // Ensure an email is selected when list loads
  useEffect(() => {
    if (!selectedEmailId && emails.length > 0) {
      setSelectedEmailId(emails[0].id)
    }
  }, [emails, selectedEmailId])

  // Fetch full email detail (html/text) when selection changes
  useEffect(() => {
    let cancelled = false

    const id = selectedEmailId
    if (!id) {
      setSelectedEmailHtml(null)
      setSelectedEmailText(null)
      setEmailDetailError(null)
      return
    }

    async function loadDetail() {
      setEmailDetailLoading(true)
      setEmailDetailError(null)
      try {
        const res = await apiClient.getSupportEmailById(id as string)
        if (!cancelled && res.success && res.data) {
          const data = (res.data as any).data ?? res.data
          setSelectedEmailHtml(data.html ?? null)
          setSelectedEmailText(data.text ?? null)
        } else if (!cancelled && !res.success) {
          setEmailDetailError((res as any).error ?? "Failed to load email")
        }
      } catch (err) {
        if (!cancelled) {
          setEmailDetailError(
            err instanceof Error ? err.message : "Failed to load email",
          )
        }
      } finally {
        if (!cancelled) setEmailDetailLoading(false)
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedEmailId])

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case "NEW":
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-amber-100 text-amber-800">In progress</Badge>
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{statusVal}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <LifeBuoy className="h-8 w-8" />
              Support
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage user support tickets and incoming emails to contact@support.talentix.net.
            </p>
          </div>

          {/* Support email inbox */}
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Support Email Inbox
                </CardTitle>
                <CardDescription>
                  Emails sent to <span className="font-mono">contact@support.talentix.net</span>.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {emailStats && (
                  <>
                    <Badge variant="outline">
                      Total: {emailStats.total}
                    </Badge>
                    <Badge variant={emailStats.unread > 0 ? "destructive" : "outline"}>
                      Unread: {emailStats.unread}
                    </Badge>
                  </>
                )}
                <Select
                  value={emailTimeBucket || "all"}
                  onValueChange={(v) => setEmailTimeBucket(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TIME_BUCKETS.map((opt) => (
                      <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={emailFilterRead}
                  onValueChange={(v: "all" | "unread") => setEmailFilterRead(v)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Read filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!emails.length || emailStats?.unread === 0}
                  onClick={() => markAllEmailsAsRead()}
                >
                  Mark all read
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : emailError ? (
                <p className="text-destructive text-center py-8 text-sm">{emailError}</p>
              ) : !emails.length ? (
                <div className="py-8 text-center space-y-2">
                  <Mail className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    No support emails yet. Messages to contact@support.talentix.net will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:h-[420px] md:flex-row">
                  {/* Left: list */}
                  <div className="md:w-[32%] border rounded-md">
                    <ScrollArea className="h-[260px] md:h-full">
                      <div className="divide-y">
                        {emails.map((emailItem) => {
                          const isSelected = emailItem.id === selectedEmailId
                          const isUnread = !emailItem.isRead
                          return (
                            <button
                              key={emailItem.id}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-muted"
                                  : isUnread
                                  ? "bg-blue-50/80 dark:bg-slate-900/40"
                                  : "hover:bg-muted/60"
                              }`}
                              onClick={() => {
                                setSelectedEmailId(emailItem.id)
                                if (isUnread) {
                                  markEmailAsRead(emailItem.id)
                                }
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate font-medium">
                                  {emailItem.subject || "(no subject)"}
                                </div>
                                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                                  {formatTimeAgo(emailItem.receivedAt)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="truncate text-xs text-muted-foreground">
                                  {emailItem.from}
                                </span>
                                {isUnread && (
                                  <span className="inline-flex h-4 min-w-[1.2rem] items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                                    New
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right: detail */}
                  <div className="flex-1 rounded-md border p-4">
                    {selectedEmailId ? (
                      (() => {
                        const selected = emails.find((e) => e.id === selectedEmailId) ?? emails[0]
                        if (!selected) {
                          return (
                            <p className="text-sm text-muted-foreground">
                              Select an email from the list to view its contents.
                            </p>
                          )
                        }
                        return (
                          <div className="flex h-full flex-col gap-3">
                            <div className="space-y-1">
                              <h3 className="text-base font-semibold">
                                {selected.subject || "(no subject)"}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                From{" "}
                                <span className="font-mono">{selected.from}</span> •{" "}
                                {formatTimeAgo(selected.receivedAt)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                To <span className="font-mono">{selected.to}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {selected.category && (
                                <Badge variant="outline">{selected.category}</Badge>
                              )}
                              <Button variant="outline" size="sm" asChild>
                                <a href={`mailto:${selected.from}`}>Reply via email</a>
                              </Button>
                            </div>
                            <div className="mt-2 flex-1 overflow-auto rounded-md border bg-muted/40 p-3 text-sm">
                              {emailDetailLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Loading message…</span>
                                </div>
                              )}
                              {emailDetailError && !emailDetailLoading && (
                                <p className="text-xs text-destructive">
                                  {emailDetailError}
                                </p>
                              )}
                              {!emailDetailLoading && !emailDetailError && (
                                <>
                                  {selectedEmailHtml ? (
                                    <div
                                      className="prose prose-sm max-w-none dark:prose-invert"
                                      dangerouslySetInnerHTML={{ __html: selectedEmailHtml }}
                                    />
                                  ) : selectedEmailText ? (
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                                      {selectedEmailText}
                                    </pre>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No body content available for this email.
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Select an email from the list to view its contents.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Issues Filters</CardTitle>
              <CardDescription>Search and filter support issues by status, category, or email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Search (subject & message)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button variant="secondary" size="icon" onClick={handleSearch} aria-label="Search">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-[160px]">
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[160px]">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[220px]">
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    placeholder="Filter by email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch}>Apply</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issues</CardTitle>
              <CardDescription>
                {pagination ? `${pagination.total} issue(s)` : "Loading..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <p className="text-destructive text-center py-8">{error}</p>
              ) : !issues.length ? (
                <p className="text-muted-foreground text-center py-8">No support issues found.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Created</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issues.map((issue) => (
                          <TableRow
                            key={issue.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => router.push(`/dashboard/support/${issue.id}`)}
                          >
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {issue.created_at
                                ? new Date(issue.created_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell className="font-medium max-w-[280px]">
                              <Link
                                href={`/dashboard/support/${issue.id}`}
                                className="text-primary hover:underline truncate block"
                              >
                                {issue.subject || "No subject"}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm">{issue.email || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {issue.category || "—"}
                            </TableCell>
                            <TableCell>{getStatusBadge(issue.status)}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {issue.user?.id ? (
                                <Link
                                  href={`/dashboard/users/${issue.user.id}`}
                                  className="text-primary hover:underline text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  @{issue.user.username ?? issue.user.email ?? issue.user.id}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination && (pagination.totalPages ?? 1) > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page >= (pagination.totalPages ?? 1)}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
