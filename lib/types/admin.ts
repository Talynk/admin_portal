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
  viewCount?: number
  viewCountFromTable?: number
  shares: number
  comment_count: number
  report_count: number
  createdAt: string
  user: {
    id: string
    username: string
    email: string
    profile_picture: string
    bio?: string
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
  post_id?: string
  reason: string
  description?: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
  updatedAt?: string
  reviewed_by?: string
  reviewed_at?: string
  user: {
    id: string
    username: string
    display_name?: string
    email?: string
    profile_picture?: string
    bio?: string
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
  phone1?: string
  phone2?: string
  date_of_birth?: string
  country_id?: number
  country?: { id: number; name: string; code: string; flag_emoji: string }
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
  bio?: string
  totalPostViews?: number
  posts_count?: number
  follower_count?: number
  total_profile_views?: number
  postsApproved?: number
  postsPending?: number
  profile_picture?: string
  last_login?: string
  last_active_date?: string
  suspended_at?: string
  suspension_reason?: string
  role?: string
  email_verified?: boolean
  interests?: string[]
  updatedAt?: string
  summary?: {
    totalPosts: number
    totalPostViews: number
    totalReportsOnContent: number
  }
}

// User activity (time-bucketed)
export interface UserActivityBucket {
  periodStart: string
  periodEnd: string
  postsCreated: number
  likesGiven: number
  commentsMade: number
}

export interface UserActivityResponse {
  frame: string
  buckets: UserActivityBucket[]
}

// User posts (admin)
export interface UserPostReport {
  id: string
  post_id: string
  reason: string
  description?: string
  status: string
  createdAt: string
  user?: { id: string; username: string; display_name?: string; email?: string }
}

export interface UserPostAppeal {
  id: string
  appeal_reason: string
  status: string
  createdAt: string
  user?: { id: string; username: string }
}

export interface UserPostItem {
  id: string
  title?: string
  description?: string
  status: string
  views: number
  likes: number
  report_count?: number
  uploadDate?: string
  createdAt: string
  category?: { id: string; name: string; description?: string; level?: number; parent?: unknown }
  _count?: { postLikes: number; comments: number; postViews: number; postShares: number; reports: number; appeals: number }
  reports?: UserPostReport[]
  appeals?: UserPostAppeal[]
}

export interface UserPostsResponse {
  posts: UserPostItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type UserPostsStatusFilter = 'all' | 'active' | 'suspended' | 'draft'
export type UserPostsSort = 'newest' | 'oldest' | 'most_liked' | 'most_viewed' | 'most_reported'
export type TimeFrame = '1h' | '12h' | '24h' | '7d' | '30d'

// User posts engagement
export interface UserPostsEngagementResponse {
  frame: string
  summary: {
    totalPostsInFrame: number
    totalViews: number
    totalLikes: number
    totalComments: number
    totalShares: number
  }
  engagementRate: number
}

// Post engagement (time-bucketed)
export interface PostEngagementBucket {
  periodStart: string
  periodEnd: string
  likes: number
  comments: number
  views: number
}

export interface PostEngagementResponse {
  frame: string
  buckets: PostEngagementBucket[]
}

// Admin unified search
export interface AdminSearchParams {
  q: string
  type?: 'all' | 'users' | 'posts'
  page?: number
  limit?: number
  status?: string
  dateFrom?: string
  dateTo?: string
  hasReports?: string
  suspended?: string
}

export interface AdminSearchUser {
  id: string
  username: string
  display_name?: string
  email?: string
  profile_picture?: string
  status?: string
  posts_count?: number
}

export interface AdminSearchPost {
  id: string
  title?: string
  description?: string
  status?: string
  views?: number
  likes?: number
  report_count?: number
  createdAt?: string
  user?: { id: string; username: string; display_name?: string }
  category?: { id: string; name: string }
}

export interface AdminSearchResponse {
  users?: AdminSearchUser[]
  userTotal?: number
  posts?: AdminSearchPost[]
  postTotal?: number
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

// Suspended users with report context
export interface SuspendedUserReport {
  id: string
  post_id: string
  reason: string
  description?: string
  status: string
  createdAt: string
  reporter: { id: string; username: string; display_name?: string; email?: string }
}

export interface SuspendedUserItem {
  id: string
  username: string
  display_name?: string
  email?: string
  profile_picture?: string
  status: string
  suspended_at?: string
  suspension_reason?: string
  posts_count?: number
  createdAt: string
  country?: { id: number; name: string; code: string; flag_emoji: string }
  reportedPostsCount?: number
  totalReportsCount?: number
  reportReasons?: Record<string, number>
  reports?: SuspendedUserReport[]
}

export interface SuspendedUsersResponse {
  users: SuspendedUserItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
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
