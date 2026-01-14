"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface Approver {
  id: string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  status: string
  role: 'approver'
}

interface ApproverAuthContextType {
  approver: Approver | null
  isLoading: boolean
  login: (loginValue: string, password: string, loginType?: 'email' | 'username') => Promise<boolean>
  logout: () => void
}

const ApproverAuthContext = createContext<ApproverAuthContextType | undefined>(undefined)

export function ApproverAuthProvider({ children }: { children: ReactNode }) {
  const [approver, setApprover] = useState<Approver | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing approver session
    const token = localStorage.getItem('talentix_approver_token')
    const approverData = localStorage.getItem('talentix_approver_user')

    if (token && approverData) {
      try {
        const parsedApprover = JSON.parse(approverData)
        setApprover(parsedApprover)
        // Set token in API client
        apiClient.setApproverToken(token)
        apiClient.refreshApproverToken()
      } catch (error) {
        // Invalid approver data, clear storage
        localStorage.removeItem('talentix_approver_token')
        localStorage.removeItem('talentix_approver_refresh_token')
        localStorage.removeItem('talentix_approver_user')
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (loginValue: string, password: string, loginType: 'email' | 'username' = 'email'): Promise<boolean> => {
    try {
      const response = await apiClient.approverLogin(loginValue, password, loginType)
      
      if (response.success && response.data) {
        const { accessToken, user } = response.data as { accessToken: string; user: any }
        const approverData: Approver = {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          status: user.status,
          role: 'approver',
        }
        setApprover(approverData)
        return true
      }
      return false
    } catch (error) {
      console.error('Approver login error:', error)
      return false
    }
  }

  const logout = () => {
    apiClient.logout()
    localStorage.removeItem('talentix_approver_token')
    localStorage.removeItem('talentix_approver_refresh_token')
    localStorage.removeItem('talentix_approver_user')
    setApprover(null)
    router.push('/approver/login')
  }

  return (
    <ApproverAuthContext.Provider value={{ approver, isLoading, login, logout }}>
      {children}
    </ApproverAuthContext.Provider>
  )
}

export function useApproverAuth() {
  const context = useContext(ApproverAuthContext)
  if (context === undefined) {
    throw new Error('useApproverAuth must be used within an ApproverAuthProvider')
  }
  return context
}
