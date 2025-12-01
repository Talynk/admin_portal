// Admin Portal Types

export interface DashboardStats {
  period: string
  stats: {
    totalUsers: number
    totalVideos: number
    pendingReviews: number
    flaggedContents: number
    totalViews: number
    totalPosts: number
    totalEngagements: number
    engagementRate: number
  }
  recentContent: any[]
}

export interface AnalyticsData {
  period: string
  analytics: {
    totalUsers: number
    totalViews: number
    totalPosts: number
    totalEngagements: number
    userDemographics: Array<{
      age_group: string
      count: number
    }>
    deviceUsage: Array<{
      device_type: string
      count: number
    }>
    topCountries: Array<{
      country: string
      flag_emoji: string
      user_count: number
      percentage: number
    }>
    topCategories: Array<{
      category: string
      post_count: number
      percentage: number
    }>
    avgSessionTimes: number
    bounceRate: number
    completionRate: number
  }
}

export interface ContentManagementStats {
  totalContents: number
  videos: number
  images: number
  pendingReviews: number
  flaggedContents: number
  featuredContents: number
}

export interface PostAnalytics {
  id: string
  title: string
  description: string
  status: 'approved' | 'pending' | 'rejected' | 'frozen'
  is_frozen: boolean
  is_featured: boolean
  likes: number
  views: number
  shares: number
  comment_count: number
  report_count: number
  createdAt: string
  user: {
    id: string
    username: string
    email: string
    profile_picture: string
    country: {
      name: string
      flag_emoji: string
    }
  }
  category: {
    id: string
    name: string
  }
  analytics: {
    totalEngagements: number
    engagementRate: number
    avgEngagementPerView: number
    isHighPerforming: boolean
    isControversial: boolean
    riskScore: number
  }
  _count: {
    postLikes: number
    postViews: number
    comments: number
    shares: number
    reports: number
  }
}

export interface PostsAnalyticsResponse {
  posts: PostAnalytics[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    status: string
    sort: string
  }
}

export interface PostReport {
  id: string
  reason: string
  description: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
  user: {
    id: string
    username: string
    email: string
    profile_picture: string
  }
}

export interface PostReportsResponse {
  reports: PostReport[]
}

export interface UserWithDetails {
  id: string
  username: string
  display_name: string
  email: string
  phone1: string
  phone2: string
  date_of_birth: string
  country_id: number
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
}

export interface Appeal {
  id: string
  appeal_reason: string
  additional_info: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  post: {
    id: string
    title: string
    status: string
    report_count: number
    frozen_at: string
  }
  user: {
    id: string
    username: string
    email: string
  }
  reviewer: {
    id: string
    username: string
  } | null
}

export interface AppealsResponse {
  appeals: Appeal[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface BroadcastNotificationData {
  title: string
  message: string
  type?: string
}

export interface BroadcastNotificationResponse {
  recipientCount: number
  title: string
  message: string
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: string
  status: 'unread' | 'read'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface NotificationsResponse {
  notifications: NotificationData[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ActivityLog {
  id: string
  action: string
  description: string
  userId: string
  userName: string
  timestamp: string
  details: Record<string, any>
}

export interface ActivityLogsResponse {
  logs: ActivityLog[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface Approver {
  id: string
  username: string
  email: string
  status: 'active' | 'inactive'
  joinedDate: string
  lastActive: string | null
  totalApprovedPosts: number
  totalPosts: number
  performance: {
    approvalRate: number
    averageResponseTime: number
  }
}

export interface ApproversResponse {
  approvers: Approver[]
  total: number
}

export interface CreateApproverData {
  username: string
  password: string
  email: string
}

export interface UpdateApproverData {
  username?: string
  email?: string
  fullName?: string
  department?: string
  level?: number
  status?: string
}

export interface Settings {
  [key: string]: any
}

export interface ApiError {
  status: 'error'
  message: string
  error?: string
}

export interface ApiSuccess<T> {
  status: 'success'
  data: T
  message?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
