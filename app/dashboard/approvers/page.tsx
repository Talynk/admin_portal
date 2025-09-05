"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  UserPlus,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const mockApprovers = [
  {
    id: "A001",
    name: "Sarah Johnson",
    email: "sarah.johnson@talynk.com",
    username: "sarah_approver",
    role: "Senior Approver",
    status: "active",
    joinDate: "2024-01-15",
    lastActive: "2024-03-16T10:30:00Z",
    totalReviews: 1247,
    approvalRate: 94.2,
    averageReviewTime: "2.3 min",
    permissions: ["content_review", "user_management", "reports"],
    avatar: "/generic-placeholder-graphic.png",
    department: "Content Moderation",
    phone: "+1 (555) 123-4567",
  },
  {
    id: "A002",
    name: "Michael Chen",
    email: "michael.chen@talynk.com",
    username: "mike_approver",
    role: "Content Approver",
    status: "active",
    joinDate: "2024-02-01",
    lastActive: "2024-03-16T09:15:00Z",
    totalReviews: 892,
    approvalRate: 91.8,
    averageReviewTime: "3.1 min",
    permissions: ["content_review"],
    avatar: "/generic-placeholder-graphic.png",
    department: "Content Moderation",
    phone: "+1 (555) 234-5678",
  },
  {
    id: "A003",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@talynk.com",
    username: "emily_approver",
    role: "Junior Approver",
    status: "inactive",
    joinDate: "2024-02-20",
    lastActive: "2024-03-10T16:45:00Z",
    totalReviews: 456,
    approvalRate: 89.5,
    averageReviewTime: "4.2 min",
    permissions: ["content_review"],
    avatar: "/generic-placeholder-graphic.png",
    department: "Content Moderation",
    phone: "+1 (555) 345-6789",
  },
  {
    id: "A004",
    name: "David Kim",
    email: "david.kim@talynk.com",
    username: "david_approver",
    role: "Lead Approver",
    status: "active",
    joinDate: "2023-11-10",
    lastActive: "2024-03-16T11:20:00Z",
    totalReviews: 2156,
    approvalRate: 96.1,
    averageReviewTime: "1.8 min",
    permissions: ["content_review", "user_management", "reports", "admin"],
    avatar: "/generic-placeholder-graphic.png",
    department: "Content Moderation",
    phone: "+1 (555) 456-7890",
  },
]

const mockApproverStats = {
  totalApprovers: mockApprovers.length,
  activeApprovers: mockApprovers.filter((a) => a.status === "active").length,
  inactiveApprovers: mockApprovers.filter((a) => a.status === "inactive").length,
  averageApprovalRate: Math.round(mockApprovers.reduce((acc, a) => acc + a.approvalRate, 0) / mockApprovers.length),
  totalReviewsToday: 47,
  pendingInvitations: 2,
}

