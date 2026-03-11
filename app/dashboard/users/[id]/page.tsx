"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  Mail,
  Calendar,
  User,
  FileText,
  Eye,
  AlertCircle,
  Loader2,
  Ban,
  UserCheck,
  Shield,
  Heart,
  MessageSquare,
  Share2,
  AlertTriangle,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useUser } from "@/hooks/use-users";
import { useUserActivity } from "@/hooks/use-user-activity";
import { useUserPosts } from "@/hooks/use-user-posts";
import { useUserPostsEngagement } from "@/hooks/use-user-posts-engagement";
import { useCountries } from "@/hooks/use-countries";
import { apiClient } from "@/lib/api-client";
import { getProfilePictureUrl } from "@/lib/file-utils";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TimeFrame } from "@/lib/types/admin";

interface ActivityLogItem {
  id: string;
  action: string;
  description?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const TIME_FRAMES: { value: TimeFrame; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.id === "string" ? params.id : "";
  const { user, loading, error, refetch } = useUser(userId);
  const { getCountryById } = useCountries();
  const [activityFrame, setActivityFrame] = useState<TimeFrame>("24h");
  const [engagementFrame, setEngagementFrame] = useState<TimeFrame>("30d");
  const [postsStatus, setPostsStatus] = useState<"all" | "active" | "suspended" | "draft">("all");
  const [postsSort, setPostsSort] = useState<"newest" | "oldest" | "most_liked" | "most_viewed" | "most_reported">("newest");
  const [postsPage, setPostsPage] = useState(1);
  const { buckets: activityBuckets, loading: activityLoading } = useUserActivity(userId, activityFrame);
  const { posts: userPosts, pagination: postsPagination, loading: postsLoading, refetch: refetchPosts } = useUserPosts(userId, {
    page: postsPage,
    limit: 20,
    status: postsStatus,
    sort: postsSort,
  });
  const { summary: engagementSummary, engagementRate, loading: engagementLoading } = useUserPostsEngagement(userId, engagementFrame);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [legacyActivityLoading, setLegacyActivityLoading] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendAction, setSuspendAction] = useState<"suspend" | "unsuspend">("suspend");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLegacyActivityLoading(true);
    apiClient
      .getActivityLogs({ userId, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const data = res.data as { logs?: ActivityLogItem[]; data?: ActivityLogItem[] };
          const logs = data.logs ?? data.data ?? [];
          setActivityLogs(Array.isArray(logs) ? logs : []);
        } else {
          setActivityLogs([]);
        }
      })
      .catch(() => {
        if (!cancelled) setActivityLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLegacyActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "frozen":
        return <Badge className="bg-gray-100 text-gray-800">Frozen</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSendMessage = () => {
    if (user?.email) {
      window.location.href = `mailto:${user.email}`;
    } else {
      toast({ title: "No email", description: "This user has no email on file.", variant: "destructive" });
    }
  };

  const openSuspendDialog = (action: "suspend" | "unsuspend") => {
    setSuspendAction(action);
    setSuspendReason("");
    setSuspendDialogOpen(true);
  };

  const executeSuspendAction = async () => {
    if (!user) return;
    setSuspendLoading(true);
    try {
      const res =
        suspendAction === "suspend"
          ? await apiClient.suspendUser(user.id, suspendReason)
          : await apiClient.unsuspendUser(user.id, suspendReason);
      if (res.success) {
        toast({ title: "Success", description: suspendAction === "suspend" ? "User suspended." : "User unsuspended." });
        setSuspendDialogOpen(false);
        refetch();
      } else {
        toast({ title: "Error", description: (res as any).error || (res as any).message || "Action failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    } finally {
      setSuspendLoading(false);
    }
  };

  if (loading || !userId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !user) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error loading user</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-1">{error || "User not found"}</p>
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/users")} className="mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/users")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>

          {/* Profile header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={getProfilePictureUrl(user.profile_picture)} />
                  <AvatarFallback className="text-2xl">
                    {user.fullName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">@{user.username}</h1>
                    {getStatusBadge(user.status)}
                  </div>
                  {(user.fullName ?? user.display_name) && <p className="text-muted-foreground">{user.fullName ?? user.display_name}</p>}
                  {user.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  )}
                  {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
                  {(user.country ?? (user.country_id && getCountryById(user.country_id))) && (
                    <p className="text-sm text-muted-foreground">
                      {user.country ? `${user.country.flag_emoji} ${user.country.name}` : `${getCountryById(user.country_id!)?.flag_emoji} ${getCountryById(user.country_id!)?.name}`}
                    </p>
                  )}
                  {user.status === "suspended" && user.suspended_at && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Suspended {new Date(user.suspended_at).toLocaleString()}
                      {user.suspension_reason && ` — ${user.suspension_reason}`}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last active: {new Date(user.last_active_date).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={handleSendMessage}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send message
                    </Button>
                    {user.status === "suspended" ? (
                      <Button variant="outline" size="sm" onClick={() => openSuspendDialog("unsuspend")}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Unsuspend
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openSuspendDialog("suspend")}>
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats: use summary when available */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(user as any).follower_count ?? user.followers ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.summary?.totalPosts ?? user.posts_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total post views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(user.summary?.totalPostViews ?? (user as any).totalPostViews)?.toLocaleString() ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports on content</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.summary?.totalReportsOnContent?.toLocaleString() ?? "—"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Activity graph (time-bucketed) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activity over time</CardTitle>
                <CardDescription>Posts created, likes given, comments made</CardDescription>
              </div>
              <Select value={activityFrame} onValueChange={(v) => setActivityFrame(v as TimeFrame)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FRAMES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !activityBuckets.length ? (
                <p className="text-muted-foreground text-center py-8">No activity in this period.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityBuckets.map((b) => ({ ...b, period: new Date(b.periodStart).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="postsCreated" name="Posts created" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="likesGiven" name="Likes given" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="commentsMade" name="Comments made" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User posts engagement summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Posts engagement summary</CardTitle>
                <CardDescription>Performance over selected period</CardDescription>
              </div>
              <Select value={engagementFrame} onValueChange={(v) => setEngagementFrame(v as TimeFrame)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FRAMES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {engagementLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : engagementSummary ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{engagementSummary.totalPostsInFrame}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{engagementSummary.totalViews.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{engagementSummary.totalLikes.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{engagementSummary.totalComments.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{engagementRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Engagement rate</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No engagement data for this period.</p>
              )}
            </CardContent>
          </Card>

          {/* User's posts */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>User&apos;s posts</CardTitle>
                <CardDescription>Posts by this user with optional filters</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={postsStatus} onValueChange={(v: "all" | "active" | "suspended" | "draft") => { setPostsStatus(v); setPostsPage(1); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={postsSort} onValueChange={(v: "newest" | "oldest" | "most_liked" | "most_viewed" | "most_reported") => { setPostsSort(v); setPostsPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="most_liked">Most liked</SelectItem>
                    <SelectItem value="most_viewed">Most viewed</SelectItem>
                    <SelectItem value="most_reported">Most reported</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !userPosts.length ? (
                <p className="text-muted-foreground text-center py-8">No posts found.</p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Post</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Likes</TableHead>
                          <TableHead>Reports</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPosts.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">{p.title ?? p.id}</TableCell>
                            <TableCell>{getStatusBadge(p.status)}</TableCell>
                            <TableCell>{(p as any).views?.toLocaleString() ?? 0}</TableCell>
                            <TableCell>{(p as any).likes?.toLocaleString() ?? 0}</TableCell>
                            <TableCell>{(p.report_count ?? (p as any)._count?.reports ?? 0)}</TableCell>
                            <TableCell className="text-muted-foreground">{p.category?.name ?? "—"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/content/${p.id}`}>View</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {postsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {postsPagination.page} of {postsPagination.totalPages} ({postsPagination.total} total)
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={postsPage <= 1} onClick={() => setPostsPage((x) => Math.max(1, x - 1))}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={postsPage >= postsPagination.totalPages} onClick={() => setPostsPage((x) => x + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity logs (legacy) */}
          <Card>
            <CardHeader>
              <CardTitle>Activity logs</CardTitle>
              <CardDescription>Recent activity for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {legacyActivityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No activity logs found.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {log.description ?? (log.details && JSON.stringify(log.details)) ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{suspendAction === "suspend" ? "Suspend user" : "Unsuspend user"}</DialogTitle>
              <DialogDescription>
                {suspendAction === "suspend"
                  ? `Suspend @${user.username}? They will not be able to access the platform.`
                  : `Restore access for @${user.username}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Reason for this action..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} disabled={suspendLoading}>
                Cancel
              </Button>
              <Button
                variant={suspendAction === "suspend" ? "destructive" : "default"}
                onClick={executeSuspendAction}
                disabled={suspendLoading}
              >
                {suspendLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {suspendAction === "suspend" ? "Suspend" : "Unsuspend"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
