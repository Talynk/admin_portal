"use client"

import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChallengeDocumentsQueue } from "@/components/challenge-documents-queue"

export default function ApproverChallengeDocumentsPage() {
  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Challenge Documents</h1>
            <p className="text-muted-foreground">
              Review required participant documents before they can submit challenge posts.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending documents</CardTitle>
              <CardDescription>
                Approve or reject participant documents across all challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallengeDocumentsQueue portal="approver" />
            </CardContent>
          </Card>
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
