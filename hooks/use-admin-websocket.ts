import { useEffect, useRef, useCallback } from 'react'
import {
  AdminWebSocket,
  DashboardUpdateData,
  NewUserData,
  NewPostData,
  NewReportData,
  type ChallengeUpdatedData,
} from '@/lib/websocket-client'

interface UseAdminWebSocketOptions {
  adminId: string | null
  token: string | null
  enabled?: boolean
  onDashboardUpdate?: (data: DashboardUpdateData) => void
  onNewUser?: (data: NewUserData) => void
  onNewPost?: (data: NewPostData) => void
  onNewReport?: (data: NewReportData) => void
  onChallengeUpdated?: (data: ChallengeUpdatedData) => void
}

export function useAdminWebSocket({
  adminId,
  token,
  enabled = true,
  onDashboardUpdate,
  onNewUser,
  onNewPost,
  onNewReport,
  onChallengeUpdated,
}: UseAdminWebSocketOptions) {
  const wsRef = useRef<AdminWebSocket | null>(null)
  const callbacksRef = useRef({
    onDashboardUpdate,
    onNewUser,
    onNewPost,
    onNewReport,
    onChallengeUpdated,
  })

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onDashboardUpdate,
      onNewUser,
      onNewPost,
      onNewReport,
      onChallengeUpdated,
    }
  }, [onDashboardUpdate, onNewUser, onNewPost, onNewReport, onChallengeUpdated])

  useEffect(() => {
    if (!enabled || !adminId || !token) {
      return
    }

    // Create WebSocket instance
    wsRef.current = new AdminWebSocket(adminId, token)

    // Set up event listeners
    if (callbacksRef.current.onDashboardUpdate) {
      wsRef.current.on('dashboardUpdate', (data) => {
        callbacksRef.current.onDashboardUpdate?.(data)
      })
    }

    if (callbacksRef.current.onNewUser) {
      wsRef.current.on('newUser', (data) => {
        callbacksRef.current.onNewUser?.(data)
      })
    }

    if (callbacksRef.current.onNewPost) {
      wsRef.current.on('newPost', (data) => {
        callbacksRef.current.onNewPost?.(data)
      })
    }

    if (callbacksRef.current.onNewReport) {
      wsRef.current.on('newReport', (data) => {
        callbacksRef.current.onNewReport?.(data)
      })
    }

    wsRef.current.on('challengeUpdated', (data) => {
      callbacksRef.current.onChallengeUpdated?.(data)
    })

    // Connect
    wsRef.current.connect()

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [enabled, adminId, token])

  const reconnect = useCallback(() => {
    if (wsRef.current && adminId && token) {
      wsRef.current.disconnect()
      wsRef.current = new AdminWebSocket(adminId, token)
      wsRef.current.connect()
    }
  }, [adminId, token])

  const isConnected = useCallback(() => {
    return wsRef.current?.isConnected() ?? false
  }, [])

  return {
    reconnect,
    isConnected,
  }
}
