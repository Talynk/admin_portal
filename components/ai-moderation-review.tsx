"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Shield,
  Brain,
  AlertCircle,
  Info,
  X,
  Check,
  Flag,
  Ban,
} from "lucide-react"
import { ModerationData, ModerationItem, ModerationCategory, AIReviewAction } from "@/lib/types/moderation"

interface AIModerationReviewProps {
  data: ModerationData
  onAction: (action: AIReviewAction) => void
  isReviewing?: boolean
}

export function AIModerationReview({ data, onAction, isReviewing = false }: AIModerationReviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<AIReviewAction["type"] | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "medium":
        return <AlertCircle className="w-4 h-4" />
      case "low":
        return <Info className="w-4 h-4" />
      case "safe":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleAction = (type: AIReviewAction["type"]) => {
    setActionType(type)
    setActionDialogOpen(true)
  }

  const executeAction = () => {
    if (!actionType) return

    const action: AIReviewAction = {
      type: actionType,
      reason: actionReason,
      confidence: data.summary.flagged ? 85 : 95, // Mock confidence based on AI results
      reviewedBy: "admin", // In real app, get from auth context
      reviewedAt: new Date().toISOString(),
    }

    onAction(action)
    setActionDialogOpen(false)
    setActionType(null)
    setActionReason("")
  }

  const categories = Object.entries(data.detailedResults)
  const flaggedCategories = categories.filter(([_, category]) => category.flagged)
  const safeCategories = categories.filter(([_, category]) => !category.flagged)

  return (
    <div className="space-y-6">
      {/* AI Moderation Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Moderation Analysis
                  {data.flagged ? (
                    <Badge className="bg-red-100 text-red-800">
                      <Flag className="w-3 h-3 mr-1" />
                      Flagged
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Safe
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Processed on {new Date(data.processedAt).toLocaleString()} • 
                  Processing time: {data.processingTime}s • 
                  Task ID: {data.taskId}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("approve")}
                disabled={isReviewing}
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("reject")}
                disabled={isReviewing}
              >
                <Ban className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("flag")}
                disabled={isReviewing}
              >
                <Flag className="w-4 h-4 mr-2" />
                Flag
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.summary.flagged ? flaggedCategories.length : 0}
              </div>
              <div className="text-sm text-gray-600">Flagged Categories</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.summary.concerns.filter(c => c.severity === "high").length}
              </div>
              <div className="text-sm text-gray-600">High Severity Issues</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(data.summary.concerns.reduce((acc, c) => {
                  const severityWeight = c.severity === "high" ? 3 : c.severity === "medium" ? 2 : 1
                  return acc + severityWeight
                }, 0) / Math.max(data.summary.concerns.length, 1) * 33.33)}
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Overall Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">{data.summary.overallAssessment}</p>
            {data.summary.concerns.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Key Concerns:</h4>
                <div className="space-y-1">
                  {data.summary.concerns.map((concern, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge className={getSeverityColor(concern.severity)}>
                        {getSeverityIcon(concern.severity)}
                        <span className="ml-1 capitalize">{concern.severity}</span>
                      </Badge>
                      <span className="text-gray-600">{concern.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis Results</CardTitle>
          <CardDescription>
            Comprehensive breakdown of AI moderation analysis across all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flagged" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flagged" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Flagged ({flaggedCategories.length})
              </TabsTrigger>
              <TabsTrigger value="safe" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Safe ({safeCategories.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flagged" className="space-y-4">
              {flaggedCategories.length > 0 ? (
                flaggedCategories.map(([categoryKey, category]) => (
                  <CategoryCard
                    key={categoryKey}
                    categoryKey={categoryKey}
                    category={category}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                    getConfidenceColor={getConfidenceColor}
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No flagged categories found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="safe" className="space-y-4">
              {safeCategories.length > 0 ? (
                safeCategories.map(([categoryKey, category]) => (
                  <CategoryCard
                    key={categoryKey}
                    categoryKey={categoryKey}
                    category={category}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                    getConfidenceColor={getConfidenceColor}
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Info className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p>No safe categories to display</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Content"}
              {actionType === "reject" && "Reject Content"}
              {actionType === "flag" && "Flag Content"}
              {actionType === "review_required" && "Mark for Review"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" &&
                "Are you sure you want to approve this content? This will override the AI moderation results."}
              {actionType === "reject" &&
                "Are you sure you want to reject this content? This will prevent it from being published."}
              {actionType === "flag" &&
                "Are you sure you want to flag this content? This will mark it for additional review."}
              {actionType === "review_required" &&
                "Are you sure you want to mark this content for manual review?"}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={executeAction}
              disabled={isReviewing}
            >
              {actionType === "approve" && "Approve Content"}
              {actionType === "reject" && "Reject Content"}
              {actionType === "flag" && "Flag Content"}
              {actionType === "review_required" && "Mark for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CategoryCardProps {
  categoryKey: string
  category: ModerationCategory
  getSeverityColor: (severity: string) => string
  getSeverityIcon: (severity: string) => React.ReactNode
  getConfidenceColor: (confidence: number) => string
  expandedItems: Set<string>
  toggleExpanded: (itemId: string) => void
}

function CategoryCard({
  categoryKey,
  category,
  getSeverityColor,
  getSeverityIcon,
  getConfidenceColor,
  expandedItems,
  toggleExpanded,
}: CategoryCardProps) {
  return (
    <Card className={category.flagged ? "border-red-200" : "border-green-200"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {category.flagged ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {category.title}
          </CardTitle>
          <Badge className={getSeverityColor(category.flagged ? "high" : "safe")}>
            {category.flagged ? "Flagged" : "Safe"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {category.items.map((item, index) => {
            const itemId = `${categoryKey}-${index}`
            const isExpanded = expandedItems.has(itemId)
            
            return (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.label}</span>
                    <Badge className={getSeverityColor(item.severity)}>
                      {getSeverityIcon(item.severity)}
                      <span className="ml-1 capitalize">{item.severity}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                      {item.confidence}% confidence
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(itemId)}
                    >
                      {isExpanded ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Detection Level</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge className={`ml-2 ${item.status === "flagged" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {item.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span>
                        <span className={`ml-2 ${getConfidenceColor(item.confidence)}`}>
                          {item.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
