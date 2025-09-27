import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Calendar, 
  Target, 
  Hash, 
  Image as ImageIcon,
  Dumbbell,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface WODFormData {
  title: string
  description: string
  thumbnail_url: string
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

interface WOD extends WODFormData {
  id: string
  created_by: string
  created_at: string
  updated_at: string
}

export function WODEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [wod, setWod] = useState<WOD | null>(null)
  const [formData, setFormData] = useState<WODFormData>({
    title: '',
    description: '',
    thumbnail_url: '',
    status: 'draft',
    estimated_duration_minutes: 30,
    difficulty_level: 'beginner',
    tags: []
  })
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      fetchWOD(id)
    }
  }, [isEditing, id])

  const fetchWOD = async (wodId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.functions.invoke('wods-api', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch WOD')
      }

      if (!data?.data) {
        throw new Error('WOD not found')
      }

      // Find the specific WOD
      const wodData = Array.isArray(data.data) 
        ? data.data.find((w: WOD) => w.id === wodId)
        : data.data.id === wodId ? data.data : null

      if (!wodData) {
        throw new Error('WOD not found')
      }

      setWod(wodData)
      setFormData({
        title: wodData.title || '',
        description: wodData.description || '',
        thumbnail_url: wodData.thumbnail_url || '',
        status: wodData.status || 'draft',
        estimated_duration_minutes: wodData.estimated_duration_minutes || 30,
        difficulty_level: wodData.difficulty_level || 'beginner',
        tags: wodData.tags || []
      })
    } catch (err) {
      console.error('Error fetching WOD:', err)
      setError(err instanceof Error ? err.message : 'Failed to load WOD')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof WODFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (success) setSuccess(null)
    if (error) setError(null)
  }

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTagAdd()
    }
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Title is required'
    }
    if (formData.estimated_duration_minutes <= 0) {
      return 'Duration must be greater than 0'
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const method = isEditing ? 'PUT' : 'POST'
      const url = isEditing ? `?id=${id}` : ''
      
      const { data, error } = await supabase.functions.invoke('wods-api' + url, {
        method,
        body: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (error) {
        throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} WOD`)
      }

      setSuccess(`WOD ${isEditing ? 'updated' : 'created'} successfully!`)
      
      if (!isEditing && data?.data?.id) {
        // Redirect to edit mode for newly created WOD
        setTimeout(() => {
          navigate(`/training-zone/wods/${data.data.id}/edit`)
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving WOD:', err)
      setError(err instanceof Error ? err.message : 'Failed to save WOD')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/training-zone/wods')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading WOD...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit WOD' : 'Create New WOD'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update your workout program' : 'Design a new workout of the day'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="-ml-1 mr-2 h-4 w-4" />
              )}
              {saving ? 'Saving...' : (isEditing ? 'Update WOD' : 'Create WOD')}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter WOD title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe this workout program..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="inline h-4 w-4 mr-1" />
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    <Eye className="inline h-4 w-4 mr-1" />
                    Publication Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published' | 'archived')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Workout Details */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Workout Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Estimated Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    min="1"
                    max="300"
                    value={formData.estimated_duration_minutes}
                    onChange={(e) => handleInputChange('estimated_duration_minutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    value={formData.difficulty_level}
                    onChange={(e) => handleInputChange('difficulty_level', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <Hash className="inline h-5 w-5 mr-1" />
                Tags
              </h2>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Preview */}
            {formData.thumbnail_url && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thumbnail Preview</h2>
                <div className="max-w-md">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              • After saving your WOD, you can add pages and content blocks using the page builder
            </p>
            <p>
              • Use the assignment system to distribute this WOD to specific communities or users
            </p>
            <p>
              • Monitor engagement and completion rates through the analytics dashboard
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default WODEditor