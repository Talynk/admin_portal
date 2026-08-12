"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChallengePendingPostsQueue } from "@/components/challenge-pending-posts-queue"
import { ChallengeDocumentsQueue } from "@/components/challenge-documents-queue"
import {
  ApproverChallengeOverview,
  useApproverChallengeFilterOptions,
} from "@/components/approver-challenge-overview"
import { apiClient } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

type ChallengeTab = "overview" | "pending-posts" | "documents"

export default function ApproverChallengesPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<ChallengeTab>("overview")
  const [stats, setStats] = useState<{ challengePendingCount?: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const challengeFilterOptions = useApproverChallengeFilterOptions()

  useEffect(() => {
    if (tabParam === "pending-posts" || tabParam === "documents" || tabParam === "overview") {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    void apiClient.getApproverPortalStats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data as { challengePendingCount?: number })
      }
      setStatsLoading(false)
    })
  }, [])

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Challenge Review</h1>
            <p className="text-muted-foreground">
              Review moderated challenge drafts and required participant documents in one place.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending challenge posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.challengePendingCount ?? 0
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">How this differs from Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This queue includes participant documents on each card so you can judge post and
                  document together.
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChallengeTab)}>
            <TabsList>
              <TabsTrigger value="overview">By challenge</TabsTrigger>
              <TabsTrigger value="pending-posts">Pending posts</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Challenges with pending work</CardTitle>
                  <CardDescription>
                    Grouped from the global pending-posts and documents queues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApproverChallengeOverview />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending-posts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending challenge posts</CardTitle>
                  <CardDescription>
                    Moderated challenge drafts awaiting approval — includes participant documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChallengePendingPostsQueue
                    portal="approver"
                    source="challenge-queue"
                    linkChallengeToApprover
                    challengeFilterOptions={challengeFilterOptions}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending participant documents</CardTitle>
                  <CardDescription>
                    Required documents submitted after joining a challenge
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChallengeDocumentsQueue portal="approver" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
