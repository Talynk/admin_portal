import { redirect } from "next/navigation"

export default function ApproverSuspendedRedirect() {
  redirect("/approver/content?tab=suspended")
}
