"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApproverPostReviewQueue } from "@/components/approver-post-review-queue"

type ContentTab = "suspended" | "pending" | "reviewed"

export default function ApproverContentPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<ContentTab>("suspended")

  useEffect(() => {
    if (tabParam === "pending" || tabParam === "reviewed" || tabParam === "suspended") {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Review</h1>
            <p className="text-muted-foreground">
              Review suspended posts and general draft submissions. For moderated challenge drafts
              with participant documents, use the Challenges hub.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ContentTab)}
          >
            <TabsList>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
              <TabsTrigger value="pending">Pending drafts</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            </TabsList>

            <TabsContent value="suspended" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suspended posts</CardTitle>
                  <CardDescription>
                    Posts flagged by moderators or with multiple reports awaiting your decision.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApproverPostReviewQueue variant="suspended" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending drafts</CardTitle>
                  <CardDescription>
                    All draft posts from the general pending queue. Toggle challenge-only to focus
                    on challenge submissions — use Challenges → Pending posts for the full
                    moderated queue with participant documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApproverPostReviewQueue variant="pending" showChallengeOnlyToggle />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviewed" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review history</CardTitle>
                  <CardDescription>Posts you have previously approved.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ApproverPostReviewQueue variant="approved" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
