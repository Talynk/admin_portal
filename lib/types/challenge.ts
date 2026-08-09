import type { LegacyMediaFields, PostPlaybackFields } from '@/lib/types/media'

export type ModerationMode = 'open' | 'moderated'

export type DocumentStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface ChallengeContext {
  challenge_id: string
  challenge_name: string
  moderation_mode: ModerationMode
  challenge_status: string
  requires_document?: boolean
  document_name?: string | null
  document_description?: string | null
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

/**
 * The submitter's document, attached only on the challenge post queues so a
 * reviewer can judge the post and the document in one screen.
 */
export interface ParticipantDocumentSummary {
  document_status: DocumentStatus
  document_name?: string | null
  document_original_name?: string | null
  document_mime?: string | null
  document_size_bytes?: number | null
  document_submitted_at?: string | null
  document_rejection_reason?: string | null
  downloadUrl?: string | null
  expiresIn?: number | null
}

export interface ChallengePendingPost extends PostPlaybackFields, LegacyMediaFields {
  id: string
  title?: string | null
  description?: string | null
  caption?: string | null
  status: string
  createdAt?: string
  uploadDate?: string
  user?: ChallengePendingPostUser
  challenge_context?: ChallengeContext | null
  participant_document?: ParticipantDocumentSummary | null
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
