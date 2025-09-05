"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Users, Video, Eye, Heart, Share2, Clock, Globe, Smartphone, Monitor } from "lucide-react"
import { useState } from "react"

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalUsers: 45231,
    totalVideos: 12234,
    totalViews: 2456789,
    totalEngagements: 456789,
    avgSessionTime: "8m 32s",
    bounceRate: "23.4%",
  },
  growth: {
    userGrowth: "+20.1%",
    videoGrowth: "+180.1%",
    viewGrowth: "+45.2%",
    engagementGrowth: "+12.8%",
  },
  demographics: {
    ageGroups: [
      { range: "13-17", percentage: 15, count: 6785 },
      { range: "18-24", percentage: 35, count: 15831 },
      { range: "25-34", percentage: 28, count: 12665 },
      { range: "35-44", percentage: 15, count: 6785 },
      { range: "45+", percentage: 7, count: 3166 },
    ],
    devices: [
      { type: "Mobile", percentage: 78, count: 35280 },
      { type: "Desktop", percentage: 18, count: 8142 },
      { type: "Tablet", percentage: 4, count: 1809 },
    ],
    topCountries: [
      { country: "United States", users: 12500, percentage: 27.6 },
      { country: "United Kingdom", users: 8900, percentage: 19.7 },
      { country: "Canada", users: 6700, percentage: 14.8 },
      { country: "Australia", users: 4200, percentage: 9.3 },
      { country: "Germany", users: 3800, percentage: 8.4 },
    ],
  },
  content: {
    topCategories: [
      { category: "Dance", videos: 2845, views: 456789, engagement: 89.2 },
      { category: "Comedy", videos: 2156, views: 389456, engagement: 76.8 },
      { category: "Food", videos: 1789, views: 298765, engagement: 82.1 },
      { category: "Music", videos: 1654, views: 267890, engagement: 91.5 },
      { category: "Pets", videos: 1432, views: 234567, engagement: 85.7 },
    ],
    avgVideoLength: "1m 45s",
    completionRate: "68.4%",
    shareRate: "12.3%",
  },
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-muted-foreground">Platform performance insights and detailed analytics</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
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

          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.overview.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{mockAnalytics.growth.userGrowth}</span> from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.overview.totalVideos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{mockAnalytics.growth.videoGrowth}</span> from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.overview.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{mockAnalytics.growth.viewGrowth}</span> from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagements</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.overview.totalEngagements.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{mockAnalytics.growth.engagementGrowth}</span> from last period
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
                {mockAnalytics.demographics.ageGroups.map((group) => (
                  <div key={group.range} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 text-sm font-medium">{group.range}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 min-w-[100px]">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${group.percentage}%` }} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {group.percentage}% ({group.count.toLocaleString()})
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Device Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>How users access the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAnalytics.demographics.devices.map((device) => (
                  <div key={device.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {device.type === "Mobile" && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                      {device.type === "Desktop" && <Monitor className="h-4 w-4 text-muted-foreground" />}
                      {device.type === "Tablet" && <Monitor className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-medium">{device.type}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 min-w-[100px]">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${device.percentage}%` }} />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {device.percentage}% ({device.count.toLocaleString()})
                    </div>
                  </div>
                ))}
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
                {mockAnalytics.demographics.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {country.users.toLocaleString()} users ({country.percentage}%)
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Content Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Content Categories</CardTitle>
                <CardDescription>Most popular content types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAnalytics.content.topCategories.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-800">
                          {index + 1}
                        </div>
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <Badge variant="outline">{category.engagement}% engagement</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground ml-9">
                      {category.videos.toLocaleString()} videos • {category.views.toLocaleString()} views
                    </div>
                  </div>
                ))}
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
                <div className="text-2xl font-bold">{mockAnalytics.overview.avgSessionTime}</div>
                <p className="text-xs text-muted-foreground">+2.3% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.overview.bounceRate}</div>
                <p className="text-xs text-muted-foreground">-1.2% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.content.completionRate}</div>
                <p className="text-xs text-muted-foreground">+5.1% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Share Rate</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.content.shareRate}</div>
                <p className="text-xs text-muted-foreground">+0.8% from last period</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
