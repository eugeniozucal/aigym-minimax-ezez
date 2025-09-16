import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types from Phase 1 + Phase 2 enhancements
export interface Client {
  id: string
  name: string
  project_name: string
  logo_url?: string
  brand_color: string
  forum_enabled: boolean
  status: 'active' | 'archived'
  template_source_id?: string
  api_key_id?: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  role: 'super_admin' | 'manager' | 'specialist'
  created_at: string
}

export interface User {
  id: string
  client_id: string
  email: string
  first_name?: string
  last_name?: string
  last_active?: string
  created_at: string
}

export interface UserTag {
  id: string
  client_id: string
  name: string
  color: string
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  encrypted_key: string
  provider: string
  created_at: string
}

// Content Management Types - Phase 3
export type ContentType = 'ai_agent' | 'video' | 'document' | 'prompt' | 'automation' | 'image' | 'pdf'
export type ContentStatus = 'draft' | 'published'

export interface ContentItem {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  content_type: ContentType
  status: ContentStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface AIAgent {
  id: string
  content_item_id: string
  system_prompt: string
  agent_name: string
  short_description?: string
  test_conversations: Array<{
    id: string
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    created_at: string
  }>
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  content_item_id: string
  video_url: string
  video_platform?: string
  video_id?: string
  duration_seconds?: number
  transcription?: string
  auto_title?: string
  auto_description?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  content_item_id: string
  content_html: string
  content_json?: any
  word_count: number
  reading_time_minutes: number
  created_at: string
  updated_at: string
}

export interface Prompt {
  id: string
  content_item_id: string
  prompt_text: string
  prompt_category?: string
  usage_count: number
  last_copied_at?: string
  created_at: string
  updated_at: string
}

export interface Image {
  id: string
  content_item_id: string
  image_url: string
  file_size?: number
  mime_type?: string
  alt_text?: string
  width?: number
  height?: number
  created_at: string
  updated_at: string
}

export interface PDF {
  id: string
  content_item_id: string
  pdf_url: string
  file_size?: number
  page_count?: number
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export interface Automation {
  id: string
  content_item_id: string
  automation_url: string
  required_tools: string[]
  tool_description?: string
  setup_instructions?: string
  created_at: string
  updated_at: string
}

// Assignment interfaces
export interface ContentClientAssignment {
  content_item_id: string
  client_id: string
  assigned_at: string
  assigned_by: string
}

export interface ContentUserAssignment {
  content_item_id: string
  user_id: string
  assigned_at: string
  assigned_by: string
}

export interface ContentTagAssignment {
  content_item_id: string
  tag_id: string
  assigned_at: string
  assigned_by: string
}

// Extended content item with related data
export interface ContentItemWithDetails extends ContentItem {
  ai_agent?: AIAgent
  video?: Video
  document?: Document
  prompt?: Prompt
  automation?: Automation
  image?: Image
  pdf?: PDF
  assigned_clients?: string[]
  assigned_users?: string[]
  assigned_tags?: string[]
}

// Content repository configuration
export const CONTENT_TYPES = {
  ai_agent: {
    label: 'AI Agents',
    icon: 'Bot',
    color: '#3B82F6',
    description: 'Intelligent AI agents with custom prompts'
  },
  video: {
    label: 'Videos',
    icon: 'Play',
    color: '#EF4444',
    description: 'Educational videos with transcriptions'
  },
  document: {
    label: 'Documents',
    icon: 'FileText',
    color: '#10B981',
    description: 'Rich text documents and guides'
  },
  prompt: {
    label: 'Prompts',
    icon: 'MessageSquare',
    color: '#8B5CF6',
    description: 'Reusable prompt templates'
  },
  automation: {
    label: 'Automations',
    icon: 'Zap',
    color: '#F59E0B',
    description: 'Process automations and workflows'
  },
  image: {
    label: 'Images',
    icon: 'Image',
    color: '#06B6D4',
    description: 'Image assets and visual content'
  },
  pdf: {
    label: 'PDFs',
    icon: 'FileType',
    color: '#DC2626',
    description: 'PDF documents and resources'
  }
} as const

// Phase 2: Admin Panel & Analytics Types
export interface ClientFeature {
  id: string
  client_id: string
  feature_name: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserActivity {
  id: string
  user_id: string
  client_id: string
  activity_type: string
  activity_data?: any
  content_item_id?: string
  created_at: string
}

export interface ContentEngagement {
  id: string
  content_item_id: string
  user_id: string
  client_id: string
  engagement_type: string
  engagement_data?: any
  created_at: string
}

export interface AgentConversation {
  id: string
  agent_id: string
  user_id: string
  client_id: string
  conversation_data: any
  message_count: number
  started_at: string
  last_message_at: string
}

export interface BulkUpload {
  id: string
  client_id: string
  upload_type: string
  file_name: string
  total_rows: number
  successful_rows: number
  failed_rows: number
  status: 'processing' | 'completed' | 'failed'
  error_report?: any
  created_by: string
  created_at: string
  completed_at?: string
}

export interface PlatformSetting {
  id: string
  setting_key: string
  setting_value: any
  setting_type: string
  description?: string
  created_at: string
  updated_at: string
}

// Analytics interfaces
export interface AnalyticsData {
  userActivity?: UserActivityRanking[]
  recentActivity?: RecentActivity[]
  contentEngagement?: ContentEngagementData[]
  agentUsage?: AgentUsageData[]
  summaryStats?: SummaryStats
}

export interface UserActivityRanking {
  user_id: string
  first_name: string
  last_name: string
  email: string
  activity_count: number
}

export interface RecentActivity {
  id: string
  activity_type: string
  activity_data?: any
  content_item_id?: string
  created_at: string
  users: {
    first_name: string
    last_name: string
  }
  content_items?: {
    title: string
  }
}

export interface ContentEngagementData {
  content_item_id: string
  content_items: {
    title: string
    content_type: string
  }
  engagement_count: number
}

export interface AgentUsageData {
  agent_id: string
  content_items: {
    title: string
  }
  conversation_count: number
  total_messages: number
}

export interface SummaryStats {
  totalUsers: number
  totalContent: number
  recentActivities: number
}

// Phase 2 utility functions
export const fetchAnalytics = async (clientId: string = 'all', dateRange: { start: string; end: string }, metrics: string[]) => {
  const { data, error } = await supabase.functions.invoke('analytics-dashboard', {
    body: { clientId, dateRange, metrics }
  })
  
  if (error) throw error
  return data as AnalyticsData
}

export const uploadUsersBulk = async (clientId: string, csvData: string, fileName: string) => {
  const { data, error } = await supabase.functions.invoke('bulk-upload-users', {
    body: { clientId, csvData, fileName }
  })
  
  if (error) throw error
  return data
}

export const trackUserActivity = async (userId: string, clientId: string, activityType: string, activityData?: any, contentItemId?: string) => {
  const { data, error } = await supabase.functions.invoke('track-user-activity', {
    body: { userId, clientId, activityType, activityData, contentItemId }
  })
  
  if (error) throw error
  return data
}

export const createClientFromTemplate = async (request: {
  sourceClientId: string
  newClientName: string
  newProjectName?: string
  includeContent: boolean
  logoUrl?: string
  colorHex?: string
  hasForumToggle?: boolean
  apiKeyId?: string
}) => {
  const { data, error } = await supabase.functions.invoke('create-client-template', {
    body: request
  })
  
  if (error) throw error
  return data
}

// Available platform features
export const PLATFORM_FEATURES = [
  { key: 'agents_marketplace', label: 'AI Agents Marketplace', description: 'Access to AI agents and custom prompts' },
  { key: 'courses', label: 'Courses', description: 'Structured learning courses and programs' },
  { key: 'missions', label: 'Missions', description: 'Gamified learning missions and challenges' },
  { key: 'forums', label: 'Forums', description: 'Community discussion forums' },
  { key: 'documents', label: 'Documents', description: 'Rich text documents and guides' },
  { key: 'prompts', label: 'Prompts', description: 'Reusable prompt templates' },
  { key: 'automations', label: 'Automations', description: 'Process automations and workflows' }
] as const

// Helper functions for date ranges
export const getDateRangePresets = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  return {
    'last7days': {
      label: 'Last 7 Days',
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    },
    'last30days': {
      label: 'Last 30 Days',
      start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    },
    'thisMonth': {
      label: 'This Month',
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    },
    'lastMonth': {
      label: 'Last Month',
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString()
    }
  }
}