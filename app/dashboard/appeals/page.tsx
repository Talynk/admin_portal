"use client"

import { useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Scale, Loader2 } from "lucide-react"
import { useAppeals } from "@/hooks/use-appeals"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import type { Appeal } from "@/lib/types/admin"

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

function getStatusBadge(statusVal: string) {
  switch (statusVal) {
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
    case "approved":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    default:
      return <Badge variant="outline">{statusVal}</Badge>
  }
}

export default function AppealsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>("")
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { appeals, pagination, loading, error, refetch } = useAppeals({
    page,
    limit: 20,
    status: status ? (status as "pending" | "approved" | "rejected") : undefined,
  })

  const openReview = (appeal: Appeal) => {
    setSelectedAppeal(appeal)
    setAdminNotes("")
    setReviewDialogOpen(true)
  }

  const closeReview = () => {
    setReviewDialogOpen(false)
    setSelectedAppeal(null)
    setAdminNotes("")
  }

  const handleApprove = async () => {
    if (!selectedAppeal) return
    setSubmitting(true)
    try {
      const res = await apiClient.reviewAppeal(selectedAppeal.id, {
        status: "approved",
        adminNotes: adminNotes.trim() || undefined,
      })
      if (res.success) {
        toast({
          title: "Appeal approved",
          description: "The post will be restored and the user will be notified.",
        })
        closeReview()
        refetch()
      } else {
        toast({
          title: "Error",
          description: (res as { error?: string }).error ?? "Failed to approve appeal",
          variant: "destructive",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedAppeal) return
    setSubmitting(true)
    try {
      const res = await apiClient.reviewAppeal(selectedAppeal.id, {
        status: "rejected",
        adminNotes: adminNotes.trim() || undefined,
      })
      if (res.success) {
        toast({
          title: "Appeal rejected",
          description: "The post remains suspended. The user will be notified.",
        })
        closeReview()
        refetch()
      } else {
        toast({
          title: "Error",
          description: (res as { error?: string }).error ?? "Failed to reject appeal",
          variant: "destructive",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-8 w-8" />
              Appeals
            </h1>
            <p className="text-muted-foreground mt-1">
              Review post suspension appeals. One appeal per post. Approving restores the post and notifies the user; rejecting keeps it suspended.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter appeals by status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={status === "" ? "all" : status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appeals</CardTitle>
              <CardDescription>
                {pagination ? `${pagination.total} appeal(s)` : "Loading..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <p className="text-destructive text-center py-8">{error}</p>
              ) : !appeals.length ? (
                <p className="text-muted-foreground text-center py-8">No appeals found.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Created</TableHead>
                          <TableHead>Post</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Appeal reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appeals.map((appeal) => (
                          <TableRow key={appeal.id}>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                              {appeal.createdAt ? new Date(appeal.createdAt).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Link
                                  href={`/dashboard/content/${appeal.post?.id}`}
                                  className="text-primary hover:underline font-mono text-sm"
                                >
                                  {appeal.post?.id ?? "—"}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                  {appeal.post?.status ?? "—"} · {appeal.post?.report_count ?? 0} reports
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/dashboard/users/${appeal.user?.id}`}
                                className="text-primary hover:underline text-sm"
                              >
                                @{appeal.user?.username ?? appeal.user?.email ?? "—"}
                              </Link>
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate" title={appeal.appeal_reason ?? ""}>
                              {appeal.appeal_reason ?? "—"}
                            </TableCell>
                            <TableCell>{getStatusBadge(appeal.status)}</TableCell>
                            <TableCell>
                              {appeal.status === "pending" && (
                                <Button variant="outline" size="sm" onClick={() => openReview(appeal)}>
                                  Review
                                </Button>
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
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= (pagination.totalPages ?? 1)}
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

        <Dialog open={reviewDialogOpen} onOpenChange={(open) => !open && closeReview()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review appeal</DialogTitle>
              <DialogDescription>
                Approving will unfreeze the post, set it back to active, and notify the user. Rejecting keeps the post suspended and notifies the user with your response below.
              </DialogDescription>
            </DialogHeader>
            {selectedAppeal && (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Post</p>
                  <Link
                    href={`/dashboard/content/${selectedAppeal.post?.id}`}
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    {selectedAppeal.post?.id}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Status: {selectedAppeal.post?.status ?? "—"} · Reports: {selectedAppeal.post?.report_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <Link
                    href={`/dashboard/users/${selectedAppeal.user?.id}`}
                    className="text-primary hover:underline"
                  >
                    @{selectedAppeal.user?.username ?? selectedAppeal.user?.email}
                  </Link>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Appeal reason</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedAppeal.appeal_reason ?? "—"}</p>
                  {(selectedAppeal as Appeal & { additional_info?: string }).additional_info && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground mt-2">Additional info</p>
                      <p className="text-sm whitespace-pre-wrap">{(selectedAppeal as Appeal & { additional_info?: string }).additional_info}</p>
                    </>
                  )}
                </div>
                <div>
                  <Label htmlFor="admin-notes">Admin response to user (optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="This will be included in the notification to the user."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeReview} disabled={submitting}>
                Cancel
              </Button>
              {selectedAppeal?.status === "pending" && (
                <>
                  <Button variant="destructive" onClick={handleReject} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
