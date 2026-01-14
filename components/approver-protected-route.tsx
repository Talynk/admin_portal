"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApproverAuth } from "./approver-auth-provider"

export function ApproverProtectedRoute({ children }: { children: React.ReactNode }) {
  const { approver, isLoading } = useApproverAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !approver) {
      router.push("/approver/login")
    }
  }, [approver, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!approver) {
    return null
  }

  return <>{children}</>
}
