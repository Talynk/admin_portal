import { redirect } from "next/navigation"

export default function ApproverFlaggedRedirect() {
  redirect("/approver/content?tab=suspended")
}
