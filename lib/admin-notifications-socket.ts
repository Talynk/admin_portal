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
  // Optional: use a dedicated Socket.IO URL (e.g. if realtime runs on a different host/path)
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_IO_URL
  if (socketUrl && socketUrl.startsWith('http')) {
    try {
      const url = new URL(socketUrl)
      return `${url.protocol}//${url.host}`
    } catch {
      // fall through to API-derived URL
    }
  }
  // Same host as REST API (e.g. https://api.talentix.net when NEXT_PUBLIC_API_URL=https://api.talentix.net/api)
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
    socket.emit('admin:auth', { token: `Bearer ${token}` })
    return
  }

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  const socketPath = process.env.NEXT_PUBLIC_SOCKET_IO_PATH || '/socket.io'
  socket = io(serverUrl, {
    path: socketPath,
    // Try polling first to avoid "Invalid frame header" when proxy/load balancer doesn't handle raw WebSocket
    transports: ['polling', 'websocket'],
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    auth: {
      token: `Bearer ${token}`,
    },
  })

  socket.connect()

  socket.on('connect', () => {
    socket?.emit('admin:auth', { token: `Bearer ${token}` })
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

  let lastConnectErrorLog = 0
  socket.on('connect_error', (err) => {
    const now = Date.now()
    if (now - lastConnectErrorLog > 15000) {
      lastConnectErrorLog = now
      console.warn('[Admin Notifications Socket] Connect error:', err.message)
    }
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
