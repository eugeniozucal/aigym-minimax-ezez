// Basic types for the application
export interface ContentItem {
  id: string
  title: string
  description: string
  content: string
  content_type: string
  status: 'draft' | 'published' | 'archived'
  thumbnail_url?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface Community {
  id: string
  name: string
  description?: string
  project_name?: string
  logo_url?: string
  brand_color?: string
  forum_enabled?: boolean
  api_key_id?: string
  status?: string
  created_at: string
  updated_at: string
}

export interface ExtendedCommunity extends Community {
  template_source_id?: string
  logo_url?: string
  brand_color?: string
  project_name?: string
  api_key_id?: string
  status?: string
}

export interface UserTag {
  id: string
  name: string
  color?: string
  community_id?: string
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  community_id: string
  provider?: string
  created_at: string
}

// User type from Supabase
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  community_id?: string
  last_active?: string
  created_at: string
  updated_at: string
}

// Content type enum
export type ContentType = 'article' | 'ai_agent' | 'video' | 'document' | 'image' | 'pdf' | 'prompt' | 'automation'

// PDF type
export interface PDF {
  id: string
  title: string
  description: string
  file_url: string
  file_size: number
  page_count: number
  created_at: string
  updated_at: string
}

// Image type
export interface Image {
  id: string
  title: string
  description: string
  file_url: string
  file_size: number
  width: number
  height: number
  mime_type: string
  created_at: string
  updated_at: string
}

// Additional content types
export interface AIAgent {
  id: string
  title: string
  description: string
  content: string
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  description: string
  content: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  description: string
  content: string
  created_at: string
  updated_at: string
}

export interface Prompt {
  id: string
  title: string
  description: string
  content: string
  usage_count?: number
  last_copied_at?: string
  created_at: string
  updated_at: string
}

export interface Automation {
  id: string
  title: string
  description: string
  content: string
  created_at: string
  updated_at: string
}

// Analytics types
export interface AnalyticsData {
  [key: string]: any
}

export interface UserActivityRanking {
  [key: string]: any
}

export interface RecentActivity {
  [key: string]: any
}

export interface ContentEngagementData {
  [key: string]: any
}

export interface AgentUsageData {
  [key: string]: any
}

// Platform features
export const PLATFORM_FEATURES = {
  // Placeholder
}

// Placeholder functions
export const createCommunityFromTemplate = async (templateId: string, communityData: Partial<Community>): Promise<Community> => {
  // Placeholder implementation
  throw new Error('createCommunityFromTemplate not implemented')
}

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  // Placeholder implementation
  return {}
}

export const getDateRangePresets = () => {
  // Placeholder implementation
  return []
}
