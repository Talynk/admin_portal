"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Ban, ChevronDown, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useSuspendedUsers } from "@/hooks/use-suspended-users";
import { getProfilePictureUrl } from "@/lib/file-utils";

export default function SuspendedUsersPage() {
  const [sort, setSort] = useState<"suspended_at_desc" | "created_at_desc">("suspended_at_desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { users, pagination, loading, error, refetch } = useSuspendedUsers({
    page,
    limit: 20,
    sort,
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/users">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight mt-2">Suspended users</h1>
              <p className="text-muted-foreground">
                Users with report context: who reported them, when, and reasons
              </p>
            </div>
            <Select value={sort} onValueChange={(v: "suspended_at_desc" | "created_at_desc") => { setSort(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suspended_at_desc">Suspended (newest first)</SelectItem>
                <SelectItem value="created_at_desc">Created (newest first)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading suspended users</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Suspended accounts
              </CardTitle>
              <CardDescription>
                {pagination.total} suspended user{pagination.total !== 1 ? "s" : ""}. Expand a row to see report details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !users.length ? (
                <p className="text-muted-foreground text-center py-12">No suspended users.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]" />
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Suspended at</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Reported posts</TableHead>
                          <TableHead>Total reports</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <Fragment key={u.id}>
                            <TableRow>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                                >
                                  {expandedId === u.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={getProfilePictureUrl(u.profile_picture)} />
                                    <AvatarFallback>{u.username?.charAt(0) ?? "?"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="font-medium">@{u.username}</span>
                                    {u.display_name && (
                                      <span className="text-muted-foreground text-sm block">{u.display_name}</span>
                                    )}
                                    {u.email && (
                                      <span className="text-muted-foreground text-xs block">{u.email}</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-red-100 text-red-800">Suspended</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {u.suspended_at ? new Date(u.suspended_at).toLocaleString() : "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                {u.suspension_reason ?? "—"}
                              </TableCell>
                              <TableCell>{u.reportedPostsCount ?? 0}</TableCell>
                              <TableCell>{u.totalReportsCount ?? 0}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/dashboard/users/${u.id}`}>View</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedId === u.id && (
                              <TableRow key={`${u.id}-detail`}>
                                <TableCell colSpan={8} className="bg-muted/30 p-4">
                                  <div className="space-y-4">
                                    {u.reportReasons && Object.keys(u.reportReasons).length > 0 && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-2">Report reasons (counts)</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {Object.entries(u.reportReasons).map(([reason, count]) => (
                                            <Badge key={reason} variant="secondary">
                                              {reason}: {count}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {u.reports && u.reports.length > 0 && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-2">Recent reports</h4>
                                        <div className="rounded border bg-background overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Reporter</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Date</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {u.reports.map((r) => (
                                                <TableRow key={r.id}>
                                                  <TableCell className="text-sm">
                                                    @{r.reporter?.username ?? "—"} ({r.reporter?.email ?? "—"})
                                                  </TableCell>
                                                  <TableCell className="font-medium text-sm">{r.reason}</TableCell>
                                                  <TableCell className="text-muted-foreground text-sm max-w-[240px] truncate">
                                                    {r.description ?? "—"}
                                                  </TableCell>
                                                  <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(r.createdAt).toLocaleString()}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    )}
                                    {(!u.reports || u.reports.length === 0) && (!u.reportReasons || Object.keys(u.reportReasons).length === 0) && (
                                      <p className="text-muted-foreground text-sm">No report details available.</p>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination.totalPages > 1 && (
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
                          disabled={page >= pagination.totalPages}
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
  );
}
