"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Server,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  Upload,
  Video,
  User,
  ExternalLink,
} from "lucide-react"
import { usePostsProcessing } from "@/hooks/use-posts-processing"
import Link from "next/link"

export default function SystemPage() {
  const { posts, summary, loading, error, refetch } = usePostsProcessing(100)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System</h1>
              <p className="text-muted-foreground">
                Processing pipeline and system health
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading system data</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In pipeline</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "—" : (summary?.totalInPipeline ?? posts.length)}
                </div>
                <p className="text-xs text-muted-foreground">Videos in processing queue</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "—" : (summary?.pending ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Waiting to start</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Loader2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "—" : (summary?.processing ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Currently encoding</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uploading</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "—" : (summary?.uploading ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Uploading to storage</p>
              </CardContent>
            </Card>
          </div>

          {/* Processing queue table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Posts in processing
              </CardTitle>
              <CardDescription>
                Video posts currently in the pipeline (pending, processing, or uploading)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading queue...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No posts in processing</p>
                  <p className="text-sm">The pipeline is clear.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium truncate max-w-[200px]">{post.title || "Untitled"}</p>
                              <p className="text-xs text-muted-foreground">ID: {post.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                @{post.user?.username ?? "—"}
                              </span>
                              {post.user?.display_name && (
                                <span className="text-xs text-muted-foreground">
                                  ({post.user.display_name})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                post.processing_status === "pending"
                                  ? "secondary"
                                  : post.processing_status === "processing"
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {post.processing_status}
                            </Badge>
                            {post.processing_error && (
                              <p className="text-xs text-destructive mt-1 truncate max-w-[180px]" title={post.processing_error}>
                                {post.processing_error}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {post.createdAt || post.uploadDate
                              ? new Date(post.createdAt || post.uploadDate!).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/content/${post.id}`} target="_blank" rel="noopener">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
