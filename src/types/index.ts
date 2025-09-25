// Core Community Types
export interface Community {
  id: string;
  name: string;
  project_name?: string | null;
  logo_url?: string | null;
  brand_color: string;
  status: string;
  forum_enabled: boolean;
  is_template?: boolean;
  api_key_id?: string | null;
  template_source_id?: string | null;
  created_at: string;
  signup_token?: string | null;
  signup_link?: string | null;
}

// User Types
export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  community_id?: string | null;
  created_at: string;
  last_active?: string | null;
  is_admin?: boolean;
}

// Profile Types
export interface Profile {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  community_id?: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Community Signup Types
export interface CommunitySignupData {
  id: string;
  community_name: string;
  brand_color: string;
  logo_url?: string | null;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

// Community Management Types
export interface CommunityStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  recentActivities: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface SignupLinkResponse {
  signup_link: string;
  community_id: string;
}

// Form and Modal Types
export interface CommunityFormData {
  name: string;
  project_name?: string;
  brand_color: string;
  logo_url?: string;
  forum_enabled: boolean;
  status: string;
}

// Navigation and UI Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  active?: boolean;
}

// Content Types
export interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  created_at: string;
  updated_at: string;
  community_id?: string;
}

// Analytics Types
export interface AnalyticsData {
  userActivity?: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    activity_count: number;
  }>;
  recentActivity?: Array<{
    id: string;
    activity_type: string;
    created_at: string;
    users: { first_name: string; last_name: string };
    content_items?: { title: string };
  }>;
  contentEngagement?: Array<{
    content_item_id: string;
    content_items: { title: string; content_type: string };
    engagement_count: number;
  }>;
  agentUsage?: Array<{
    agent_id: string;
    content_items: { title: string };
    conversation_count: number;
    total_messages: number;
  }>;
  summaryStats?: CommunityStats;
}