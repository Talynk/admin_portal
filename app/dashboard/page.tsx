"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Video, AlertTriangle, TrendingUp, Eye, MessageSquare, Heart, Loader2, AlertCircle } from "lucide-react"
import { useDashboard } from "@/hooks/use-dashboard"
import { getFileUrl, getThumbnailUrl } from "@/lib/file-utils"

export default function DashboardPage() {
  const { stats, loading, error, refetch } = useDashboard()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome to the Talynk Admin Portal. Monitor and manage your social media platform.
              </p>
            </div>
            {error && (
              <Button 
                variant="outline" 
                onClick={refetch}
                className="hover:bg-gray-50 transition-colors"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading dashboard</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalUsers?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalPosts?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total content posts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.pendingReviews?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${stats?.engagementRate || 0}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Overall platform engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalViews?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Total content views</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Engagements</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalEngagements?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Likes, comments, shares</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.flaggedContents?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Content requiring review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalVideos?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Video content</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Content</CardTitle>
                <CardDescription>Latest videos uploaded to the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading recent content...</span>
                  </div>
                ) : stats?.recentContent && stats.recentContent.length > 0 ? (
                  stats.recentContent.map((post: any) => (
                    <div key={post.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {post.video_url || post.type === 'image' ? (
                        <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center overflow-hidden">
                          {post.type === 'image' && post.video_url ? (
                            <img 
                              src={getFileUrl(post.video_url) || '/placeholder.svg'} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          ) : post.video_url ? (
                            <img 
                              src={getThumbnailUrl(post.video_url) || getFileUrl(post.video_url) || '/placeholder.svg'} 
                              alt={post.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                          ) : (
                            <Video className="w-6 h-6 text-white" />
                          )}
                        </div>
                      ) : (
                        <div className="w-16 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-md flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{post.title || "Untitled Post"}</p>
                        <p className="text-sm text-muted-foreground">@{post.user?.username || "unknown"}</p>
                        {post.category && (
                          <p className="text-xs text-muted-foreground">Category: {post.category.name}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.comment_count || 0}
                          </span>
                          {post.shares > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {post.shares}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={post.status === "approved" ? "default" : post.status === "pending" ? "secondary" : "destructive"}>
                          {post.status || "pending"}
                        </Badge>
                        {post.is_featured && (
                          <Badge variant="outline" className="text-xs">Featured</Badge>
                        )}
                        {post.is_frozen && (
                          <Badge variant="destructive" className="text-xs">Frozen</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">No recent content available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium">Review Flagged Content</span>
                    </div>
                    <Badge variant="destructive">
                      {loading ? "..." : stats?.flaggedContents || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </div>
                    <Badge variant="secondary">
                      {loading ? "..." : stats?.totalUsers || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <Video className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Content Analytics</span>
                    </div>
                    <Badge variant="outline">
                      {loading ? "..." : stats?.totalVideos || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-medium">Engagement Rate</span>
                    </div>
                    <Badge variant="outline">
                      {loading ? "..." : `${stats?.engagementRate || 0}%`}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
