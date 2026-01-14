import type React from "react"
import { ApproverAuthProvider } from "@/components/approver-auth-provider"

export default function ApproverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ApproverAuthProvider>{children}</ApproverAuthProvider>
}
