"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useApproverAuth } from "@/components/approver-auth-provider"

// Redirect approver login to unified login page
export default function ApproverLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const onboarded = searchParams.get('onboarded')
  const { approver, isLoading: authLoading } = useApproverAuth()

  useEffect(() => {
    if (!authLoading) {
      if (approver) {
        router.push("/approver/dashboard")
      } else {
        // Redirect to unified login with onboarded param if present
        const params = onboarded ? '?onboarded=true' : ''
        router.push(`/${params}`)
      }
    }
  }, [approver, authLoading, router, onboarded])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
