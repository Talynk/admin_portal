import { redirect } from "next/navigation"

export default function ApproverPendingRedirect() {
  redirect("/approver/content?tab=pending")
}