export default function ApproversPage() {
  const [approvers, setApprovers] = useState(mockApprovers)
  const [selectedApprover, setSelectedApprover] = useState<(typeof mockApprovers)[0] | null>(null)
  const [addApproverDialogOpen, setAddApproverDialogOpen] = useState(false)
  const [viewApproverDialogOpen, setViewApproverDialogOpen] = useState(false)
  const [editApproverDialogOpen, setEditApproverDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const [newApprover, setNewApprover] = useState({
    name: "",
    email: "",
    username: "",
    role: "",
    department: "",
    phone: "",
    password: "",
    permissions: [] as string[],
  })

  // Filter approvers
  const filteredApprovers = approvers.filter((approver) => {
    const matchesSearch =
      approver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approver.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approver.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || approver.status === statusFilter
    const matchesRole = roleFilter === "all" || approver.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const handleAddApprover = () => {
    const approver = {
      id: `A${String(approvers.length + 1).padStart(3, "0")}`,
      ...newApprover,
      status: "active" as const,
      joinDate: new Date().toISOString().split("T")[0],
      lastActive: new Date().toISOString(),
      totalReviews: 0,
      approvalRate: 0,
      averageReviewTime: "0 min",
      avatar: "/generic-placeholder-graphic.png",
    }

    setApprovers((prev) => [...prev, approver])
    setAddApproverDialogOpen(false)
    setNewApprover({
      name: "",
      email: "",
      username: "",
      role: "",
      department: "",
      phone: "",
      password: "",
      permissions: [],
    })
  }

  const handleDeleteApprover = (approverId: string) => {
    setApprovers((prev) => prev.filter((a) => a.id !== approverId))
  }

  const handleToggleStatus = (approverId: string) => {
    setApprovers((prev) =>
      prev.map((a) =>
        a.id === approverId ? { ...a, status: a.status === "active" ? "inactive" : ("active" as const) } : a,
      ),
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Lead Approver":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Lead</Badge>
      case "Senior Approver":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Senior</Badge>
      case "Content Approver":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approver</Badge>
      case "Junior Approver":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Junior</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Approver Management</h1>
              <p className="text-muted-foreground">Manage approver accounts and permissions</p>
            </div>
            <Button onClick={() => setAddApproverDialogOpen(true)} className="hover:bg-primary/90 transition-colors">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Approver
            </Button>
          </div>

          <Tabs defaultValue="approvers" className="space-y-6">
            <TabsList>
              <TabsTrigger value="approvers">All Approvers</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="approvers" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Approvers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockApproverStats.totalApprovers}</div>
                    <p className="text-xs text-muted-foreground">Registered accounts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Approvers</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockApproverStats.activeApprovers}</div>
                    <p className="text-xs text-muted-foreground">Currently working</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reviews Today</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockApproverStats.totalReviewsToday}</div>
                    <p className="text-xs text-muted-foreground">Content reviewed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Approval Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockApproverStats.averageApprovalRate}%</div>
                    <p className="text-xs text-muted-foreground">Team average</p>
                  </CardContent>
                </Card>
              </div>

              {/* Approvers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Approver Accounts</CardTitle>
                  <CardDescription>Manage all approver accounts and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, username, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="Lead Approver">Lead Approver</SelectItem>
                        <SelectItem value="Senior Approver">Senior Approver</SelectItem>
                        <SelectItem value="Content Approver">Content Approver</SelectItem>
                        <SelectItem value="Junior Approver">Junior Approver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approver</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reviews</TableHead>
                          <TableHead>Approval Rate</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApprovers.map((approver) => (
                          <TableRow key={approver.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={approver.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {approver.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{approver.name}</p>
                                  <p className="text-sm text-muted-foreground">{approver.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(approver.role)}</TableCell>
                            <TableCell>{getStatusBadge(approver.status)}</TableCell>
                            <TableCell>{approver.totalReviews.toLocaleString()}</TableCell>
                            <TableCell>{approver.approvalRate}%</TableCell>
                            <TableCell>{new Date(approver.lastActive).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => window.open(`/dashboard/approvers/${approver.id}`, '_blank')}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Full Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApprover(approver)
                                      setViewApproverDialogOpen(true)
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Quick View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApprover(approver)
                                      setEditApproverDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleToggleStatus(approver.id)}>
                                    {approver.status === "active" ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteApprover(approver.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredApprovers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No approvers found matching your criteria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {/* Team Performance Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvers
                  .filter((a) => a.status === "active")
                  .map((approver) => (
                    <Card key={approver.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={approver.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {approver.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <CardTitle className="text-sm font-medium">{approver.name}</CardTitle>
                        </div>
                        {getRoleBadge(approver.role)}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Reviews:</span>
                            <span className="font-medium">{approver.totalReviews}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Approval Rate:</span>
                            <span className="font-medium">{approver.approvalRate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Time:</span>
                            <span className="font-medium">{approver.averageReviewTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Approver Dialog */}
        <Dialog open={addApproverDialogOpen} onOpenChange={setAddApproverDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Approver</DialogTitle>
              <DialogDescription>
                Create a new approver account with login credentials and permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newApprover.name}
                    onChange={(e) => setNewApprover((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newApprover.username}
                    onChange={(e) => setNewApprover((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="john_approver"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newApprover.email}
                    onChange={(e) => setNewApprover((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@talynk.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newApprover.phone}
                    onChange={(e) => setNewApprover((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newApprover.role}
                    onValueChange={(value) => setNewApprover((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior Approver">Junior Approver</SelectItem>
                      <SelectItem value="Content Approver">Content Approver</SelectItem>
                      <SelectItem value="Senior Approver">Senior Approver</SelectItem>
                      <SelectItem value="Lead Approver">Lead Approver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newApprover.department}
                    onChange={(e) => setNewApprover((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="Content Moderation"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Initial Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newApprover.password}
                  onChange={(e) => setNewApprover((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Set initial password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  User will be required to change password on first login
                </p>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["content_review", "user_management", "reports", "admin"].map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newApprover.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApprover((prev) => ({
                              ...prev,
                              permissions: [...prev.permissions, permission],
                            }))
                          } else {
                            setNewApprover((prev) => ({
                              ...prev,
                              permissions: prev.permissions.filter((p) => p !== permission),
                            }))
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{permission.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddApproverDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddApprover}
                disabled={!newApprover.name || !newApprover.email || !newApprover.username || !newApprover.password}
              >
                Create Approver Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Approver Dialog */}
        <Dialog open={viewApproverDialogOpen} onOpenChange={setViewApproverDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Approver Details</DialogTitle>
              <DialogDescription>View detailed information about this approver account.</DialogDescription>
            </DialogHeader>

            {selectedApprover && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedApprover.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">
                      {selectedApprover.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedApprover.name}</h3>
                    <p className="text-muted-foreground">@{selectedApprover.username}</p>
                    <div className="flex gap-2 mt-2">
                      {getRoleBadge(selectedApprover.role)}
                      {getStatusBadge(selectedApprover.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Email:</span> {selectedApprover.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Phone:</span> {selectedApprover.phone}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Department:</span> {selectedApprover.department}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Account Details</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">ID:</span> {selectedApprover.id}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Join Date:</span>{" "}
                          {new Date(selectedApprover.joinDate).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Last Active:</span>{" "}
                          {new Date(selectedApprover.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Total Reviews:</span>{" "}
                          {selectedApprover.totalReviews.toLocaleString()}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Approval Rate:</span> {selectedApprover.approvalRate}%
                        </p>
                        <p>
                          <span className="text-muted-foreground">Avg Review Time:</span>{" "}
                          {selectedApprover.averageReviewTime}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Permissions</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedApprover.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewApproverDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
