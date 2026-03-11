"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

type UploadState =
  | "idle"
  | "creatingSession"
  | "selectingFile"
  | "uploading"
  | "completing"
  | "done"
  | "error";

interface AdItem {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  processing_status?: string;
  created_at?: string;
  admin?: { username?: string };
}

export default function AdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create form
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSessionPostId, setUploadSessionPostId] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAds({ page, limit: 20 });
      if (res.success && res.data) {
        const data = res.data as any;
        const list = Array.isArray(data) ? data : data.ads ?? data.data ?? [];
        const pagination = (data as any).pagination;
        setAds(Array.isArray(list) ? list : []);
        if (pagination?.totalPages) setTotalPages(pagination.totalPages);
        else if (Array.isArray(data)) setTotalPages(1);
      } else {
        setAds([]);
      }
    } catch {
      setAds([]);
      toast({ title: "Error", description: "Failed to load ads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const filteredAds = searchTerm.trim()
    ? ads.filter(
        (a) =>
          (a.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ads;

  const startCreate = () => {
    setCreateTitle("");
    setCreateDescription("");
    setUploadState("idle");
    setUploadProgress(0);
    setUploadSessionPostId(null);
    setUploadUrl(null);
    setUploadError(null);
    setCreateOpen(true);
  };

  const createSession = async () => {
    setUploadError(null);
    setUploadState("creatingSession");
    try {
      const res = await apiClient.createAdUploadSession(createTitle || "Ad", createDescription);
      if (!res.success) {
        setUploadError((res as any).error || "Failed to create upload session");
        setUploadState("error");
        toast({ title: "Error", description: "Could not create upload session. Session may have expired.", variant: "destructive" });
        return;
      }
      const data = res.data as any;
      const postId = data?.postId ?? data?.post_id;
      const url = data?.uploadUrl ?? data?.upload_url;
      if (!postId || !url) {
        setUploadError("No post ID or upload URL returned");
        setUploadState("error");
        return;
      }
      setUploadSessionPostId(postId);
      setUploadUrl(url);
      setUploadState("selectingFile");
      toast({ title: "Upload session created", description: "Select a video file to upload." });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Network error");
      setUploadState("error");
      toast({ title: "Error", description: "Failed to create upload session", variant: "destructive" });
    }
  };

  const uploadFile = async (file: File) => {
    const url = uploadUrl;
    if (!uploadSessionPostId || !url) {
      setUploadError("Upload session expired. Please start again.");
      setUploadState("error");
      return;
    }
    setUploadError(null);
    setUploadState("uploading");
    setUploadProgress(0);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      setUploadState("completing");
      toast({ title: "Upload complete", description: "Processing video…" });

      const completeRes = await apiClient.completeAdUpload(uploadSessionPostId);
      if (!completeRes.success) {
        setUploadError((completeRes as any).error || "Failed to complete upload");
        setUploadState("error");
        toast({ title: "Error", description: "Upload complete but processing could not be started.", variant: "destructive" });
        return;
      }

      setUploadState("done");
      toast({ title: "Ad created", description: "Video is being processed. It will appear in the list shortly." });
      setCreateOpen(false);
      fetchAds();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setUploadError(msg);
      setUploadState("error");
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    }
  };

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file (e.g. MP4).", variant: "destructive" });
      return;
    }
    uploadFile(file);
    e.target.value = "";
  };

  const openEdit = (ad: AdItem) => {
    setSelectedAd(ad);
    setEditTitle(ad.title ?? "");
    setEditDescription(ad.description ?? "");
    setEditStatus((ad.status as "active" | "suspended") || "active");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedAd) return;
    setEditSaving(true);
    try {
      const res = await apiClient.updateAd(selectedAd.id, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
      });
      if (res.success) {
        toast({ title: "Success", description: "Ad updated." });
        setEditOpen(false);
        fetchAds();
      } else {
        toast({ title: "Error", description: (res as any).error || "Failed to update ad", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update ad", variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = (ad: AdItem) => {
    setSelectedAd(ad);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!selectedAd) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.deleteAd(selectedAd.id);
      if (res.success) {
        toast({ title: "Success", description: "Ad deleted." });
        setDeleteOpen(false);
        setSelectedAd(null);
        fetchAds();
      } else {
        toast({ title: "Error", description: (res as any).error || "Failed to delete ad", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete ad", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getProcessingBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800">Processing</Badge>;
      case "uploading":
        return <Badge className="bg-blue-100 text-blue-800">Uploading</Badge>;
      default:
        return <Badge variant="secondary">{status || "—"}</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ads</h1>
              <p className="text-muted-foreground">Create and manage feed ads (video)</p>
            </div>
            <Button onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create ad
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All ads</CardTitle>
              <CardDescription>Ads appear in the app feed. Upload uses a signed URL for speed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Input
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processing</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAds.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No ads yet. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAds.map((ad) => (
                          <TableRow key={ad.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{ad.title || "Ad"}</p>
                                {ad.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{ad.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ad.status === "active" ? "default" : "secondary"}>
                                {ad.status || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getProcessingBadge(ad.processing_status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {ad.created_at ? new Date(ad.created_at).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell>{ad.admin?.username ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(ad)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => confirmDelete(ad)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Ad Dialog */}
        <Dialog open={createOpen} onOpenChange={(open) => !["uploading", "completing"].includes(uploadState) && setCreateOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create ad</DialogTitle>
              <DialogDescription>
                Create an upload session, then select a video file. The file is uploaded directly for fast uploads.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {uploadState === "idle" && (
                <>
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="Ad"
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="Caption or description"
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                    />
                  </div>
                </>
              )}
              {uploadState === "creatingSession" && (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating upload session…</span>
                </div>
              )}
              {uploadState === "selectingFile" && (
                <div className="space-y-2">
                  <Label>Select video file</Label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleCreateFileChange}
                  />
                  <p className="text-sm text-muted-foreground">Upload will start as soon as you select a file.</p>
                </div>
              )}
              {uploadState === "uploading" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 animate-pulse" />
                    <span>Uploading… {uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              {uploadState === "completing" && (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Completing and queuing processing…</span>
                </div>
              )}
              {uploadState === "done" && (
                <div className="flex items-center gap-2 py-4 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Ad created. Video is being processed.</span>
                </div>
              )}
              {uploadState === "error" && uploadError && (
                <div className="flex items-center gap-2 py-4 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              {uploadState === "idle" && (
                <Button onClick={createSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create session &amp; upload
                </Button>
              )}
              {["error", "done", "selectingFile"].includes(uploadState) && (
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit ad</DialogTitle>
              <DialogDescription>Update title, description, and status. Video file cannot be changed.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v: "active" | "suspended") => setEditStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={editSaving}>
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete ad</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete this ad? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={doDelete} disabled={deleteLoading}>
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
