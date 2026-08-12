import { redirect } from "next/navigation"

export default function ApproverApprovedRedirect() {
  redirect("/approver/content?tab=reviewed")
}
