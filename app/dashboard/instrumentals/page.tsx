"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DataTableShell, TruncateCell } from "@/components/data-table-shell";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
  Trash2,
  Music,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

type UploadState = "idle" | "uploading" | "done" | "error";

type FileUploadStatus = "pending" | "uploading" | "completing" | "done" | "error";

interface BulkFileItem {
  id: string;
  file: File;
  title: string;
  durationSec: number | null;
  status: FileUploadStatus;
  progress: number;
  error?: string;
}

type LicenseType = "commissioned" | "cc0" | "licensed" | "ai_generated";

interface CategoryOption {
  id: number;
  name: string;
}

interface InstrumentalItem {
  id: string;
  title: string;
  artist_credit?: string | null;
  genre?: string | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  bpm?: number | null;
  duration_sec?: number | null;
  license_type: LicenseType;
  status: string;
  usage_count: number;
  createdAt: string;
  uploader?: { id: string; username?: string } | null;
}

const MIME_BY_EXT: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  flac: "audio/flac",
};

function guessMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return MIME_BY_EXT[ext] || "audio/mpeg";
}

function formatDuration(sec?: number | null) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      audio.src = url;
    } catch {
      resolve(null);
    }
  });
}

export default function InstrumentalsPage() {
  const [items, setItems] = useState<InstrumentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"active" | "retired" | "all">("active");
  const [licenseFilter, setLicenseFilter] = useState<LicenseType | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState<InstrumentalItem | null>(null);
  const [retiring, setRetiring] = useState(false);

  // Create form (shared across the whole batch; each file keeps its own title)
  const [artistCredit, setArtistCredit] = useState("");
  const [genre, setGenre] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [licenseType, setLicenseType] = useState<LicenseType>("commissioned");
  const [licenseSource, setLicenseSource] = useState("");
  const [attributionText, setAttributionText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<BulkFileItem[]>([]);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchInstrumentals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getInstrumentals({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
        licenseType: licenseFilter === "all" ? undefined : licenseFilter,
      });
      if (res.success && res.data) {
        const data = res.data as any;
        setItems(Array.isArray(data.instrumentals) ? data.instrumentals : []);
        setTotalPages(Math.max(1, data.totalPages || 1));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
      toast({ title: "Error", description: "Failed to load instrumentals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, licenseFilter]);

  useEffect(() => {
    fetchInstrumentals();
  }, [fetchInstrumentals]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, licenseFilter]);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getCategories();
        if (res.success && res.data) {
          const data = res.data as any;
          const list = Array.isArray(data) ? data : data.categories ?? [];
          const music = list.find((c: any) => /music/i.test(c.name));
          const children = music?.children ?? [];
          setCategories(
            children.length
              ? children.map((c: any) => ({ id: c.id, name: c.name }))
              : list.map((c: any) => ({ id: c.id, name: c.name }))
          );
        }
      } catch {
        // Swallow — submitUpload's categoryId check will surface the failure to the user.
      }
    })();
  }, []);

  const resetCreateForm = () => {
    setArtistCredit("");
    setGenre("");
    setCategoryId("");
    setLicenseType("commissioned");
    setLicenseSource("");
    setAttributionText("");
    setSelectedFiles([]);
    setUploadState("idle");
    setUploadError(null);
  };

  const startCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file(s) after removing them from the list
    if (files.length === 0) return;

    const items: BulkFileItem[] = await Promise.all(
      files.map(async (file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        durationSec: await readAudioDuration(file),
        status: "pending" as const,
        progress: 0,
      }))
    );
    setSelectedFiles((prev) => [...prev, ...items]);
  };

  const removeSelectedFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateSelectedFileTitle = (id: string, newTitle: string) => {
    setSelectedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, title: newTitle } : f)));
  };

  const patchFile = (id: string, patch: Partial<BulkFileItem>) => {
    setSelectedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  // Uploads sequentially: the backend allows only one in-flight presigned
  // upload session per admin, so parallel calls would clobber each other.
  const submitUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Select at least one audio file.");
      setUploadState("error");
      return;
    }
    if (selectedFiles.some((f) => !f.title.trim())) {
      setUploadError("Every track needs a title.");
      setUploadState("error");
      return;
    }
    if (!categoryId) {
      setUploadError("Select a category — it's applied to every track in this batch.");
      setUploadState("error");
      return;
    }
    if (licenseType === "licensed" && !licenseSource.trim()) {
      setUploadError("License source is required for a licensed track — note where it was obtained and the license terms.");
      setUploadState("error");
      return;
    }

    setUploadError(null);
    setUploadState("uploading");

    let successCount = 0;
    let failCount = 0;

    for (const item of selectedFiles) {
      if (item.status === "done") continue; // allows "Try again" to skip already-uploaded tracks

      patchFile(item.id, { status: "uploading", progress: 0, error: undefined });
      try {
        const mimeType = guessMimeType(item.file);
        const sessionRes = await apiClient.createInstrumentalUploadSession(mimeType);
        if (!sessionRes.success) {
          throw new Error((sessionRes as any).error || "Failed to create upload session");
        }
        const uploadUrl = (sessionRes.data as any)?.uploadUrl;
        if (!uploadUrl) throw new Error("No upload URL returned");

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              patchFile(item.id, { progress: Math.round((e.loaded / e.total) * 100) });
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.status}`));
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", mimeType);
          xhr.send(item.file);
        });

        patchFile(item.id, { status: "completing" });
        const completeRes = await apiClient.completeInstrumentalUpload({
          title: item.title.trim(),
          artistCredit: artistCredit.trim() || undefined,
          genre: genre.trim() || undefined,
          categoryId: parseInt(categoryId, 10),
          durationSec: item.durationSec ?? undefined,
          licenseType,
          licenseSource: licenseSource.trim() || undefined,
          attributionText: attributionText.trim() || undefined,
        });
        if (!completeRes.success) {
          throw new Error((completeRes as any).error || "Failed to complete upload");
        }

        patchFile(item.id, { status: "done", progress: 100 });
        successCount++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        patchFile(item.id, { status: "error", error: msg });
        failCount++;
      }
    }

    setUploadState("done");
    if (failCount === 0) {
      toast({
        title: successCount > 1 ? "Tracks added" : "Track added",
        description: `${successCount} track${successCount === 1 ? "" : "s"} added to the library.`,
      });
      setCreateOpen(false);
      fetchInstrumentals();
    } else {
      toast({
        title: "Some uploads failed",
        description: `${successCount} succeeded, ${failCount} failed. Fix and hit "Try again" to retry just the failed ones.`,
        variant: "destructive",
      });
      fetchInstrumentals();
    }
  };

  const confirmRetire = async () => {
    if (!retireTarget) return;
    setRetiring(true);
    try {
      const res = await apiClient.retireInstrumental(retireTarget.id);
      if (!res.success) {
        toast({ title: "Error", description: (res as any).error || "Failed to retire track", variant: "destructive" });
      } else {
        toast({ title: "Track retired", description: `"${retireTarget.title}" is no longer in the library.` });
        fetchInstrumentals();
      }
    } finally {
      setRetiring(false);
      setRetireTarget(null);
    }
  };

  const busy = uploadState === "uploading";
  const hasFailedFiles = selectedFiles.some((f) => f.status === "error");

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Instrumentals</h1>
              <p className="text-muted-foreground">
                Backing tracks users can record over. Only upload tracks you have the rights to distribute.
              </p>
            </div>
            <Button onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add track
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Library</CardTitle>
              <CardDescription>All instrumentals available in the recording picker.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search title, artist, or genre..."
                  className="w-[260px]"
                />
                <Select value={statusFilter} onValueChange={(v: "active" | "retired" | "all") => setStatusFilter(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={licenseFilter} onValueChange={(v: LicenseType | "all") => setLicenseFilter(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All licenses</SelectItem>
                    <SelectItem value="commissioned">Commissioned</SelectItem>
                    <SelectItem value="cc0">CC0 / public domain</SelectItem>
                    <SelectItem value="licensed">Licensed</SelectItem>
                    <SelectItem value="ai_generated">AI-generated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DataTableShell
                minWidth="900px"
                loading={loading}
                empty={items.length === 0}
                emptyMessage="No instrumentals yet. Add one to get started."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                            <TruncateCell title={item.title}>{item.title}</TruncateCell>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TruncateCell title={item.artist_credit || undefined}>
                            {item.artist_credit || "—"}
                          </TruncateCell>
                        </TableCell>
                        <TableCell>{item.category?.name || item.genre || "—"}</TableCell>
                        <TableCell>{formatDuration(item.duration_sec)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.license_type}</Badge>
                        </TableCell>
                        <TableCell>{item.usage_count}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "active" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRetireTarget(item)}
                              title="Retire track"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTableShell>
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

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={(open) => !busy && setCreateOpen(open)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add instrumental</DialogTitle>
              <DialogDescription>
                Only upload a track you have clear rights to distribute (commissioned work, CC0, or a
                specifically confirmed license for platform-wide use — not a consumer royalty-free
                subscription tier, those typically forbid redistribution).
              </DialogDescription>
            </DialogHeader>

            {(uploadState === "idle" || uploadState === "error") && (
              <div className="space-y-4">
                <div>
                  <Label>Audio file(s)</Label>
                  <Input type="file" accept="audio/*" multiple onChange={handleFileChange} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select one or many files — the category, genre and license below apply to the whole batch.
                  </p>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto rounded-md border p-2">
                    {selectedFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <Input
                          value={f.title}
                          onChange={(e) => updateSelectedFileTitle(f.id, e.target.value)}
                          className="h-8"
                        />
                        <span className="w-14 shrink-0 text-xs text-muted-foreground text-right">
                          {formatDuration(f.durationSec)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeSelectedFile(f.id)}
                          title="Remove from batch"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <Label>Artist credit (optional)</Label>
                  <Input value={artistCredit} onChange={(e) => setArtistCredit(e.target.value)} placeholder="Artist name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Genre label (optional)</Label>
                    <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Afrobeats" />
                  </div>
                </div>
                <div>
                  <Label>License</Label>
                  <Select value={licenseType} onValueChange={(v: LicenseType) => setLicenseType(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commissioned">Commissioned (made for us)</SelectItem>
                      <SelectItem value="cc0">CC0 / public domain</SelectItem>
                      <SelectItem value="licensed">Licensed (e.g. CC-BY, confirmed source)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {licenseType === "licensed" && (
                  <>
                    <div>
                      <Label>License source</Label>
                      <Input
                        value={licenseSource}
                        onChange={(e) => setLicenseSource(e.target.value)}
                        placeholder="Where it's from + the license, e.g. Free Music Archive — CC BY 4.0 — https://..."
                      />
                    </div>
                    <div>
                      <Label>Attribution text (shown in-app if required)</Label>
                      <Textarea
                        value={attributionText}
                        onChange={(e) => setAttributionText(e.target.value)}
                        placeholder='e.g. "Track Title by Artist is licensed under CC BY 4.0"'
                      />
                    </div>
                  </>
                )}
                {uploadError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {(uploadState === "uploading" || uploadState === "done") && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {selectedFiles.map((f) => (
                  <div key={f.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                      {f.status === "error" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      {(f.status === "uploading" || f.status === "completing") && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                      {f.status === "pending" && <Upload className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <TruncateCell title={f.title}>{f.title}</TruncateCell>
                      {f.status === "completing" && (
                        <span className="text-xs text-muted-foreground shrink-0">Saving…</span>
                      )}
                    </div>
                    {f.status === "uploading" && <Progress value={f.progress} />}
                    {f.status === "error" && f.error && (
                      <p className="text-xs text-destructive pl-6">{f.error}</p>
                    )}
                  </div>
                ))}
                {uploadState === "done" && !hasFailedFiles && (
                  <div className="flex items-center gap-2 pt-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>All tracks added.</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {(uploadState === "idle" || uploadState === "error") && (
                <Button onClick={submitUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFiles.length > 1 ? `Upload ${selectedFiles.length} tracks` : "Upload"}
                </Button>
              )}
              {uploadState === "done" && hasFailedFiles && (
                <Button onClick={submitUpload}>Try again</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Retire confirmation */}
        <AlertDialog open={!!retireTarget} onOpenChange={(open) => !open && setRetireTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retire this track?</AlertDialogTitle>
              <AlertDialogDescription>
                "{retireTarget?.title}" will no longer appear in the recording picker for new posts.
                Posts already made with it are unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={retiring}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRetire} disabled={retiring}>
                {retiring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retire"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
