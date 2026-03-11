"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useUser } from "@/hooks/use-users";
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

interface ActivityLogItem {
  id: string;
  action: string;
  description?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.id === "string" ? params.id : "";
  const { user, loading, error, refetch } = useUser(userId);
  const { getCountryById } = useCountries();
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendAction, setSuspendAction] = useState<"suspend" | "unsuspend">("suspend");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setActivityLoading(true);
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
        if (!cancelled) setActivityLoading(false);
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
                  {user.fullName && <p className="text-muted-foreground">{user.fullName}</p>}
                  {user.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  )}
                  {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
                  {user.country_id && (
                    <p className="text-sm text-muted-foreground">
                      {getCountryById(user.country_id)?.flag_emoji} {getCountryById(user.country_id)?.name}
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

          {/* Stats */}
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
                <div className="text-2xl font-bold">{user.posts_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(user as any).totalPostViews?.toLocaleString() ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold capitalize">{user.status}</div>
              </CardContent>
            </Card>
          </div>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent activity for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
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
