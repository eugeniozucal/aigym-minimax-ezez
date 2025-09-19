import React, { useState, useEffect } from 'react'
import { ModernLayout } from '@/components/layout/ModernLayout'
import { 
  fetchAnalytics, 
  getDateRangePresets, 
  AnalyticsData, 
  Community, 
  supabase,
  UserActivityRanking,
  RecentActivity,
  ContentEngagementData,
  AgentUsageData
} from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Calendar, 
  ChevronDown, 
  Users, 
  Activity, 
  FileText, 
  Bot,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardFilters {
  communityId: string
  dateRange: {
    preset: string
    start: string
    end: string
    label: string
  }
}

export function AnalyticsDashboard() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [filters, setFilters] = useState<DashboardFilters>({
    communityId: 'all',
    dateRange: {
      preset: 'last30days',
      ...getDateRangePresets().last30days
    }
  })
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [clientFilterOpen, setClientFilterOpen] = useState(false)

  const dateRangePresets = getDateRangePresets()

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [filters])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('status', 'active')
        .order('name')
      
      if (error) throw error
      setCommunities(data || [])
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await fetchAnalytics(
        filters.communityId,
        {
          start: filters.dateRange.start,
          end: filters.dateRange.end
        },
        ['summary_stats', 'user_activity', 'recent_activity', 'content_engagement', 'agent_usage']
      )
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (preset: string) => {
    const range = dateRangePresets[preset as keyof typeof dateRangePresets]
    setFilters(prev => ({
      ...prev,
      dateRange: {
        preset,
        ...range
      }
    }))
    setDateRangeOpen(false)
  }

  const handleCommunityChange = (communityId: string) => {
    setFilters(prev => ({ ...prev, communityId }))
    setClientFilterOpen(false)
  }

  const getSelectedClient = () => {
    if (filters.communityId === 'all') return 'All Communities'
    return communities.find(c => c.id === filters.communityId)?.name || 'Unknown Community'
  }

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor platform activity and user engagement</p>
          </div>

          {/* Global Filters */}
          <div className="flex items-center space-x-4">
            {/* Community Filter */}
            <div className="relative">
              <button
                onClick={() => setClientFilterOpen(!clientFilterOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Users className="h-4 w-4" />
                <span>{getSelectedClient()}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {clientFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleCommunityChange('all')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        filters.communityId === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      All Communities
                    </button>
                    {communities.map((community) => (
                      <button
                        key={community.id}
                        onClick={() => handleCommunityChange(community.id)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          filters.communityId === community.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {community.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <button
                onClick={() => setDateRangeOpen(!dateRangeOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calendar className="h-4 w-4" />
                <span>{filters.dateRange.label}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {dateRangeOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    {Object.entries(dateRangePresets).map(([key, range]) => (
                      <button
                        key={key}
                        onClick={() => handleDateRangeChange(key)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          filters.dateRange.preset === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData?.summaryStats?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published Content</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData?.summaryStats?.totalContent || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recent Activities</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData?.summaryStats?.recentActivities || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Activity Ranking */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    Most Active Users
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Top users by activity count</p>
                </div>
                <div className="p-6">
                  {analyticsData?.userActivity && analyticsData.userActivity.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.userActivity.slice(0, 10).map((user, index) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {user.activity_count} activities
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No user activity data available</p>
                      <p className="text-sm">Activity will appear here once users start engaging with content</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-500" />
                    Recent Activity
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Latest platform activities</p>
                </div>
                <div className="p-6">
                  {analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.recentActivity.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 text-sm">
                          <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-gray-900">
                              <span className="font-medium">
                                {activity.users.first_name} {activity.users.last_name}
                              </span>
                              {' '}{formatActivityType(activity.activity_type)}
                              {activity.content_items && (
                                <span className="text-blue-600">
                                  {' '}"{activity.content_items.title}"
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{getTimeAgo(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent activity</p>
                      <p className="text-sm">User activities will appear here in real-time</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Engagement & Agent Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Content Engagement Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                    Content Engagement
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Most engaged content items</p>
                </div>
                <div className="p-6">
                  {analyticsData?.contentEngagement && analyticsData.contentEngagement.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.contentEngagement}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="content_items.title" 
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="engagement_count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No content engagement data</p>
                      <p className="text-sm">Engagement metrics will appear once users interact with content</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Usage Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-orange-500" />
                    AI Agent Usage
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Most used AI agents</p>
                </div>
                <div className="p-6">
                  {analyticsData?.agentUsage && analyticsData.agentUsage.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.agentUsage.slice(0, 8).map((agent, index) => (
                        <div key={agent.agent_id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {agent.content_items.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {agent.conversation_count} conversations • {agent.total_messages} messages
                              </p>
                            </div>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(100, (agent.conversation_count / Math.max(...(analyticsData.agentUsage?.map(a => a.conversation_count) || [1]))) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No agent usage data</p>
                      <p className="text-sm">Usage statistics will appear once users interact with AI agents</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  )
}