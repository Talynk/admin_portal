"use client"

import { useState } from "react"
import Link from "next/link"
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
import { LifeBuoy, Loader2, Search } from "lucide-react"
import { useSupportIssues } from "@/hooks/use-support-issues"

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

export default function SupportIssuesPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [email, setEmail] = useState("")

  const { issues, pagination, loading, error, refetch } = useSupportIssues({
    page,
    limit: 20,
    status: status || undefined,
    category: category || undefined,
    email: email.trim() || undefined,
    q: q.trim() || undefined,
  })

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
              Support Issues
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage user support tickets and feedback.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
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
                          <TableRow key={issue.id}>
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
                            <TableCell>
                              {issue.user?.id ? (
                                <Link
                                  href={`/dashboard/users/${issue.user.id}`}
                                  className="text-primary hover:underline text-sm"
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
