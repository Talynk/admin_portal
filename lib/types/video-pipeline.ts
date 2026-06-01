export type VideoProcessingStatus =
  | 'uploading'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | null

export interface VideoPipelineByStatus {
  pending?: number
  processing?: number
  uploading?: number
  failed?: number
  completed?: number
  unknown?: number
}

export interface VideoPipelineStats {
  byStatus: VideoPipelineByStatus
  inPipeline: number
  recoverableWithSource: number
  uploadingWithoutSource: number
  completedWithoutHls: number
  needsAttention: number
}

export interface AdminProcessingPostUser {
  id: string
  username: string
  display_name?: string | null
  phone1?: string | null
  phone2?: string | null
  email?: string | null
}

export interface AdminProcessingPostRow {
  id: string
  title: string
  status: string
  type: 'video' | string
  processing_status: VideoProcessingStatus
  processing_error: string | null
  video_url: string | null
  hls_url: string | null
  uploadDate?: string
  createdAt?: string
  user_id?: string
  user?: AdminProcessingPostUser
  has_source_video: boolean
  recoverable: boolean
}

export interface VideoPipelineListResponse {
  posts: AdminProcessingPostRow[]
  total: number
  summary?: VideoPipelineStats & { totalInPipeline?: number; failed?: number }
  pipeline?: VideoPipelineStats
}

export interface ReconcilePreviewItem {
  postId: string
  hlsUrl: string
  previousStatus: string
}

export interface ReconcileResponse {
  dryRun: boolean
  scanned: number
  matched: number
  updatedIds: string[]
  preview: ReconcilePreviewItem[]
}

export interface RequeueEnqueuedItem {
  postId: string
  jobId?: string
  wouldEnqueue?: boolean
}

export interface RequeueErrorItem {
  postId: string
  error: string
}

export interface RequeueResponse {
  dryRun: boolean
  scanned: number
  enqueued: RequeueEnqueuedItem[]
  skippedHlsAlreadyOnCdn?: string[]
  skippedJobInQueue?: string[]
  skipped?: string[]
  errors: RequeueErrorItem[]
}

export interface RecoverAllResponse {
  dryRun: boolean
  reconcile: ReconcileResponse
  requeue: RequeueResponse
  statsAfter: VideoPipelineStats
  message: string
}

export interface FailStaleUploadsResponse {
  dryRun: boolean
  scanned?: number
  failed?: number
  updatedIds?: string[]
  preview?: Array<{ postId: string; createdAt?: string }>
  message?: string
}

export type VideoPipelineStatusFilter =
  | 'failed'
  | 'pending'
  | 'processing'
  | 'uploading'
  | undefined
