import { redirect } from "next/navigation"

export default function ApproverChallengeDocumentsRedirect() {
  redirect("/approver/challenges?tab=documents")
}
