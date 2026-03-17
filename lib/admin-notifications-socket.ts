/**
 * Admin Notifications Socket.IO client
 * Connects to the same origin as the REST API; auth with admin JWT to receive admin:notification events.
 * @see ADMIN_NOTIFICATIONS_INTEGRATION_GUIDE.md
 */

import { io, type Socket } from 'socket.io-client'
import type { AdminNotificationSocketPayload } from '@/lib/types/admin'

let socket: Socket | null = null
const notificationListeners: Set<(payload: AdminNotificationSocketPayload) => void> = new Set()

function getSocketServerUrl(): string {
  if (typeof window === 'undefined') return ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.talentix.net/api'
  try {
    const url = new URL(apiUrl)
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('talentix_admin_token')
}

export function connectAdminNotificationsSocket(token: string): void {
  const serverUrl = getSocketServerUrl()
  if (!serverUrl || !token) return

  if (socket?.connected) {
    socket.emit('admin:auth', { token })
    return
  }

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  socket = io(serverUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  socket.on('connect', () => {
    socket?.emit('admin:auth', { token })
  })

  socket.on('admin:auth', (res: { ok?: boolean }) => {
    if (res?.ok !== true) {
      console.warn('[Admin Notifications Socket] Auth failed or invalid token')
    }
  })

  socket.on('admin:notification', (payload: AdminNotificationSocketPayload) => {
    notificationListeners.forEach((cb) => {
      try {
        cb(payload)
      } catch (e) {
        console.error('[Admin Notifications Socket] Listener error:', e)
      }
    })
  })

  socket.on('connect_error', (err) => {
    console.warn('[Admin Notifications Socket] Connect error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socket?.connect()
    }
  })
}

export function onAdminNotification(cb: (payload: AdminNotificationSocketPayload) => void): () => void {
  notificationListeners.add(cb)
  return () => {
    notificationListeners.delete(cb)
  }
}

export function disconnectAdminNotificationsSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  notificationListeners.clear()
}

export function isAdminNotificationsSocketConnected(): boolean {
  return socket?.connected ?? false
}
