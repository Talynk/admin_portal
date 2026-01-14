"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Loader2, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

export default function ApproverOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid onboarding link. Please contact your administrator.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const response = await apiClient.completeApproverOnboarding({
        token,
        ...formData,
      })

      if (response.success) {
        setSuccess(true)
        toast({
          title: "Success",
          description: "Onboarding completed successfully! Redirecting to login...",
        })
        setTimeout(() => {
          router.push('/?onboarded=true')
        }, 2000)
      } else {
        setError(response.error || response.message || 'Onboarding failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Invalid onboarding link. Please contact your administrator.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Onboarding Complete!</h2>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Complete Your Approver Onboarding
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Set up your account to start reviewing posts
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Enter your first name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Enter your last name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete Onboarding"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
