"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApproverAuth } from "@/components/approver-auth-provider"
import { apiClient } from "@/lib/api-client"
import { normalizePagination } from "@/lib/pagination"
import { useRouter } from "next/navigation"
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Ban,
  Trophy,
  Video,
} from "lucide-react"
import Link from "next/link"

export default function ApproverDashboardPage() {
  const { approver } = useApproverAuth()
  const router = useRouter()
  const [stats, setStats] = useState<{
    suspendedCount?: number
    todayCount?: number
    approvedCount?: number
    rejectedCount?: number
    challengePendingCount?: number
    challengeReviewedCount?: number
  } | null>(null)
  const [pendingDocCount, setPendingDocCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsRes, docsRes] = await Promise.all([
        apiClient.getApproverPortalStats(),
        apiClient.getApproverPendingDocuments({ page: 1, limit: 1 }),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data as typeof stats)
      } else {
        setError(statsRes.error || "Failed to load stats")
      }

      if (docsRes.success && docsRes.data) {
        setPendingDocCount(normalizePagination(docsRes.data, 1)?.total ?? null)
      }
    } catch {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStats()
  }, [])

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome{approver?.first_name ? `, ${approver.first_name}` : ""}. Review content and
              moderated challenge submissions from the hubs below.
            </p>
          </div>

          {error ? (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error loading statistics</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={() => void loadStats()} className="mt-2">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                <Ban className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.suspendedCount ?? 0}
                </div>
                <Link href="/approver/content?tab=suspended">
                  <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                    Content hub →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Challenge posts</CardTitle>
                <Trophy className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.challengePendingCount ?? 0
                  )}
                </div>
                <Link href="/approver/challenges?tab=pending-posts">
                  <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                    Challenges hub →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending documents</CardTitle>
                <FileText className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : pendingDocCount ?? "—"}
                </div>
                <Link href="/approver/challenges?tab=documents">
                  <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                    Document queue →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviewed today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.todayCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(stats?.approvedCount ?? 0) + (stats?.rejectedCount ?? 0)} all-time decisions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/approver/content")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Content Review
                </CardTitle>
                <CardDescription>
                  Suspended posts, general pending drafts, and your review history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-1">{stats?.suspendedCount ?? 0}</p>
                <p className="text-sm text-muted-foreground mb-4">suspended awaiting review</p>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Open Content Hub
                </Button>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/approver/challenges")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  Challenge Review
                </CardTitle>
                <CardDescription>
                  Moderated challenge drafts with participant documents, grouped by challenge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-1">{stats?.challengePendingCount ?? 0}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {stats?.challengeReviewedCount ?? 0} challenge posts reviewed all-time
                </p>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Open Challenges Hub
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
