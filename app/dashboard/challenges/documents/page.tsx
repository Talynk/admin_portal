"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ChallengeDocumentsQueue } from "@/components/challenge-documents-queue"

export default function ChallengeDocumentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/challenges">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Challenges
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pending documents</h1>
              <p className="text-muted-foreground text-sm">
                Global queue for participant document review
              </p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Document review queue</CardTitle>
              <CardDescription>
                Approve or reject required documents before participants can submit posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallengeDocumentsQueue portal="admin" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
