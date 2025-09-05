export interface ModerationItem {
  label: string;
  percentage: number;
  severity: "high" | "medium" | "low" | "safe";
  confidence: number;
  status: "flagged" | "safe";
}

export interface ModerationCategory {
  title: string;
  flagged: boolean;
  items: ModerationItem[];
}

export interface ModerationSummary {
  overallAssessment: string;
  flagged: boolean;
  concerns: Array<{
    severity: "high" | "medium" | "low";
    category: string;
  }>;
}

export interface ModerationData {
  flagged: boolean;
  summary: ModerationSummary;
  detailedResults: {
    [key: string]: ModerationCategory;
  };
  fileName: string;
  processingType: string;
  taskId?: string;
  processedAt: string;
  processingTime: number; // in seconds
}

export interface VideoUploadProps {
  onModerationStart: () => void;
  onModerationComplete: (data: ModerationData) => void;
  onError: (errorMessage: string) => void;
  loading: boolean;
}

export interface ModerationResultsProps {
  data: ModerationData;
}

export interface AIReviewAction {
  type: "approve" | "reject" | "flag" | "review_required";
  reason: string;
  confidence: number;
  reviewedBy: string;
  reviewedAt: string;
}
