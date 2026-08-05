"use client"

import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChallengePendingPostsQueue } from "@/components/challenge-pending-posts-queue"

export default function ApproverChallengePostsPage() {
  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Challenge Posts</h1>
            <p className="text-muted-foreground">
              Review moderated challenge draft submissions before they go live.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending challenge posts</CardTitle>
              <CardDescription>
                Draft posts on moderated challenges awaiting your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallengePendingPostsQueue
                portal="approver"
                source="challenge-queue"
                showFilters
              />
            </CardContent>
          </Card>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
