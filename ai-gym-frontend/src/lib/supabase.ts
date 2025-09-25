import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations (if needed)
export const supabaseAdmin = createClient(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
)

// Export types
export type {
  ContentItem,
  Community,
  ExtendedCommunity,
  UserTag,
  ApiKey,
  User,
  ContentType,
  PDF,
  Image,
  AIAgent,
  Video,
  Document,
  Prompt,
  Automation,
  AnalyticsData,
  UserActivityRanking,
  RecentActivity,
  ContentEngagementData,
  AgentUsageData
} from './types'

export {
  createCommunityFromTemplate,
  fetchAnalytics,
  getDateRangePresets,
  PLATFORM_FEATURES
} from './types'



