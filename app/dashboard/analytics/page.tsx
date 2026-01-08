"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Video, Eye, Heart, Share2, Clock, Globe, Smartphone, Monitor, AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useAnalytics } from "@/hooks/use-analytics"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const { analytics, loading, error, refetch } = useAnalytics(timeRange)

  // Format session time
  const formatSessionTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-muted-foreground">Platform performance insights and detailed analytics</p>
            </div>
            <div className="flex items-center gap-2">
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
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "7d" | "30d" | "90d" | "1y")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading analytics</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Overview Stats */}
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
                    analytics?.totalUsers?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  New users in period
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
                    analytics?.totalPosts?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Posts created in period
                </p>
              </CardContent>
            </Card>
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
                    analytics?.totalViews?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total views in period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagements</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    analytics?.totalEngagements?.toLocaleString() || "0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Likes, comments, shares
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>Age distribution of platform users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analytics?.userDemographics && analytics.userDemographics.length > 0 ? (
                  analytics.userDemographics.map((group: any) => (
                    <div key={group.range || group.age_group} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-sm font-medium">{group.range || group.age_group}</div>
                        <div className="flex-1 bg-muted rounded-full h-2 min-w-[100px]">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${group.percentage || 0}%` }} 
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {typeof group.percentage === 'number' && !isNaN(group.percentage) ? group.percentage.toFixed(1) : 0}% ({group.count?.toLocaleString() || 0})
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No demographic data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>How users access the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analytics?.deviceUsage && analytics.deviceUsage.length > 0 ? (
                  analytics.deviceUsage.map((device: any) => {
                    const percentage = device.percentage || 0
                    const total = analytics.deviceUsage?.reduce((sum, d) => sum + (d.count || 0), 0) || 0
                    const calculatedPercentage = total > 0 ? ((device.count || 0) / total) * 100 : 0
                    const finalPercentage = percentage || calculatedPercentage
                    
                    return (
                      <div key={device.type || device.device_type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {device.type === "Mobile" || device.device_type === "Mobile" ? (
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                          ) : device.type === "Desktop" || device.device_type === "Desktop" ? (
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{device.type || device.device_type}</span>
                          <div className="flex-1 bg-muted rounded-full h-2 min-w-[100px]">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${finalPercentage}%` }} 
                            />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {finalPercentage.toFixed(1)}% ({device.count?.toLocaleString() || 0})
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No device usage data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>User distribution by country</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analytics?.topCountries && analytics.topCountries.length > 0 ? (
                  analytics.topCountries.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="text-lg">{country.flag_emoji || ""}</span>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {country.user_count?.toLocaleString() || 0} users ({typeof country.percentage === 'number' && !isNaN(country.percentage) ? country.percentage.toFixed(1) : Number(country.percentage || 0).toFixed(1)}%)
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No country data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Content Categories</CardTitle>
                <CardDescription>Most popular content types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : analytics?.topCategories && analytics.topCategories.length > 0 ? (
                  analytics.topCategories.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-800">
                            {index + 1}
                          </div>
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <Badge variant="outline">{typeof category.percentage === 'number' && !isNaN(category.percentage) ? category.percentage.toFixed(1) : 0}% of posts</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground ml-9">
                        {category.post_count?.toLocaleString() || 0} posts
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    analytics?.avgSessionTimes ? formatSessionTime(analytics.avgSessionTimes) : "0m"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Average session duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    analytics?.bounceRate && typeof analytics.bounceRate === 'number' && !isNaN(analytics.bounceRate) ? `${analytics.bounceRate.toFixed(1)}%` : "0%"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Users with single view</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    analytics?.completionRate && typeof analytics.completionRate === 'number' && !isNaN(analytics.completionRate) ? `${analytics.completionRate.toFixed(1)}%` : "0%"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Posts with high engagement</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : analytics?.totalPosts && analytics.totalPosts > 0 && analytics.totalEngagements ? (
                    `${((analytics.totalEngagements / analytics.totalPosts) * 100).toFixed(1)}%`
                  ) : (
                    "0%"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Engagements per post</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
