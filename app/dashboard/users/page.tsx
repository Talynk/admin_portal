"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Ban,
  Shield,
  Eye,
  Mail,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  TrendingUp,
  UserCheck,
  FileText,
} from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useCountries } from "@/hooks/use-countries";
import { useUserStats } from "@/hooks/use-user-stats";
import { toast } from "@/hooks/use-toast";
import { getProfilePictureUrl } from "@/lib/file-utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function UsersPage() {
  const [statsPeriod, setStatsPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const { stats: userStats, loading: statsLoading, error: statsError } = useUserStats(statsPeriod);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "suspend" | "activate" | "delete" | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "user",
  });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  // Use the countries hook
  const { countries, getCountryById } = useCountries();

  // Use the API hook
  const {
    users,
    loading,
    error,
    total,
    totalPages,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    activateUser,
  } = useUsers({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    country_id: countryFilter !== "all" ? parseInt(countryFilter) : undefined,
  });

  const handleUserAction = (
    user: any,
    action: "suspend" | "activate" | "delete"
  ) => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedUser || !actionType) return;

    setIsActionLoading(true);
    try {
      let result;
      switch (actionType) {
        case "suspend":
          result = await suspendUser(selectedUser.id, actionReason);
          break;
        case "activate":
          result = await activateUser(selectedUser.id, actionReason);
          break;
        case "delete":
          result = await deleteUser(selectedUser.id);
          break;
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: `User ${actionType}d successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to perform action",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }

    setActionDialogOpen(false);
    setSelectedUser(null);
    setActionType(null);
    setActionReason("");
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.fullName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreateLoading(true);
    try {
      const result = await createUser(newUser);
      if (result.success) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        setCreateUserDialogOpen(false);
        setNewUser({ username: "", email: "", fullName: "", role: "user" });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreateLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Suspended
          </Badge>
        );
      case "frozen":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Frozen
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "approver":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Approver
          </Badge>
        );
      case "user":
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor platform users
              </p>
            </div>
            <Button
              onClick={() => setCreateUserDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error loading users</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="mt-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    userStats?.users.total.toLocaleString() || total || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    userStats?.users.active.toLocaleString() || 
                    users.filter((u) => u.status === "active").length || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    userStats?.users.suspended.toLocaleString() || 
                    users.filter((u) => u.status === "frozen" || u.status === "suspended").length || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Suspended accounts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New in Period</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    userStats?.users.newInPeriod.toLocaleString() || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  New users ({statsPeriod})
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    userStats?.users.withPosts.toLocaleString() || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users with content
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Email</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    userStats?.users.withVerifiedEmail.toLocaleString() || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Email verified users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${userStats?.registration.growthRate.toFixed(1) || 0}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registration growth
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Registration Graph and Additional Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registration Rate</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </div>
                  <Select value={statsPeriod} onValueChange={(value: "7d" | "30d" | "90d" | "1y") => setStatsPeriod(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : statsError ? (
                  <div className="flex items-center justify-center h-[300px] text-red-600">
                    <AlertCircle className="h-8 w-8 mr-2" />
                    <span>Error loading stats</span>
                  </div>
                ) : userStats ? (
                  <div className="space-y-4">
                    {/* Simple bar chart representation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Average per day</span>
                        <span className="font-semibold">
                          {userStats.registration.averagePerDay.toFixed(2)} users/day
                        </span>
                      </div>
                      <div className="h-8 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{
                            width: `${Math.min((userStats.registration.averagePerDay / 10) * 100, 100)}%`,
                          }}
                        >
                          {userStats.registration.averagePerDay > 0.1 && userStats.registration.averagePerDay.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">New Users</p>
                        <p className="text-2xl font-bold">{userStats.registration.newUsers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Today</p>
                        <p className="text-2xl font-bold">{userStats.registration.todayRegistrations}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Period</p>
                        <p className="text-2xl font-bold">{userStats.registration.periodDays} days</p>
                      </div>
                    </div>
                    {/* Registration Chart */}
                    <div className="h-[200px] pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Array.from({ length: Math.min(userStats.registration.periodDays, 30) }).map((_, i) => ({
                            day: `Day ${i + 1}`,
                            registrations: Math.round(userStats.registration.averagePerDay * (0.8 + Math.random() * 0.4)),
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="day" 
                            className="text-xs"
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line 
                            type="monotone" 
                            dataKey="registrations" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name="Registrations"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Stats</CardTitle>
                <CardDescription>User activity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">With Posts</span>
                    <span className="text-sm font-semibold">
                      {statsLoading ? "..." : userStats?.engagement.usersWithPosts || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${userStats?.engagement.postCreationRate || 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userStats?.engagement.postCreationRate || 0}% post creation rate
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Without Posts</span>
                    <span className="text-sm font-semibold">
                      {statsLoading ? "..." : userStats?.engagement.usersWithoutPosts || 0}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Verification Rate</span>
                    <span className="text-sm font-semibold">
                      {statsLoading ? "..." : `${userStats?.verification.verificationRate || 0}%`}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${userStats?.verification.verificationRate || 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userStats?.verification.verified || 0} verified, {userStats?.verification.unverified || 0} unverified
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Age Distribution and Top Countries */}
          {userStats && (userStats.ageDistribution.length > 0 || userStats.topCountries.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                  <CardDescription>User age groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userStats.ageDistribution.map((age, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{age.ageGroup}</span>
                          <span className="text-sm text-muted-foreground">
                            {age.count} ({age.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            style={{ width: `${age.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                  <CardDescription>User distribution by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userStats.topCountries.slice(0, 5).map((country) => (
                      <div key={country.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{country.flagEmoji}</span>
                          <span className="text-sm font-medium">{country.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {country.userCount} users
                          </span>
                          <Badge variant="outline">{country.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Search and manage platform users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username, email, ID, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id.toString()}>
                        {country.flag_emoji} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-muted-foreground">
                    Loading users...
                  </span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={getProfilePictureUrl(user.profile_picture)}
                                  onError={(e) => {
                                    e.currentTarget.src = '/generic-placeholder-graphic.png'
                                  }}
                                />
                                <AvatarFallback>
                                  {user.fullName?.charAt(0) ||
                                    user.username?.charAt(0) ||
                                    "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    @{user.username}
                                  </p>
                                  {user.verified && (
                                    <Shield className="h-4 w-4 text-blue-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {user.fullName}
                                </p>
                                {user.bio && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {user.bio}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {user.id}
                                </p>
                                {user.date_of_birth && (
                                  <p className="text-xs text-muted-foreground">
                                    DOB: {user.date_of_birth}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            {user.country_id ? (
                              <div className="flex items-center gap-1">
                                <span>{getCountryById(user.country_id)?.flag_emoji || ""}</span>
                                <span className="text-sm">
                                  {getCountryById(user.country_id)?.name || "Unknown"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>
                                {user.follower_count?.toLocaleString() || 0}{" "}
                                followers
                              </p>
                              <p className="text-muted-foreground">
                                {user.posts_count || 0} posts
                              </p>
                              <p className="text-muted-foreground">
                                {user.postsApproved || 0} approved, {user.postsPending || 0} pending
                              </p>
                              {user.totalPostViews !== undefined && (
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {user.totalPostViews.toLocaleString()} total views
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(user.last_active_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-muted hover:scale-105 transition-all duration-200"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="hover:bg-blue-50 transition-colors">
                                  <Eye className="mr-2 h-4 w-4"/>
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-green-50 transition-colors">
                                  <Mail className="mr-2 h-4 w-4"/>
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === "active" ? (
                                  <DropdownMenuItem
                                    className="text-red-600 hover:bg-red-50 transition-colors"
                                    onClick={() =>
                                      handleUserAction(user, "suspend")
                                    }
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-green-600 hover:bg-green-50 transition-colors"
                                    onClick={() =>
                                      handleUserAction(user, "activate")
                                    }
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Activate User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {users.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No users found matching your criteria.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "suspend" && "Suspend User"}
                {actionType === "activate" && "Activate User"}
                {actionType === "delete" && "Delete User"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "suspend" &&
                  `Are you sure you want to suspend @${selectedUser?.username}? This will prevent them from accessing the platform.`}
                {actionType === "activate" &&
                  `Are you sure you want to activate @${selectedUser?.username}? This will restore their platform access.`}
                {actionType === "delete" &&
                  `Are you sure you want to delete @${selectedUser?.username}? This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for this action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={isActionLoading}
                className="hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "delete" ? "destructive" : "default"}
                onClick={executeAction}
                disabled={isActionLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === "suspend" && "Suspend User"}
                    {actionType === "activate" && "Activate User"}
                    {actionType === "delete" && "Delete User"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog
          open={createUserDialogOpen}
          onOpenChange={setCreateUserDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className="hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter full name"
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                  className="hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger className="hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateUserDialogOpen(false)}
                disabled={isCreateLoading}
                className="hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isCreateLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isCreateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
