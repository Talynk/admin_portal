"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Ban, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { ReviewMediaCard } from "@/components/media/review-media-card";
import { PostMediaDialog } from "@/components/media/post-media-dialog";
import type { LegacyMediaFields, PostPlaybackFields } from "@/lib/types/media";

interface FlaggedPostReport {
  id: string;
  reason?: string;
  description?: string;
  createdAt: string;
  user?: { id: string; username: string };
}

interface FlaggedPostAppeal {
  id: string;
  appeal_reason?: string;
  status: string;
  createdAt: string;
  user?: { id: string; username: string };
}

interface FlaggedPost extends PostPlaybackFields, LegacyMediaFields {
  id: string;
  title?: string | null;
  caption?: string | null;
  suspension_reason?: string | null;
  frozen_at?: string | null;
  report_count?: number;
  user?: { id: string; username: string; email?: string };
  reports?: FlaggedPostReport[];
  appeals?: FlaggedPostAppeal[];
}

interface FlaggedPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function FlaggedContentPage() {
  const [posts, setPosts] = useState<FlaggedPost[]>([]);
  const [pagination, setPagination] = useState<FlaggedPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewPost, setPreviewPost] = useState<FlaggedPost | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [actionTarget, setActionTarget] = useState<FlaggedPost | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFlagged = async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAdminFlaggedPosts({ page: targetPage, limit: 12 });
      if (res.success && res.data) {
        const data = res.data as { posts?: FlaggedPost[]; pagination?: FlaggedPagination };
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setPagination(data.pagination ?? null);
      } else {
        setError((res as { error?: string }).error || "Failed to load flagged posts");
        setPosts([]);
      }
    } catch {
      setError("Failed to load flagged posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFlagged(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openAction = (post: FlaggedPost, type: "approve" | "reject") => {
    setActionTarget(post);
    setActionType(type);
    setNotes("");
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!actionTarget || !actionType) return;
    if (actionType === "reject" && !notes.trim()) {
      toast({ title: "Reason required", description: "Notes are required when rejecting a flagged post.", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.reviewAdminFlaggedPost(actionTarget.id, actionType, notes.trim() || undefined);
      if (res.success) {
        toast({
          title: actionType === "approve" ? "Post approved" : "Post rejected",
          description:
            actionType === "approve"
              ? "Restored to active and removed from the flagged queue."
              : "Violation confirmed. The post remains suspended.",
        });
        setActionDialogOpen(false);
        setActionTarget(null);
        await fetchFlagged(page);
      } else {
        toast({
          title: "Action failed",
          description: (res as { error?: string }).error || "Could not review this post",
          variant: "destructive",
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-orange-500" />
              Flagged Content
            </h1>
            <p className="text-muted-foreground">
              Posts currently suspended and frozen — either frozen directly by an admin or auto-flagged once
              report count crosses the configured threshold. Approve to restore, or reject to confirm the
              violation.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Queue</CardTitle>
              <CardDescription>
                {pagination ? `${pagination.totalCount} post${pagination.totalCount !== 1 ? "s" : ""} pending review` : "Loading…"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading flagged posts…
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => void fetchFlagged(page)}>
                    Retry
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nothing flagged right now</p>
                  <p className="text-sm">The queue is empty — no posts are currently suspended and frozen.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <ReviewMediaCard
                        source={post}
                        title={post.title || post.caption}
                        onDetails={() => {
                          setPreviewPost(post);
                          setPreviewOpen(true);
                        }}
                      />
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{post.title || post.caption || "Untitled"}</p>
                            {post.user?.username ? (
                              <Link
                                href={`/dashboard/users/${post.user.id}`}
                                className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
                              >
                                @{post.user.username}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : null}
                          </div>
                          {typeof post.report_count === "number" && post.report_count > 0 ? (
                            <Badge variant="outline">{post.report_count} reports</Badge>
                          ) : null}
                        </div>
                        {post.suspension_reason ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">Reason: {post.suspension_reason}</p>
                        ) : null}
                        {post.frozen_at ? (
                          <p className="text-xs text-muted-foreground">
                            Frozen {new Date(post.frozen_at).toLocaleString()}
                          </p>
                        ) : null}
                        {post.reports && post.reports.length > 0 ? (
                          <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                            {post.reports.slice(0, 3).map((r) => (
                              <p key={r.id} className="truncate">
                                @{r.user?.username || "user"}: {r.reason || "No reason given"}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" onClick={() => openAction(post, "approve")} disabled={actionLoading}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openAction(post, "reject")}
                            disabled={actionLoading}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <PostMediaDialog
          source={previewPost}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title={previewPost?.title || previewPost?.caption}
        />

        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === "approve" ? "Approve flagged post" : "Reject flagged post"}</DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "Restores the post to active and clears the suspension. Use when the report or freeze was a mistake."
                  : "Confirms the violation. The post stays suspended and is removed from the pending queue. Notes are required and sent to the owner."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="flagged-notes">
                {actionType === "reject" ? "Reason (required)" : "Notes (optional)"}
              </Label>
              <Textarea
                id="flagged-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionType === "reject" ? "Reason for rejection…" : "Optional notes…"}
              />
              {actionType === "reject" && !notes.trim() ? (
                <p className="text-sm text-destructive">A reason is required.</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={actionType === "reject" ? "destructive" : "default"}
                onClick={() => void executeAction()}
                disabled={actionLoading || (actionType === "reject" && !notes.trim())}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
