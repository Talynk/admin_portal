'use client'

import { useEffect, useRef } from 'react'
import { connectAdminNotificationsSocket, onAdminNotification } from '@/lib/admin-notifications-socket'
import type { AdminNotificationSocketPayload } from '@/lib/types/admin'

interface UseAdminNotificationsSocketOptions {
  onNotification: (payload: AdminNotificationSocketPayload) => void
  enabled?: boolean
}

export function useAdminNotificationsSocket({
  onNotification,
  enabled = true,
}: UseAdminNotificationsSocketOptions): void {
  const onNotificationRef = useRef(onNotification)
  onNotificationRef.current = onNotification

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const token = localStorage.getItem('talentix_admin_token')
    if (!token) return

    connectAdminNotificationsSocket(token)
    const unsubscribe = onAdminNotification((payload) => {
      onNotificationRef.current(payload)
    })

    return () => {
      unsubscribe()
    }
  }, [enabled])
}
