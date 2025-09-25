import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ArrowLeft, Clock, Package, Star, Play, CheckCircle, Users, Wrench, Target } from 'lucide-react'
import { toast } from 'sonner'

interface WorkoutBlock {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  tags: string[]
  block_category: 'warm-up' | 'cardio' | 'strength' | 'flexibility' | 'cool-down' | 'general' | null
  equipment_needed: string[]
  instructions: string | null
  created_at: string
  updated_at: string
}

export function UserBLOCKDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [block, setBlock] = useState<WorkoutBlock | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (id && user) {
      fetchBlockDetails()
    }
  }, [id, user])

  const fetchBlockDetails = async () => {
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

      // Fetch Block details
      const { data: blockData, error: blockError } = await supabase
        .from('workout_blocks')
        .select('*')
        .eq('id', id)
        .eq('status', 'published') // Only show published blocks to users
        .maybeSingle()

      if (blockError) {
        console.error('Error fetching block:', blockError)
        setError('Failed to load block details')
        return
      }

      if (!blockData) {
        setError('Block not found or not available')
        return
      }

      // Check if user has access to this block through community assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('workout_block_community_assignments')
        .select('*')
        .eq('workout_block_id', id)
        .eq('community_id', userData.community_id)
        .maybeSingle()

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        console.error('Error checking block assignment:', assignmentError)
      }

      // For now, allow access to all published blocks
      // In production, you might want to enforce community-based access
      setBlock(blockData)

    } catch (error) {
      console.error('Error in fetchBlockDetails:', error)
      setError('Failed to load block details')
    } finally {
      setLoading(false)
    }
  }

  const handleStartBlock = () => {
    setIsStarted(true)
    toast.success('Block started! Follow the instructions below.')
  }

  const handleCompleteBlock = () => {
    setIsCompleted(true)
    toast.success('Great job! Block completed!')
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

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'warm-up':
        return 'bg-yellow-100 text-yellow-800'
      case 'cardio':
        return 'bg-red-100 text-red-800'
      case 'strength':
        return 'bg-blue-100 text-blue-800'
      case 'flexibility':
        return 'bg-green-100 text-green-800'
      case 'cool-down':
        return 'bg-purple-100 text-purple-800'
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
          <p className="text-sm text-gray-500 mt-3">Loading block details...</p>
        </div>
      </div>
    )
  }

  if (error || !block) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Block Not Found</h3>
          <p className="text-sm text-gray-500 mb-4">{error || 'This block is not available or has been removed.'}</p>
          <button
            onClick={() => navigate('/user/training-zone')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <span>Block Details</span>
          </div>

          <div className="flex items-start space-x-6">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {block.thumbnail_url ? (
                <img
                  src={block.thumbnail_url}
                  alt={block.title}
                  className="w-48 h-32 object-cover rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-48 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="h-12 w-12 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{block.title}</h1>
                  {block.description && (
                    <p className="text-lg text-gray-600">{block.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="text-sm font-medium text-gray-700">4.8 (89 reviews)</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(block.estimated_duration_minutes)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="h-4 w-4" />
                  <span>Workout Block</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>850+ completed</span>
                </div>

                {block.equipment_needed && block.equipment_needed.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Wrench className="h-4 w-4" />
                    <span>{block.equipment_needed.length} equipment item{block.equipment_needed.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {block.difficulty_level && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(block.difficulty_level)}`}>
                    {block.difficulty_level} level
                  </span>
                )}
                
                {block.block_category && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(block.block_category)}`}>
                    {block.block_category.replace('-', ' ')}
                  </span>
                )}
              </div>

              {/* Tags */}
              {block.tags && block.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {block.tags.map((tag, index) => (
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
                    onClick={handleStartBlock}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    <span>Start Block</span>
                  </button>
                ) : !isCompleted ? (
                  <button
                    onClick={handleCompleteBlock}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Complete Block</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructions</h2>
              
              {block.instructions ? (
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{block.instructions}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No specific instructions provided for this block.</p>
              )}
              
              {block.description && block.description !== block.instructions && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Block</h3>
                  <div className="prose max-w-none text-gray-700">
                    <p>{block.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Equipment Needed */}
            {block.equipment_needed && block.equipment_needed.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Equipment Needed</span>
                </h3>
                <ul className="space-y-2">
                  {block.equipment_needed.map((equipment, index) => (
                    <li key={index} className="flex items-center space-x-2 text-gray-700">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>{equipment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Block Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Block Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                  <p className="text-gray-600">{formatDuration(block.estimated_duration_minutes)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Difficulty</h4>
                  <p className="text-gray-600">
                    {block.difficulty_level ? block.difficulty_level.charAt(0).toUpperCase() + block.difficulty_level.slice(1) : 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                  <p className="text-gray-600">
                    {block.block_category ? block.block_category.replace('-', ' ').charAt(0).toUpperCase() + block.block_category.replace('-', ' ').slice(1) : 'General'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                  <p className="text-gray-600">
                    {new Date(block.created_at).toLocaleDateString('en-US', {
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
    </div>
  )
}
