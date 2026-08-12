"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ApproverProtectedRoute } from "@/components/approver-protected-route"
import { ApproverLayout } from "@/components/approver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChallengePendingPostsQueue } from "@/components/challenge-pending-posts-queue"
import { ChallengeDocumentsQueue } from "@/components/challenge-documents-queue"
import { ChallengeModerationBadge } from "@/components/challenge-moderation-badge"
import { apiClient } from "@/lib/api-client"
import type { ChallengeContext, ChallengePendingPost, PendingDocumentItem } from "@/lib/types/challenge"
import { ArrowLeft, Loader2 } from "lucide-react"

function unwrapPosts(data: unknown): ChallengePendingPost[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.posts ?? payload.items ?? payload.data
  return Array.isArray(list) ? (list as ChallengePendingPost[]) : []
}

function unwrapDocuments(data: unknown): PendingDocumentItem[] {
  const raw = data as Record<string, unknown>
  const payload = (raw?.data ?? raw) as Record<string, unknown>
  const list = payload.documents ?? payload.items ?? payload.data
  return Array.isArray(list) ? (list as PendingDocumentItem[]) : []
}

export default function ApproverChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<ChallengeContext | null>(null)
  const [documentMeta, setDocumentMeta] = useState<{
    document_name?: string | null
    document_description?: string | null
  } | null>(null)

  useEffect(() => {
    if (!challengeId) return
    void (async () => {
      setLoading(true)
      try {
        const [postsRes, docsRes] = await Promise.all([
          apiClient.getApproverChallengePendingPosts({ challenge_id: challengeId, page: 1, limit: 1 }),
          apiClient.getApproverChallengePendingDocuments(challengeId, { page: 1, limit: 1 }),
        ])

        let nextContext: ChallengeContext | null = null

        if (postsRes.success && postsRes.data) {
          const posts = unwrapPosts(postsRes.data)
          nextContext = posts[0]?.challenge_context ?? null
        }

        if (docsRes.success && docsRes.data) {
          const docs = unwrapDocuments(docsRes.data)
          const challenge = docs[0]?.challenge
          if (challenge) {
            setDocumentMeta({
              document_name: challenge.document_name,
              document_description: challenge.document_description,
            })
            if (!nextContext) {
              nextContext = {
                challenge_id: challenge.id,
                challenge_name: challenge.name,
                moderation_mode: challenge.moderation_mode,
                challenge_status: challenge.status,
                requires_document: challenge.requires_document,
                document_name: challenge.document_name,
                document_description: challenge.document_description,
              }
            }
          }
        }

        setContext(nextContext)
      } finally {
        setLoading(false)
      }
    })()
  }, [challengeId])

  const headerName = context?.challenge_name ?? "Challenge"
  const aboutDescription = useMemo(
    () => documentMeta?.document_description ?? context?.document_description,
    [documentMeta, context]
  )

  return (
    <ApproverProtectedRoute>
      <ApproverLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/approver/challenges">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to challenges
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading challenge…
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{headerName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {context?.challenge_status ? (
                    <span className="text-sm capitalize text-muted-foreground">
                      {context.challenge_status}
                    </span>
                  ) : null}
                  <ChallengeModerationBadge
                    mode={context?.moderation_mode}
                    requiresDocument={context?.requires_document}
                  />
                </div>
                <p className="text-muted-foreground mt-2">
                  Review pending posts and documents for this challenge only.
                </p>
              </div>

              <Tabs defaultValue="pending-posts">
                <TabsList>
                  <TabsTrigger value="pending-posts">Pending posts</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>

                <TabsContent value="pending-posts" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending posts</CardTitle>
                      <CardDescription>Draft submissions awaiting moderation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChallengePendingPostsQueue
                        portal="approver"
                        source="challenge-queue"
                        challengeId={challengeId}
                        linkChallengeToApprover
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending documents</CardTitle>
                      <CardDescription>Participant documents for this challenge</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChallengeDocumentsQueue portal="approver" challengeId={challengeId} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="about" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document requirements</CardTitle>
                      <CardDescription>
                        What the organizer asked participants to submit
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {context?.requires_document || documentMeta?.document_name ? (
                        <>
                          <p>
                            <span className="font-medium">Document: </span>
                            {documentMeta?.document_name ??
                              context?.document_name ??
                              "Required document"}
                          </p>
                          {aboutDescription ? (
                            <p>
                              <span className="font-medium">Instructions: </span>
                              {aboutDescription}
                            </p>
                          ) : null}
                          <p className="text-muted-foreground">
                            Participants submit the document once after joining and may start posting
                            immediately. Review the document alongside their posts — rejection does
                            not remove existing posts.
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          This challenge does not require a participant document, or none is on
                          record yet.
                        </p>
                      )}
                      <Button variant="outline" onClick={() => router.push("/approver/challenges")}>
                        Return to all challenges
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </ApproverLayout>
    </ApproverProtectedRoute>
  )
}
