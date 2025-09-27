import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ArrowLeft, Clock, Dumbbell, Star, Play, CheckCircle, Users, Target } from 'lucide-react'
import { toast } from 'sonner'

interface WOD {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  tags: string[]
  created_at: string
  updated_at: string
}

export function UserWODDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [wod, setWod] = useState<WOD | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [userWodData, setUserWodData] = useState<any>(null)

  useEffect(() => {
    if (id && user) {
      fetchWODDetails()
    }
  }, [id, user])

  const fetchWODDetails = async () => {
    if (!id || !user) return

    try {
      setLoading(true)
      setError(null)

      // Get user's community_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('community_id')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        console.error('Error fetching user data:', userError)
        setError('Failed to load user information')
        return
      }

      if (!userData?.community_id) {
        setError('User is not assigned to a community')
        return
      }

      // Fetch WOD details
      const { data: wodData, error: wodError } = await supabase
        .from('wods')
        .select('*')
        .eq('id', id)
        .eq('status', 'published') // Only show published WODs to users
        .maybeSingle()

      if (wodError) {
        console.error('Error fetching WOD:', wodError)
        setError('Failed to load WOD details')
        return
      }

      if (!wodData) {
        setError('WOD not found or not available')
        return
      }

      // Check if user has access to this WOD through community assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('wod_community_assignments')
        .select('*')
        .eq('wod_id', id)
        .eq('community_id', userData.community_id)
        .maybeSingle()

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        console.error('Error checking WOD assignment:', assignmentError)
      }

      // For now, allow access to all published WODs
      // In production, you might want to enforce community-based access
      setWod(wodData)

      // Check if user has already started/completed this WOD
      const { data: userWod, error: userWodError } = await supabase
        .from('user_wods')
        .select('*')
        .eq('user_id', user.id)
        .eq('wod_id', id)
        .maybeSingle()

      if (userWodError && userWodError.code !== 'PGRST116') {
        console.error('Error fetching user WOD data:', userWodError)
      } else if (userWod) {
        setUserWodData(userWod)
        setIsStarted(true)
        setIsCompleted(!!userWod.completed_at)
      }

    } catch (error) {
      console.error('Error in fetchWODDetails:', error)
      setError('Failed to load WOD details')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWOD = async () => {
    if (!wod || !user) return

    try {
      // Create or update user_wods entry
      const { error } = await supabase
        .from('user_wods')
        .upsert({
          user_id: user.id,
          wod_id: wod.id,
          client_id: null // This should be set based on your client structure
        })

      if (error) {
        console.error('Error starting WOD:', error)
        toast.error('Failed to start WOD')
        return
      }

      setIsStarted(true)
      toast.success('WOD started! Good luck!')
    } catch (error) {
      console.error('Error starting WOD:', error)
      toast.error('Failed to start WOD')
    }
  }

  const handleCompleteWOD = async () => {
    if (!wod || !user) return

    try {
      const completedAt = new Date().toISOString()
      
      const { error } = await supabase
        .from('user_wods')
        .upsert({
          user_id: user.id,
          wod_id: wod.id,
          completed_at: completedAt,
          attempts: (userWodData?.attempts || 0) + 1
        })

      if (error) {
        console.error('Error completing WOD:', error)
        toast.error('Failed to complete WOD')
        return
      }

      setIsCompleted(true)
      toast.success('Congratulations! WOD completed!')
    } catch (error) {
      console.error('Error completing WOD:', error)
      toast.error('Failed to complete WOD')
    }
  }

  const getDifficultyColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Duration not specified'
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading WOD details...</p>
        </div>
      </div>
    )
  }

  if (error || !wod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <Dumbbell className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">WOD Not Found</h3>
          <p className="text-sm text-gray-500 mb-4">{error || 'This WOD is not available or has been removed.'}</p>
          <button
            onClick={() => navigate('/user/training-zone')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to Training Zone
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <button
              onClick={() => navigate('/user/training-zone')}
              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Training Zone</span>
            </button>
            <span>/</span>
            <span>WOD Details</span>
          </div>

          <div className="flex items-start space-x-6">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {wod.thumbnail_url ? (
                <img
                  src={wod.thumbnail_url}
                  alt={wod.title}
                  className="w-48 h-32 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-48 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <Dumbbell className="h-12 w-12 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{wod.title}</h1>
                  {wod.description && (
                    <p className="text-lg text-gray-600">{wod.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="text-sm font-medium text-gray-700">4.8 (124 reviews)</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(wod.estimated_duration_minutes)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="h-4 w-4" />
                  <span>WOD Challenge</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>1,200+ participants</span>
                </div>

                {wod.difficulty_level && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(wod.difficulty_level)}`}>
                    {wod.difficulty_level} level
                  </span>
                )}
              </div>

              {/* Tags */}
              {wod.tags && wod.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {wod.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center space-x-4">
                {!isStarted ? (
                  <button
                    onClick={handleStartWOD}
                    className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    <span>Start WOD</span>
                  </button>
                ) : !isCompleted ? (
                  <button
                    onClick={handleCompleteWOD}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Complete WOD</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                )}

                {userWodData && (
                  <div className="text-sm text-gray-500">
                    Attempts: {userWodData.attempts || 1}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About This WOD</h2>
          
          {wod.description ? (
            <div className="prose max-w-none text-gray-700">
              <p>{wod.description}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">No detailed description available for this WOD.</p>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">WOD Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estimated Duration</h4>
                <p className="text-gray-600">{formatDuration(wod.estimated_duration_minutes)}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Difficulty Level</h4>
                <p className="text-gray-600">
                  {wod.difficulty_level ? wod.difficulty_level.charAt(0).toUpperCase() + wod.difficulty_level.slice(1) : 'Not specified'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                <p className="text-gray-600">
                  {new Date(wod.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Last Updated</h4>
                <p className="text-gray-600">
                  {new Date(wod.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
