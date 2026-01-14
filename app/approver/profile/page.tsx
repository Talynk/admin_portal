"use client"

import { useState, useEffect } from "react"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useApproverAuth } from "@/components/approver-auth-provider"
import { apiClient } from "@/lib/api-client"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  Loader2,
  Shield
} from "lucide-react"

export default function ApproverProfilePage() {
  const { approver } = useApproverAuth()
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
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              View your personal information and work statistics
            </p>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error loading profile</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">
                      {approver?.first_name} {approver?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{approver?.email}</p>
                  </div>
                </div>
                {approver?.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{approver.phone_number}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge 
                      variant={approver?.status === 'active' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {approver?.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Work Statistics
                </CardTitle>
                <CardDescription>Your review performance</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Total Approved</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.approvedCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Total Rejected</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.rejectedCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Pending Reviews</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.pendingCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Today's Reviews</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.todayCount || 0}</span>
                    </div>
                    {stats.approvedCount > 0 && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Approval Rate</span>
                          <span className="text-lg font-bold">
                            {Math.round(
                              (stats.approvedCount / (stats.approvedCount + stats.rejectedCount)) * 100
                            )}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
