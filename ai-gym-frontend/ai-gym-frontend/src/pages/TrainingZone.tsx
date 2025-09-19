import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Dumbbell, Plus, Search, Target, TrendingUp, Calendar, Users, BarChart3, Play, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface WODStats {
  totalWods: number
  publishedWods: number
  draftWods: number
  activeUsers: number
}

interface RecentWOD {
  id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes: number
  thumbnail_url: string
  created_at: string
  updated_at: string
}

export function TrainingZone() {
  const [stats, setStats] = useState<WODStats>({
    totalWods: 0,
    publishedWods: 0,
    draftWods: 0,
    activeUsers: 0
  })
  const [recentWods, setRecentWods] = useState<RecentWOD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrainingZoneData()
  }, [])

  const fetchTrainingZoneData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch WODs statistics
      const { data: wodsData, error: wodsError } = await supabase
        .from('wods')
        .select('id, title, description, status, difficulty_level, estimated_duration_minutes, thumbnail_url, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(6)

      if (wodsError) {
        throw new Error(`Failed to fetch WODs: ${wodsError.message}`)
      }

      setRecentWods(wodsData || [])

      // Calculate stats
      const { count: totalCount } = await supabase
        .from('wods')
        .select('*', { count: 'exact', head: true })

      const { count: publishedCount } = await supabase
        .from('wods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      const { count: draftCount } = await supabase
        .from('wods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')

      // Get active users count (users who have activities in the last 30 days)
      const { count: activeUsersCount } = await supabase
        .from('user_activities')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalWods: totalCount || 0,
        publishedWods: publishedCount || 0,
        draftWods: draftCount || 0,
        activeUsers: activeUsersCount || 0
      })

    } catch (err) {
      console.error('Error fetching training zone data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load training zone data')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading Training Zone...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Dumbbell className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Training Zone</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchTrainingZoneData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Zone</h1>
              <p className="mt-2 text-gray-600">
                Create and manage workout programs and fitness challenges
              </p>
            </div>
          </div>
          <Link
            to="/training-zone/wods/builder"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Create WOD
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-orange-500 rounded-lg p-3 mr-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total WODs</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.totalWods.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-lg p-3 mr-4">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.publishedWods.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-500 rounded-lg p-3 mr-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.draftWods.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-lg p-3 mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/training-zone/wods"
              className="flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Browse WODs</p>
                <p className="text-sm text-gray-500">View all workout programs</p>
              </div>
            </Link>
            
            <Link
              to="/training-zone/wods/builder"
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
            
            <button className="flex items-center space-x-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-500">Track performance</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent WODs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent WODs</h2>
            <Link
              to="/training-zone/wods"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {recentWods.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-orange-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No WODs yet</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  Get started by creating your first workout of the day.
                </p>
                <div className="mt-6">
                  <Link
                    to="/training-zone/wods/builder"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm"
                  >
                    <Plus className="-ml-1 mr-2 h-4 w-4" />
                    Create First WOD
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentWods.map((wod) => (
                  <Link
                    key={wod.id}
                    to={`/training-zone/wods/${wod.id}/builder`}
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {wod.thumbnail_url ? (
                        <img
                          src={wod.thumbnail_url}
                          alt={wod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                          <Dumbbell className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wod.status)}`}>
                          {wod.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {wod.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {wod.description || 'No description provided'}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          {wod.difficulty_level && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(wod.difficulty_level)}`}>
                              {wod.difficulty_level}
                            </span>
                          )}
                          {wod.estimated_duration_minutes && (
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDuration(wod.estimated_duration_minutes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default TrainingZone