"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApproverAuth } from "@/components/approver-auth-provider"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  Flag,
  Ban
} from "lucide-react"
import Link from "next/link"

export default function ApproverDashboardPage() {
  const { approver } = useApproverAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getApproverPortalStats()
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || 'Failed to load stats')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the Approver Portal. Review suspended posts (flagged by admin/approver or with 5+ reports).
            </p>
          </div>
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error loading statistics</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStats}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended Posts</CardTitle>
                <Ban className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.suspendedCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Posts suspended (flagged or reported)</p>
                <Link href="/approver/posts/suspended">
                  <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                    Review Now →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.todayCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">Posts reviewed today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviewed</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.approvedCount || 0) + (stats?.rejectedCount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time reviewed</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/approver/posts/suspended')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  Suspended Posts
                </CardTitle>
                <CardDescription>Review suspended posts (flagged by admin/approver or with 5+ reports)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.suspendedCount || 0}</p>
                <Button variant="outline" className="w-full mt-4">
                  <Eye className="w-4 h-4 mr-2" />
                  Review Suspended
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
