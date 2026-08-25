export type BannerGender = 'male' | 'female'

export interface AppBannerTargeting {
  genders: BannerGender[]
  age_min: number | null
  age_max: number | null
  country_ids: number[]
}

export interface AppBannerSettings {
  banner_message: string | null
  banner_description: string | null
  targeting: AppBannerTargeting
}

export interface AppBannerUpdatePayload {
  message?: string | null
  description?: string | null
  targeting?: {
    genders?: BannerGender[]
    age_min?: number | null
    age_max?: number | null
    country_ids?: number[]
  }
}

export interface BestPerformerSettings {
  post_id: string | null
  label: string
  expires_at: string | null
}

export interface BestPerformerUpdatePayload {
  postId: string | null
  label?: string
  expiresAt?: string | null
}

export const DEFAULT_BANNER_MESSAGE = 'Only Talent Related Content Allowed'

export const DEFAULT_BANNER_DESCRIPTION =
  'Share performances and creative skills — music, dance, comedy, sport, craft, and other talent. Off-topic posts may be removed.'

export const EMPTY_BANNER_TARGETING: AppBannerTargeting = {
  genders: [],
  age_min: null,
  age_max: null,
  country_ids: [],
}
