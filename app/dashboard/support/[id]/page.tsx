"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import type { SupportIssue } from "@/hooks/use-support-issues"

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
]

const CATEGORY_OPTIONS = [
  { value: "", label: "—" },
  { value: "BUG", label: "Bug" },
  { value: "PAYMENT", label: "Payment" },
  { value: "GENERAL", label: "General" },
]

function getStatusBadge(statusVal: string) {
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

export default function SupportIssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""
  const [issue, setIssue] = useState<SupportIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [adminResponse, setAdminResponse] = useState("")

  const fetchIssue = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.getSupportIssue(id)
      if (res.success && res.data) {
        const data = res.data as SupportIssue | { issue?: SupportIssue }
        const issueData = (data as { issue?: SupportIssue }).issue ?? (data as SupportIssue)
        setIssue(issueData)
        setStatus(issueData.status ?? "NEW")
        setCategory(issueData.category ?? "")
        setAdminResponse(String((issueData as SupportIssue & { admin_message?: string; adminMessage?: string; response?: string }).admin_message ?? (issueData as SupportIssue & { adminMessage?: string; response?: string }).adminMessage ?? (issueData as SupportIssue & { response?: string }).response ?? ""))
      } else {
        setError((res as { error?: string }).error ?? "Failed to load issue")
        setIssue(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issue")
      setIssue(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchIssue()
  }, [fetchIssue])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await apiClient.updateSupportIssue(id, {
        status: status || undefined,
        ...(category ? { category } : {}),
        ...(adminResponse.trim() ? { adminMessage: adminResponse.trim(), response: adminResponse.trim() } : {}),
      })
      if (res.success) {
        toast({ title: "Saved", description: "Issue updated successfully." })
        fetchIssue()
      } else {
        toast({
          title: "Error",
          description: (res as { error?: string }).error ?? "Failed to update issue",
          variant: "destructive",
        })
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update issue",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const metadataJson =
    issue?.metadata != null
      ? typeof issue.metadata === "object"
        ? JSON.stringify(issue.metadata, null, 2)
        : String(issue.metadata)
      : ""

  if (loading && !issue) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !issue) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error loading issue</span>
              </div>
              <p className="text-red-600 dark:text-red-300 mt-1">{error ?? "Issue not found"}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/support")}
                className="mt-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/support">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">{issue.subject || "No subject"}</CardTitle>
                    {getStatusBadge(issue.status)}
                  </div>
                  <CardDescription>
                    Created {issue.created_at ? new Date(issue.created_at).toLocaleString() : "—"}
                    {issue.updated_at && (
                      <> · Updated {new Date(issue.updated_at).toLocaleString()}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Reporter</Label>
                    <p className="font-medium">{issue.email}</p>
                    {issue.user?.id && (
                      <Link
                        href={`/dashboard/users/${issue.user.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        @{issue.user.username ?? issue.user.email ?? issue.user.id}
                      </Link>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p>{issue.category || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Message</Label>
                    <div className="mt-2 rounded-lg border bg-muted/30 p-4 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm">
                      {issue.message || "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Update issue</CardTitle>
                  <CardDescription>
                    Change status, category, and add a response. {issue.user_id && "If the issue has a linked user, they will receive a support_issue_update notification with your response and status."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="response-to-user">Response to user</Label>
                    <Textarea
                      id="response-to-user"
                      placeholder="Your reply will be sent to the user and included in support_issue_update notifications."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      className="mt-1 min-h-[120px]"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground mt-1">User-friendly; visible to the end user.</p>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save changes
                  </Button>
                </CardContent>
              </Card>

              {(issue.metadata != null && Object.keys(issue.metadata as object).length > 0) && (
                <Card>
                  <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        Metadata
                        {metadataOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-[200px]">
                          {metadataJson}
                        </pre>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
