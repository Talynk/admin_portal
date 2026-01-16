const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.talentix.net/api'

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
      this.token = localStorage.getItem('talentix_admin_token')
    }
  }

  setToken(token: string) {
    this.token = token
  }

  setApproverToken(token: string) {
    this.token = token
  }

  refreshToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('talentix_admin_token')
    }
  }

  refreshApproverToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('talentix_approver_token')
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

    // Check for approver token for approver routes, otherwise use admin token
    let token = this.token
    if (typeof window !== 'undefined' && endpoint.startsWith('/approver/')) {
      const approverToken = localStorage.getItem('talentix_approver_token')
      if (approverToken) {
        token = approverToken
      } else {
        // If no approver token but endpoint is approver route, refresh
        this.refreshApproverToken()
        token = this.token
      }
    } else {
      // For non-approver routes, use admin token
      this.refreshToken()
      token = this.token
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
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
        localStorage.setItem('talentix_admin_token', accessToken)
        localStorage.setItem('talentix_admin_user', JSON.stringify(user))
      }
    }

    return response
  }

  // Unified login - tries both admin and approver, returns role info
  async unifiedLogin(email: string, password: string) {
    const url = `${this.baseURL}/auth/login`
    
    // Try admin login first
    try {
      const adminResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: 'admin' }),
      })

      const adminData = await adminResponse.json()

      if (adminResponse.ok && adminData.status === 'success' && adminData.data) {
        const { accessToken, token, user } = adminData.data
        const accessTokenValue = accessToken || token
        const role = user?.role || 'admin'
        
        if (role === 'admin' && accessTokenValue) {
          this.setToken(accessTokenValue)
          if (typeof window !== 'undefined') {
            localStorage.setItem('talentix_admin_token', accessTokenValue)
            localStorage.setItem('talentix_admin_user', JSON.stringify(user))
          }
          return { success: true, role: 'admin', data: adminData.data }
        }
      }
    } catch (error) {
      // Continue to try approver login
    }

    // Try approver login
    try {
      const approverResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: 'approver' }),
      })

      const approverData = await approverResponse.json()

      if (approverResponse.ok && approverData.status === 'success' && approverData.data) {
        const { accessToken, token, refreshToken, user, approver } = approverData.data
        const accessTokenValue = accessToken || token
        const userData = user || approver
        
        if (accessTokenValue) {
          this.setApproverToken(accessTokenValue)
          if (typeof window !== 'undefined') {
            localStorage.setItem('talentix_approver_token', accessTokenValue)
            if (refreshToken) {
              localStorage.setItem('talentix_approver_refresh_token', refreshToken)
            }
            if (userData) {
              localStorage.setItem('talentix_approver_user', JSON.stringify(userData))
            }
          }
          return { success: true, role: 'approver', data: approverData.data }
        }
      }
    } catch (error) {
      // Both failed
    }

    return { success: false, error: 'Invalid credentials' }
  }

  async logout() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentix_admin_token')
      localStorage.removeItem('talentix_admin_user')
    }
  }

  approverLogout() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('talentix_approver_token')
      localStorage.removeItem('talentix_approver_refresh_token')
      localStorage.removeItem('talentix_approver_user')
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

  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended') {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
      body: JSON.stringify({ id: userId, action: 'freeze', reason }),
    })
  }

  async activateUser(userId: string, reason?: string) {
    return this.request('/admin/accounts/manage', {
      method: 'POST',
      body: JSON.stringify({ id: userId, action: 'reactivate', reason }),
    })
  }

  async getUserStats(params?: {
    period?: '7d' | '30d' | '90d' | '1y'
  }) {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.append('period', params.period)

    const queryString = queryParams.toString()
    return this.request(`/admin/users/stats${queryString ? `?${queryString}` : ''}`)
  }

  async getUserAnalytics(userId: string) {
    return this.request(`/admin/users/${userId}/analytics`)
  }

  // Challenge Management Endpoints
  async getChallenges(params?: {
    page?: number
    limit?: number
    status?: 'pending' | 'approved' | 'active' | 'rejected' | 'ended'
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request(`/admin/challenges${queryString ? `?${queryString}` : ''}`)
  }

  async getPendingChallenges(params?: {
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return this.request(`/admin/challenges/pending${queryString ? `?${queryString}` : ''}`)
  }

  async getChallengeDashboardStats() {
    return this.request('/admin/challenges/dashboard/stats')
  }

  async getChallengeGrowthAnalytics(params?: {
    days?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.days) queryParams.append('days', params.days.toString())

    const queryString = queryParams.toString()
    return this.request(`/admin/challenges/growth-analytics${queryString ? `?${queryString}` : ''}`)
  }

  async getChallengeById(challengeId: string) {
    return this.request(`/admin/challenges/${challengeId}`)
  }

  async getChallengeAnalytics(challengeId: string, params?: {
    days?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.days) queryParams.append('days', params.days.toString())

    const queryString = queryParams.toString()
    return this.request(`/admin/challenges/${challengeId}/analytics${queryString ? `?${queryString}` : ''}`)
  }

  async approveChallenge(challengeId: string) {
    return this.request(`/admin/challenges/${challengeId}/approve`, {
      method: 'PUT',
    })
  }

  async rejectChallenge(challengeId: string, reason?: string) {
    return this.request(`/admin/challenges/${challengeId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
  }

  async stopChallenge(challengeId: string) {
    return this.request(`/admin/challenges/${challengeId}/stop`, {
      method: 'PUT',
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

  async getPostsAnalytics(params?: {
    page?: number
    limit?: number
    status?: 'all' | 'active' | 'draft' | 'suspended'
    sort?: 'newest' | 'oldest' | 'most_liked' | 'most_viewed' | 'most_reported'
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.sort) queryParams.append('sort', params.sort)

    const queryString = queryParams.toString()
    return this.request(`/admin/posts/analytics${queryString ? `?${queryString}` : ''}`)
  }

  async getPostById(postId: string) {
    return this.request(`/admin/videos/${postId}`)
  }

  async getPostAnalytics(postId: string) {
    return this.request(`/admin/posts/${postId}/analytics`)
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

  async updatePostStatus(postId: string, status: 'active' | 'suspended' | 'draft', reason?: string) {
    return this.request(`/admin/posts/${postId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
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
      body: JSON.stringify({ postId, status: 'active', adminNotes: reason }),
    })
  }

  async rejectPost(postId: string, reason: string) {
    return this.request('/admin/approve', {
      method: 'PUT',
      body: JSON.stringify({ postId, status: 'suspended', adminNotes: reason }),
    })
  }

  async freezePost(postId: string, reason?: string) {
    return this.request(`/admin/posts/${postId}/freeze`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
  }

  async unfreezePost(postId: string, reason?: string) {
    return this.request(`/admin/posts/${postId}/unfreeze`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
  }

  async setPostFeatured(postId: string, featured: boolean) {
    return this.request(`/admin/posts/${postId}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured }),
    })
  }

  async getPostReports(postId: string) {
    return this.request(`/admin/posts/${postId}/reports`)
  }

  // Featured Posts Management (using new API endpoints)
  async getFeaturedPosts(params?: {
    page?: number
    limit?: number
    active?: boolean
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.active !== undefined) queryParams.append('active', params.active.toString())

    const queryString = queryParams.toString()
    return this.request(`/featured/admin${queryString ? `?${queryString}` : ''}`)
  }

  async featurePost(postId: string, data?: {
    reason?: string
    expiresAt?: string
  }) {
    // Use the simpler alternative endpoint that directly updates is_featured flag
    // Note: This doesn't create a FeaturedPost entry or send notifications
    return this.request(`/admin/posts/${postId}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured: true }),
    })
  }

  async unfeaturePost(postId: string) {
    // Use the simpler alternative endpoint that directly updates is_featured flag
    return this.request(`/admin/posts/${postId}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured: false }),
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
    period?: '1h' | '1d' | '7d' | '1m' | '3m' | '1y'
    startDate?: string
    endDate?: string
    metric?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.append('period', params.period)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.metric) queryParams.append('metric', params.metric)

    const queryString = queryParams.toString()
    return this.request(`/admin/analytics${queryString ? `?${queryString}` : ''}`)
  }

  async getDashboardStats(params?: {
    period?: '1h' | '1d' | '7d' | '1m' | '3m' | '1y'
  }) {
    const queryParams = new URLSearchParams()
    if (params?.period) queryParams.append('period', params.period)

    const queryString = queryParams.toString()
    return this.request(`/admin/dashboard/stats${queryString ? `?${queryString}` : ''}`)
  }

  async getDashboardActivity(params?: {
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return this.request(`/admin/dashboard/activity${queryString ? `?${queryString}` : ''}`)
  }

  async getContentManagementStats() {
    return this.request('/admin/content-management/stats')
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

  // Admin Approver Management
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

  async createApproverInvitation(email: string) {
    return this.request('/admin/approvers', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async getApproverStats(approverId: string) {
    return this.request(`/admin/approvers/${approverId}/stats`)
  }

  async getApproverAnalytics(approverId: string) {
    return this.request(`/admin/approvers/${approverId}/analytics`)
  }

  async getApproverReviewedPosts(approverId: string, params?: {
    page?: number
    limit?: number
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request(`/admin/approvers/${approverId}/reviewed-posts${queryString ? `?${queryString}` : ''}`)
  }

  async suspendApprover(approverId: string) {
    return this.request(`/admin/approvers/${approverId}/suspend`, {
      method: 'PUT',
    })
  }

  async activateApprover(approverId: string) {
    return this.request(`/admin/approvers/${approverId}/activate`, {
      method: 'PUT',
    })
  }

  async deactivateApprover(approverId: string) {
    return this.request(`/admin/approvers/${approverId}/deactivate`, {
      method: 'PUT',
    })
  }

  async deleteApprover(approverId: string) {
    return this.request(`/admin/approvers/${approverId}`, {
      method: 'DELETE',
    })
  }

  // Approver Portal APIs
  async approverLogin(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        role: 'approver',
      }),
    })

    if (response.success && response.data) {
      const data = response.data as any
      const accessToken = data.accessToken || data.token
      const refreshToken = data.refreshToken
      const user = data.user || data.approver
      
      if (accessToken) {
        this.setApproverToken(accessToken)
        if (typeof window !== 'undefined') {
          localStorage.setItem('talentix_approver_token', accessToken)
          if (refreshToken) {
            localStorage.setItem('talentix_approver_refresh_token', refreshToken)
          }
          if (user) {
            localStorage.setItem('talentix_approver_user', JSON.stringify(user))
          }
        }
      }
    }

    return response
  }

  async completeApproverOnboarding(data: {
    token: string
    password: string
    first_name: string
    last_name: string
    phone_number: string
  }) {
    return this.request('/approver/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getApproverPortalStats() {
    return this.request('/approver/stats')
  }

  async getApproverPendingPosts(params?: {
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/pending${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverApprovedPosts(params?: {
    page?: number
    limit?: number
    date?: string
    search?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.date) queryParams.append('date', params.date)
    if (params?.search) queryParams.append('search', params.search)

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/approved${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverAllPosts(params?: {
    page?: number
    limit?: number
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/all${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverFlaggedPosts(params?: {
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/flagged${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverSuspendedPosts(params?: {
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/suspended${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverTrafficPosts(params?: {
    page?: number
    limit?: number
    minViews?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.minViews) queryParams.append('minViews', params.minViews.toString())

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/traffic${queryString ? `?${queryString}` : ''}`)
  }

  async approvePost(postId: string, notes?: string) {
    return this.request(`/approver/posts/${postId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    })
  }

  async rejectPost(postId: string, notes: string) {
    return this.request(`/approver/posts/${postId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    })
  }

  async suspendPost(postId: string, reason: string) {
    return this.request(`/approver/posts/${postId}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
  }

  async reviewFlaggedPost(postId: string, action: 'approve' | 'reject', notes: string) {
    return this.request(`/approver/posts/${postId}/flagged/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, notes }),
    })
  }

  async getUsersWithHighSuspendedVideos(params?: {
    page?: number
    limit?: number
    minSuspended?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.minSuspended) queryParams.append('minSuspended', params.minSuspended.toString())

    const queryString = queryParams.toString()
    return this.request(`/approver/users/high-suspended-videos${queryString ? `?${queryString}` : ''}`)
  }

  async getApproverNotifications(params?: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly.toString())

    const queryString = queryParams.toString()
    return this.request(`/approver/notifications${queryString ? `?${queryString}` : ''}`)
  }

  async markApproverNotificationAsRead(notificationId: string) {
    return this.request(`/approver/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  async searchApproverPosts(params: {
    q: string
    page?: number
    limit?: number
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    queryParams.append('q', params.q)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request(`/approver/posts/search${queryString ? `?${queryString}` : ''}`)
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

  async sendBroadcastNotification(data: {
    title: string
    message: string
    type?: string
  }) {
    return this.request('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Appeals Management
  async getAppeals(params?: {
    page?: number
    limit?: number
    status?: 'pending' | 'approved' | 'rejected'
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request(`/admin/appeals${queryString ? `?${queryString}` : ''}`)
  }

  async reviewAppeal(appealId: string, data: {
    status: 'approved' | 'rejected'
    adminNotes?: string
  }) {
    return this.request(`/admin/appeals/${appealId}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  // Countries
  async getCountries() {
    return this.request('/countries')
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(BASE_URL)

// Export types for use in components
export type { ApiResponse, ApiError }
