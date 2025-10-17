const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ApiError {
  success: false
  error: string
  message?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('talynk_admin_token')
    }
  }

  setToken(token: string) {
    this.token = token
  }

  refreshToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('talynk_admin_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T> | ApiError> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          this.logout()
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        }
        
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          message: data.message,
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: 'admin' }),
    })

    if (response.success && response.data) {
      // Store token and user data
      const { accessToken, user } = response.data as { accessToken: string; user: any }
      this.setToken(accessToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem('talynk_admin_token', accessToken)
        localStorage.setItem('talynk_admin_user', JSON.stringify(user))
      }
    }

    return response
  }

  async logout() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talynk_admin_token')
      localStorage.removeItem('talynk_admin_user')
    }
  }

  // User Management Endpoints
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    role?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.role) queryParams.append('role', params.role)

    const queryString = queryParams.toString()
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`)
  }

  async getUserById(userId: string) {
    return this.request(`/admin/users/${userId}`)
  }

  async createUser(userData: {
    username: string
    email: string
    fullName: string
    role?: string
  }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: {
    username?: string
    email?: string
    fullName?: string
    role?: string
    status?: string
    verified?: boolean
  }) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async suspendUser(userId: string, reason?: string) {
    return this.request('/admin/accounts/manage', {
      method: 'POST',
      body: JSON.stringify({ userId, action: 'suspend', reason }),
    })
  }

  async activateUser(userId: string, reason?: string) {
    return this.request('/admin/accounts/manage', {
      method: 'POST',
      body: JSON.stringify({ userId, action: 'activate', reason }),
    })
  }

  // Posts Management Endpoints
  async getPosts(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    userId?: string
    flagged?: boolean
    featured?: boolean
    frozen?: boolean
    category?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.flagged !== undefined) queryParams.append('flagged', params.flagged.toString())
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString())
    if (params?.frozen !== undefined) queryParams.append('frozen', params.frozen.toString())
    if (params?.category) queryParams.append('category', params.category)

    const queryString = queryParams.toString()
    return this.request(`/posts/all${queryString ? `?${queryString}` : ''}`)
  }

  async getPostById(postId: string) {
    return this.request(`/admin/videos/${postId}`)
  }

  async updatePost(postId: string, postData: {
    title?: string
    description?: string
    status?: string
    featured?: boolean
    frozen?: boolean
    moderationNotes?: string
  }) {
    return this.request(`/admin/videos/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  }

  async deletePost(postId: string) {
    return this.request(`/admin/videos/${postId}`, {
      method: 'DELETE',
    })
  }

  async approvePost(postId: string, reason?: string) {
    return this.request('/admin/approve', {
      method: 'PUT',
      body: JSON.stringify({ postId, status: 'approved', adminNotes: reason }),
    })
  }

  async rejectPost(postId: string, reason: string) {
    return this.request('/admin/approve', {
      method: 'PUT',
      body: JSON.stringify({ postId, status: 'rejected', adminNotes: reason }),
    })
  }

  async freezePost(postId: string, reason?: string) {
    return this.request(`/admin/videos/${postId}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async unfreezePost(postId: string, reason?: string) {
    return this.request(`/admin/videos/${postId}/unfreeze`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async featurePost(postId: string, reason?: string) {
    return this.request(`/admin/videos/${postId}/feature`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async unfeaturePost(postId: string, reason?: string) {
    return this.request(`/admin/videos/${postId}/unfeature`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async flagPost(postId: string, reason: string) {
    return this.request(`/admin/videos/${postId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async unflagPost(postId: string, reason?: string) {
    return this.request(`/admin/videos/${postId}/unflag`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // Analytics Endpoints
  async getAnalytics(params?: {
    startDate?: string
    endDate?: string
    metric?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.metric) queryParams.append('metric', params.metric)

    const queryString = queryParams.toString()
    return this.request(`/admin/analytics${queryString ? `?${queryString}` : ''}`)
  }

  async getDashboardStats() {
    return this.request('/admin/dashboard/stats')
  }

  // Activity Logs
  async getActivityLogs(params?: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    startDate?: string
    endDate?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.action) queryParams.append('action', params.action)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const queryString = queryParams.toString()
    return this.request(`/admin/activity${queryString ? `?${queryString}` : ''}`)
  }

  // Reports
  async getReports(params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    startDate?: string
    endDate?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const queryString = queryParams.toString()
    return this.request(`/admin/reports${queryString ? `?${queryString}` : ''}`)
  }

  async getReportById(reportId: string) {
    return this.request(`/admin/reports/${reportId}`)
  }

  async updateReportStatus(reportId: string, status: string, resolution?: string) {
    return this.request(`/admin/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    })
  }

  // Approvers Management
  async getApprovers(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request(`/admin/approvers${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverById(approverId: string) {
    return this.request(`/admin/approvers/${approverId}`)
  }

  async createApprover(approverData: {
    username: string
    email: string
    fullName: string
    department?: string
    level?: number
  }) {
    return this.request('/admin/approvers', {
      method: 'POST',
      body: JSON.stringify(approverData),
    })
  }

  async updateApprover(approverId: string, approverData: {
    username?: string
    email?: string
    fullName?: string
    department?: string
    level?: number
    status?: string
  }) {
    return this.request(`/admin/approvers/${approverId}`, {
      method: 'PUT',
      body: JSON.stringify(approverData),
    })
  }

  async deleteApprover(approverId: string) {
    return this.request(`/admin/approvers/${approverId}`, {
      method: 'DELETE',
    })
  }

  async assignApprover(postId: string, approverId: string) {
    return this.request(`/admin/posts/${postId}/assign-approver`, {
      method: 'POST',
      body: JSON.stringify({ approverId }),
    })
  }

  // Notifications
  async getNotifications(params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    priority?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)

    const queryString = queryParams.toString()
    return this.request(`/admin/notifications${queryString ? `?${queryString}` : ''}`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/admin/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  async markAllNotificationsAsRead() {
    return this.request('/admin/notifications/read-all', {
      method: 'PUT',
    })
  }

  // Settings
  async getSettings() {
    return this.request('/admin/settings')
  }

  async updateSettings(settings: Record<string, any>) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(BASE_URL)

// Export types for use in components
export type { ApiResponse, ApiError }
