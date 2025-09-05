"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Video, AlertTriangle, TrendingUp, Eye, MessageSquare, Heart } from "lucide-react"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the Talynk Admin Portal. Monitor and manage your social media platform.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,231</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,234</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">573</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5%</div>
                <p className="text-xs text-muted-foreground">+4.5% from last month</p>
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
                {[
                  {
                    id: "V001",
                    title: "Amazing Dance Performance",
                    user: "@dancer_pro",
                    status: "approved",
                    views: "125K",
                    likes: "8.2K",
                    comments: "432",
                  },
                  {
                    id: "V002",
                    title: "Cooking Tutorial: Pasta",
                    user: "@chef_master",
                    status: "pending",
                    views: "89K",
                    likes: "5.1K",
                    comments: "287",
                  },
                  {
                    id: "V003",
                    title: "Funny Pet Compilation",
                    user: "@pet_lover",
                    status: "approved",
                    views: "234K",
                    likes: "15.3K",
                    comments: "891",
                  },
                ].map((video) => (
                  <div key={video.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                    <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.user}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {video.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {video.comments}
                        </span>
                      </div>
                    </div>
                    <Badge variant={video.status === "approved" ? "default" : "secondary"}>{video.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium">Review Flagged Content</span>
                    </div>
                    <Badge variant="destructive">23</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Video className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Content Analytics</span>
                    </div>
                    <Badge variant="outline">View</Badge>
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
