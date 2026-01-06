"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("talentix_admin_token")
    const userData = localStorage.getItem("talentix_admin_user")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        // Set token in API client
        apiClient.setToken(token)
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem("talentix_admin_token")
        localStorage.removeItem("talentix_admin_user")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password)
      
      if (response.success && response.data) {
        const { accessToken, user } = response.data as { accessToken: string; user: any }
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.fullName || user.display_name,
          role: user.role,
        }
        setUser(userData)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
