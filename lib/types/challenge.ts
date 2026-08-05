export type ModerationMode = 'open' | 'moderated'

export type DocumentStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface ChallengeContext {
  challenge_id: string
  challenge_name: string
  moderation_mode: ModerationMode
  challenge_status: string
}

export interface PendingDocumentUser {
  id: string
  username: string
  display_name?: string | null
  email?: string | null
  phone1?: string | null
  phone2?: string | null
}

export interface PendingDocumentChallenge {
  id: string
  name: string
  document_name?: string | null
  document_description?: string | null
  requires_document?: boolean
  moderation_mode?: ModerationMode
}

export interface PendingDocumentItem {
  participant_id: string
  challenge_id: string
  user_id: string
  document_status: DocumentStatus
  document_mime?: string | null
  document_original_name?: string | null
  document_size_bytes?: number | null
  document_submitted_at?: string | null
  downloadUrl?: string | null
  expiresIn?: number | null
  user?: PendingDocumentUser
  challenge?: PendingDocumentChallenge
}

export interface PendingDocumentsResponse {
  items?: PendingDocumentItem[]
  documents?: PendingDocumentItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ChallengePendingPostUser {
  id?: string
  username: string
  display_name?: string | null
  email?: string | null
  profile_picture?: string | null
}

export interface ChallengePendingPost {
  id: string
  title?: string | null
  description?: string | null
  caption?: string | null
  status: string
  type?: string
  video_url?: string | null
  thumbnail_url?: string | null
  createdAt?: string
  uploadDate?: string
  user?: ChallengePendingPostUser
  challenge_context?: ChallengeContext | null
}

export interface ChallengePendingPostsResponse {
  posts?: ChallengePendingPost[]
  items?: ChallengePendingPost[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApproverPortalStats {
  challengePendingCount?: number
  challengeReviewedCount?: number
  [key: string]: unknown
}

export interface ChallengeModerationFields {
  moderation_mode?: ModerationMode
  requires_document?: boolean
  document_name?: string | null
  document_description?: string | null
  activeParticipants?: number
  approvedParticipants?: number
  joinedOnlyParticipants?: number
}
