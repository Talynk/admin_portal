/**
 * Admin WebSocket Client
 * Handles real-time updates for admin dashboard
 */

export type WebSocketMessageType =
  | 'admin:dashboardUpdate'
  | 'admin:newUser'
  | 'admin:newPost'
  | 'admin:newReport'

export interface WebSocketMessage {
  type: WebSocketMessageType
  data: any
  timestamp?: number
}

export interface DashboardUpdateData {
  users?: {
    total?: number
    active?: number
    newToday?: number
  }
  posts?: {
    total?: number
    pending?: number
  }
  views?: {
    totalViews?: number
    viewsToday?: number
  }
  reports?: {
    pending?: number
  }
}

export interface NewUserData {
  userId: string
  username: string
  email: string
  timestamp: string
}

export interface NewPostData {
  postId: string
  userId: string
  username: string
  status: string
  timestamp: string
}

export interface NewReportData {
  reportId: string
  postId: string
  reason: string
  timestamp: string
}

type EventListener = (data: any) => void

export class AdminWebSocket {
  private adminId: string
  private token: string
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: {
    dashboardUpdate: EventListener[]
    newUser: EventListener[]
    newPost: EventListener[]
    newReport: EventListener[]
  } = {
    dashboardUpdate: [],
    newUser: [],
    newPost: [],
    newReport: [],
  }
  private isConnecting = false
  private shouldReconnect = true

  constructor(adminId: string, token: string) {
    this.adminId = adminId
    this.token = token
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    this.shouldReconnect = true

    // Determine WebSocket URL based on environment
    const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.talentix.net/api'
    
    // Extract base URL without protocol
    const baseUrl = apiBaseUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '')
    const wsUrl = `${wsProtocol}//${baseUrl.replace('/api', '')}/ws?userId=${this.adminId}&token=${this.token}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[Admin WS] Connected')
        this.reconnectAttempts = 0
        this.isConnecting = false

        // Subscribe to admin updates
        this.ws?.send(
          JSON.stringify({
            type: 'subscribe',
            data: { channel: 'admin' },
          })
        )
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[Admin WS] Error parsing message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[Admin WS] Error:', error)
        this.isConnecting = false
      }

      this.ws.onclose = () => {
        console.log('[Admin WS] Disconnected')
        this.isConnecting = false
        this.ws = null

        if (this.shouldReconnect) {
          this.reconnect()
        }
      }
    } catch (error) {
      console.error('[Admin WS] Connection error:', error)
      this.isConnecting = false
      if (this.shouldReconnect) {
        this.reconnect()
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'admin:dashboardUpdate':
        this.listeners.dashboardUpdate.forEach((cb) => cb(message.data))
        break
      case 'admin:newUser':
        this.listeners.newUser.forEach((cb) => cb(message.data))
        break
      case 'admin:newPost':
        this.listeners.newPost.forEach((cb) => cb(message.data))
        break
      case 'admin:newReport':
        this.listeners.newReport.forEach((cb) => cb(message.data))
        break
      default:
        console.warn('[Admin WS] Unknown message type:', message.type)
    }
  }

  on(event: 'dashboardUpdate', callback: (data: DashboardUpdateData) => void): void
  on(event: 'newUser', callback: (data: NewUserData) => void): void
  on(event: 'newPost', callback: (data: NewPostData) => void): void
  on(event: 'newReport', callback: (data: NewReportData) => void): void
  on(event: string, callback: EventListener): void {
    if (this.listeners[event as keyof typeof this.listeners]) {
      this.listeners[event as keyof typeof this.listeners].push(callback)
    }
  }

  off(event: 'dashboardUpdate', callback: EventListener): void
  off(event: 'newUser', callback: EventListener): void
  off(event: 'newPost', callback: EventListener): void
  off(event: 'newReport', callback: EventListener): void
  off(event: string, callback: EventListener): void {
    if (this.listeners[event as keyof typeof this.listeners]) {
      this.listeners[event as keyof typeof this.listeners] = this.listeners[
        event as keyof typeof this.listeners
      ].filter((cb) => cb !== callback)
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Admin WS] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)

    console.log(`[Admin WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect()
      }
    }, delay)
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
