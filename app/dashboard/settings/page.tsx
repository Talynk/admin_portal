"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Bell, Key, Save, CheckCircle } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    platform: {
      siteName: "Talynk",
      siteDescription: "The next generation social media platform",
      maintenanceMode: false,
      registrationEnabled: true,
      maxVideoLength: 300,
      maxFileSize: 100,
    },
    moderation: {
      autoModeration: true,
      aiContentScanning: true,
      requireApproval: false,
      profanityFilter: true,
      spamDetection: true,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      moderationAlerts: true,
      systemAlerts: true,
      weeklyReports: true,
    },
    security: {
      twoFactorRequired: false,
      sessionTimeout: 24,
      passwordMinLength: 8,
      loginAttempts: 5,
      ipWhitelist: "",
    },
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("[v0] Saving settings:", settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateSetting = (category: keyof typeof settings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">Configure platform settings and preferences</p>
            </div>
            <Button onClick={handleSave} className="flex items-center gap-2">
              {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>

          <Tabs defaultValue="platform" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="platform" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Platform Configuration
                  </CardTitle>
                  <CardDescription>Basic platform settings and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={settings.platform.siteName}
                        onChange={(e) => updateSetting("platform", "siteName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxVideoLength">Max Video Length (seconds)</Label>
                      <Input
                        id="maxVideoLength"
                        type="number"
                        value={settings.platform.maxVideoLength}
                        onChange={(e) => updateSetting("platform", "maxVideoLength", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={settings.platform.siteDescription}
                      onChange={(e) => updateSetting("platform", "siteDescription", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.platform.maxFileSize}
                        onChange={(e) => updateSetting("platform", "maxFileSize", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Temporarily disable the platform for maintenance
                        </p>
                      </div>
                      <Switch
                        checked={settings.platform.maintenanceMode}
                        onCheckedChange={(checked) => updateSetting("platform", "maintenanceMode", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>User Registration</Label>
                        <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
                      </div>
                      <Switch
                        checked={settings.platform.registrationEnabled}
                        onCheckedChange={(checked) => updateSetting("platform", "registrationEnabled", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Content Moderation
                  </CardTitle>
                  <CardDescription>Configure automated and manual moderation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Moderation</Label>
                        <p className="text-sm text-muted-foreground">Automatically moderate content using AI</p>
                      </div>
                      <Switch
                        checked={settings.moderation.autoModeration}
                        onCheckedChange={(checked) => updateSetting("moderation", "autoModeration", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>AI Content Scanning</Label>
                        <p className="text-sm text-muted-foreground">Scan content for inappropriate material</p>
                      </div>
                      <Switch
                        checked={settings.moderation.aiContentScanning}
                        onCheckedChange={(checked) => updateSetting("moderation", "aiContentScanning", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Manual Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          All content requires manual approval before publishing
                        </p>
                      </div>
                      <Switch
                        checked={settings.moderation.requireApproval}
                        onCheckedChange={(checked) => updateSetting("moderation", "requireApproval", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profanity Filter</Label>
                        <p className="text-sm text-muted-foreground">Filter out profanity and inappropriate language</p>
                      </div>
                      <Switch
                        checked={settings.moderation.profanityFilter}
                        onCheckedChange={(checked) => updateSetting("moderation", "profanityFilter", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Spam Detection</Label>
                        <p className="text-sm text-muted-foreground">Automatically detect and filter spam content</p>
                      </div>
                      <Switch
                        checked={settings.moderation.spamDetection}
                        onCheckedChange={(checked) => updateSetting("moderation", "spamDetection", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure system and admin notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onCheckedChange={(checked) => updateSetting("notifications", "emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                      </div>
                      <Switch
                        checked={settings.notifications.pushNotifications}
                        onCheckedChange={(checked) => updateSetting("notifications", "pushNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Moderation Alerts</Label>
                        <p className="text-sm text-muted-foreground">Alerts for content requiring moderation</p>
                      </div>
                      <Switch
                        checked={settings.notifications.moderationAlerts}
                        onCheckedChange={(checked) => updateSetting("notifications", "moderationAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Alerts</Label>
                        <p className="text-sm text-muted-foreground">Critical system and security alerts</p>
                      </div>
                      <Switch
                        checked={settings.notifications.systemAlerts}
                        onCheckedChange={(checked) => updateSetting("notifications", "systemAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Weekly analytics and performance reports</p>
                      </div>
                      <Switch
                        checked={settings.notifications.weeklyReports}
                        onCheckedChange={(checked) => updateSetting("notifications", "weeklyReports", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Configure security and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting("security", "sessionTimeout", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Min Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) =>
                          updateSetting("security", "passwordMinLength", Number.parseInt(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                    <Input
                      id="loginAttempts"
                      type="number"
                      value={settings.security.loginAttempts}
                      onChange={(e) => updateSetting("security", "loginAttempts", Number.parseInt(e.target.value))}
                      className="md:w-1/2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
                    <Textarea
                      id="ipWhitelist"
                      placeholder="192.168.1.1, 10.0.0.1"
                      value={settings.security.ipWhitelist}
                      onChange={(e) => updateSetting("security", "ipWhitelist", e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                      </div>
                      <Switch
                        checked={settings.security.twoFactorRequired}
                        onCheckedChange={(checked) => updateSetting("security", "twoFactorRequired", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
