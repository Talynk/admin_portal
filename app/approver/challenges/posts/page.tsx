import { redirect } from "next/navigation"

export default function ApproverChallengePostsRedirect() {
  redirect("/approver/challenges?tab=pending-posts")
}
