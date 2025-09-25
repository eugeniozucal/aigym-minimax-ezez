import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Layout } from '@/components/layout/Layout'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Activity, 
  MessageSquare, 
  BookOpen,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Clock,
  AlertCircle,
  Trophy,
  ChevronDown
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface Community {
  id: string
  name: string
  brand_color: string
}

interface AnalyticsData {
  userActivity?: Array<{
    user_id: string
    first_name: string
    last_name: string
    email: string
    activity_count: number
  }>
  recentActivity?: Array<{
    id: string
    activity_type: string
    created_at: string
    users: { first_name: string; last_name: string }
    content_items?: { title: string }
  }>
  contentEngagement?: Array<{
    content_item_id: string
    content_items: { title: string; content_type: string }
    engagement_count: number
  }>
  agentUsage?: Array<{
    agent_id: string
    content_items: { title: string }
    conversation_count: number
    total_messages: number
  }>
  summaryStats?: {
    totalUsers: number
    totalContent: number
    recentActivities: number
  }
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

// Skeleton Components
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
)

const SkeletonWidget = ({ height = "h-80" }: { height?: string }) => (
  <div className={`bg-white rounded-xl border border-gray-200 ${height} animate-pulse`}>
    <div className="p-6 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="w-8 h-4 bg-gray-200 rounded"></div>
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="w-12 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
)

// Empty State Component
const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="w-12 h-12 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-md">{description}</p>
  </div>
)

export function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({})
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const mountedRef = useRef(true)
  const lastFetchRef = useRef<string>('')

  // Stable community fetch function
  const fetchCommunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, brand_color')
        .order('name')
      
      if (error) throw error
      if (mountedRef.current && data) {
        setCommunities(data)
      }
    } catch (err) {
      console.error('Error fetching communities:', err)
    }
  }, [])

  // Stable analytics fetch function
  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    if (!mountedRef.current) return
    
    const fetchKey = `${selectedCommunity}-${dateRange.start}-${dateRange.end}`
    
    // Prevent duplicate requests
    if (lastFetchRef.current === fetchKey && !isRefresh) {
      return
    }
    
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      lastFetchRef.current = fetchKey

      const { data, error: functionError } = await supabase.functions.invoke('analytics-dashboard', {
        body: {
          communityId: selectedCommunity,
          dateRange: {
            start: format(startOfDay(new Date(dateRange.start)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            end: format(endOfDay(new Date(dateRange.end)), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
          },
          metrics: ['user_activity', 'recent_activity', 'content_engagement', 'agent_usage', 'summary_stats']
        }
      })

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch analytics data')
      }

      if (mountedRef.current) {
        setAnalyticsData(data || {})
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data'
      if (mountedRef.current) {
        setError(errorMessage)
        console.error('Analytics fetch error:', err)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [selectedCommunity, dateRange.start, dateRange.end])

  // Fetch communities once on mount
  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  // Fetch analytics data when dependencies change
  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleRefresh = useCallback(() => {
    fetchAnalyticsData(true)
  }, [fetchAnalyticsData])

  const handleCommunityChange = useCallback((communityId: string) => {
    setSelectedCommunity(communityId)
  }, [])

  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }, [])

  // Summary stats cards
  const summaryCards = [
    {
      title: 'Total Users',
      value: analyticsData.summaryStats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Content Items',
      value: analyticsData.summaryStats?.totalContent || 0,
      icon: BookOpen,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Recent Activities',
      value: analyticsData.summaryStats?.recentActivities || 0,
      icon: Activity,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Active Sessions',
      value: analyticsData.agentUsage?.reduce((sum, agent) => sum + agent.conversation_count, 0) || 0,
      icon: MessageSquare,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ]

  // Prepare chart data
  const contentEngagementChartData = analyticsData.contentEngagement?.slice(0, 8).map(item => ({
    name: item.content_items.title.substring(0, 20) + '...',
    engagements: item.engagement_count,
    type: item.content_items.content_type
  })) || []

  const agentUsageChartData = analyticsData.agentUsage?.slice(0, 6).map((agent, index) => ({
    name: agent.content_items.title.substring(0, 15) + '...',
    conversations: agent.conversation_count,
    messages: agent.total_messages,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || []

  if (loading && !refreshing) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-80 animate-pulse"></div>
            </div>
          </div>
          
          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          
          {/* Skeleton Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonWidget />
            <SkeletonWidget />
            <SkeletonWidget />
            <SkeletonWidget />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">Track platform performance and user engagement</p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Community Filter */}
            <div className="relative">
              <select
                value={selectedCommunity}
                onChange={(e) => handleCommunityChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Communities</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>{community.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={handleRefresh}
              className="ml-auto text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} className={`${stat.bgColor} rounded-xl p-6 border border-gray-200`}>
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.textColor}`}>
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Activity Ranking */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900">Top Active Users</h2>
              </div>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
            <div className="p-6">
              {analyticsData.userActivity && analyticsData.userActivity.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.userActivity.slice(0, 10).map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{user.activity_count}</p>
                        <p className="text-xs text-gray-500">activities</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No user activity data"
                  description="User activity will appear here once users start engaging with the platform"
                  icon={Users}
                />
              )}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <span className="text-sm text-gray-500">Live feed</span>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.recentActivity.slice(0, 20).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <Activity className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {activity.users.first_name} {activity.users.last_name}
                          </span>{' '}
                          {activity.activity_type.replace('_', ' ')}
                          {activity.content_items && (
                            <span className="text-gray-600">
                              {' '}"<span className="font-medium">{activity.content_items.title}</span>"
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No recent activity"
                  description="User activities will appear here as they happen on your platform"
                  icon={Activity}
                />
              )}
            </div>
          </div>

          {/* Content Engagement Chart */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900">Content Engagement</h2>
              </div>
            </div>
            <div className="p-6">
              {contentEngagementChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentEngagementChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="engagements" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  title="No engagement data"
                  description="Content engagement metrics will appear here once users start interacting with your content"
                  icon={BarChart3}
                />
              )}
            </div>
          </div>

          {/* Agent Usage Chart */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <PieChart className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">Agent Usage</h2>
              </div>
            </div>
            <div className="p-6">
              {agentUsageChartData.length > 0 ? (
                <div className="flex items-center space-x-8">
                  <ResponsiveContainer width="70%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={agentUsageChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="conversations"
                      >
                        {agentUsageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {agentUsageChartData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState 
                  title="No agent usage data"
                  description="Agent conversation statistics will appear here once users start chatting with AI agents"
                  icon={MessageSquare}
                />
              )}
            </div>
          </div>
        </div>

        {/* Course Progress Overview */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Platform Overview</h2>
              </div>
              <span className="text-sm text-gray-500">
                {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {((analyticsData.summaryStats?.recentActivities || 0) / Math.max(analyticsData.summaryStats?.totalUsers || 1, 1) * 100).toFixed(1)}%
                </div>
                <p className="text-gray-600">User Engagement Rate</p>
                <p className="text-sm text-gray-500 mt-1">Activities per user in selected period</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analyticsData.contentEngagement?.length || 0}
                </div>
                <p className="text-gray-600">Active Content Items</p>
                <p className="text-sm text-gray-500 mt-1">Content with user interactions</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {(analyticsData.agentUsage?.reduce((sum, agent) => sum + agent.total_messages, 0) || 0)}
                </div>
                <p className="text-gray-600">Total Messages</p>
                <p className="text-sm text-gray-500 mt-1">Messages exchanged with AI agents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
