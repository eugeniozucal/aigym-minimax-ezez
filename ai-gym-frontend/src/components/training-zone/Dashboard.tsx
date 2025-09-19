import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Target, 
  Eye, 
  Search, 
  Users, 
  Plus, 
  Calendar, 
  Dumbbell, 
  Package,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface TrainingStats {
  totalWods: number
  publishedWods: number
  draftWods: number
  totalBlocks: number
  totalPrograms: number
  activeUsers: number
}

interface RecentItem {
  id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  type: 'wod' | 'block' | 'program'
  created_at: string
  updated_at: string
}

export function Dashboard() {
  const [stats, setStats] = useState<TrainingStats>({
    totalWods: 0,
    publishedWods: 0,
    draftWods: 0,
    totalBlocks: 0,
    totalPrograms: 0,
    activeUsers: 0
  })
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch WODs data
      const { data: wodsData, error: wodsError } = await supabase
        .from('wods')
        .select('id, title, description, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3)

      if (wodsError) {
        console.error('Error fetching WODs:', wodsError)
      }

      // Calculate WOD stats
      const { count: totalWodsCount } = await supabase
        .from('wods')
        .select('*', { count: 'exact', head: true })

      const { count: publishedWodsCount } = await supabase
        .from('wods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      const { count: draftWodsCount } = await supabase
        .from('wods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')

      // Get active users count (users who have activities in the last 30 days)
      const { count: activeUsersCount } = await supabase
        .from('user_activities')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // TODO: Add blocks and programs data when those tables exist
      const recentWods: RecentItem[] = (wodsData || []).map(wod => ({
        ...wod,
        type: 'wod' as const
      }))

      setStats({
        totalWods: totalWodsCount || 0,
        publishedWods: publishedWodsCount || 0,
        draftWods: draftWodsCount || 0,
        totalBlocks: 0, // TODO: Implement when blocks table exists
        totalPrograms: 0, // TODO: Implement when programs table exists
        activeUsers: activeUsersCount || 0
      })

      setRecentItems(recentWods)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wod': return Dumbbell
      case 'block': return Package
      case 'program': return Calendar
      default: return Target
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'wod': return 'text-orange-600'
      case 'block': return 'text-blue-600'
      case 'program': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Zone Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Monitor and manage your training content across all modules
            </p>
          </div>
          <Link
            to="/page-builder"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Create Page
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-orange-500 rounded-lg p-3 mr-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total WODs</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalWods.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-lg p-3 mr-4">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.publishedWods.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-500 rounded-lg p-3 mr-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.draftWods.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-lg p-3 mr-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">BLOCKS</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalBlocks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-lg p-3 mr-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Programs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalPrograms.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-indigo-500 rounded-lg p-3 mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/training-zone/wods"
              className="flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Dumbbell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Browse WODs</p>
                <p className="text-sm text-gray-500">View all workout programs</p>
              </div>
            </Link>
            
            <Link
              to="/page-builder?repo=wods"
              className="flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create WOD</p>
                <p className="text-sm text-gray-500">Design new workout</p>
              </div>
            </Link>

            <Link
              to="/training-zone/blocks"
              className="flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Browse BLOCKS</p>
                <p className="text-sm text-gray-500">Modular workout components</p>
              </div>
            </Link>
            
            <button className="flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                <BarChart3 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-500">Track performance</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link
              to="/training-zone/wods"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {recentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-orange-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No recent activity</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  Start creating content to see recent activity here.
                </p>
                <div className="mt-6">
                  <Link
                    to="/page-builder"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm"
                  >
                    <Plus className="-ml-1 mr-2 h-4 w-4" />
                    Create Content
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentItems.map((item) => {
                  const Icon = getTypeIcon(item.type)
                  return (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg bg-gray-100`}>
                        <Icon className={`h-5 w-5 ${getTypeColor(item.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {item.description || 'No description provided'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Updated {new Date(item.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard