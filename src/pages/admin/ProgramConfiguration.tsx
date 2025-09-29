import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, Calendar, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProgramCommunityAssignmentPanel } from '@/components/training-zone/ProgramCommunityAssignmentPanel'

interface Program {
  id: string
  title: string
  description: string
  thumbnail_url: string
  status: 'draft' | 'published' | 'archived'
  estimated_duration_weeks: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  program_type: 'strength' | 'cardio' | 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility'
  created_by: string
  created_at: string
  updated_at: string
  communities?: Array<{
    community_id: string
    community_name: string
    assigned_at: string
    brand_color: string
    logo_url?: string
  }>
}

export function ProgramConfiguration() {
  const { programId } = useParams<{ programId: string }>()
  const navigate = useNavigate()
  
  // Program data
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    estimated_duration_weeks: 1,
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    program_type: 'strength' as 'strength' | 'cardio' | 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility'
  })
  
  // Community assignment panel
  const [assignmentPanelOpen, setAssignmentPanelOpen] = useState(false)
  
  // Load program data
  useEffect(() => {
    if (programId) {
      loadProgram()
    }
  }, [programId])
  
  const loadProgram = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
      // Get program with community assignments
      const { data, error } = await supabase.functions.invoke('programs-api', {
        method: 'GET',
        body: {
          id: programId,
          include_communities: true
        }
      })
      
      if (error) throw error
      
      if (data?.data) {
        const programData = data.data
        setProgram(programData)
        setFormData({
          title: programData.title || '',
          description: programData.description || '',
          thumbnail_url: programData.thumbnail_url || '',
          status: programData.status || 'draft',
          estimated_duration_weeks: programData.estimated_duration_weeks || 1,
          difficulty_level: programData.difficulty_level || 'beginner',
          program_type: programData.program_type || 'strength'
        })
      }
    } catch (err) {
      console.error('Error loading program:', err)
      setError(err instanceof Error ? err.message : 'Failed to load program')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle form change
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])
  
  // Handle save
  const handleSave = async () => {
    if (!program) return
    
    try {
      setSaving(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }
      
      const { data, error } = await supabase.functions.invoke('programs-api', {
        method: 'PUT',
        body: {
          id: program.id,
          ...formData
        }
      })
      
      if (error) throw error
      
      if (data?.data) {
        setProgram(prev => prev ? { ...prev, ...data.data } : null)
        // Show success message
        alert('Program updated successfully!')
      }
    } catch (err) {
      console.error('Error saving program:', err)
      setError(err instanceof Error ? err.message : 'Failed to save program')
      alert('Failed to save program. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/admin/programs')
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading program...</p>
          </div>
        </div>
      </Layout>
    )
  }
  
  if (error || !program) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Program</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Program not found'}</p>
          <div className="mt-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
              Back to Programs
            </button>
          </div>
        </div>
      </Layout>
    )
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Program Configuration</h1>
                <p className="text-sm text-gray-500">Manage program details and community assignments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAssignmentPanelOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Users className="-ml-1 mr-2 h-4 w-4" />
                Manage Communities
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Configuration Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                  
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        placeholder="Enter program title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Enter program description"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    {/* Thumbnail URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        value={formData.thumbnail_url}
                        onChange={(e) => handleFormChange('thumbnail_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Program Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Program Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    
                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (weeks)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={formData.estimated_duration_weeks}
                        onChange={(e) => handleFormChange('estimated_duration_weeks', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={formData.difficulty_level}
                        onChange={(e) => handleFormChange('difficulty_level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    
                    {/* Program Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program Type
                      </label>
                      <select
                        value={formData.program_type}
                        onChange={(e) => handleFormChange('program_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="strength">Strength</option>
                        <option value="cardio">Cardio</option>
                        <option value="weight-loss">Weight Loss</option>
                        <option value="muscle-gain">Muscle Gain</option>
                        <option value="endurance">Endurance</option>
                        <option value="flexibility">Flexibility</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Program Preview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Program Preview</h3>
                  
                  <div className="space-y-3">
                    {/* Thumbnail Preview */}
                    {formData.thumbnail_url && (
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={formData.thumbnail_url}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{formData.title || 'Untitled Program'}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {formData.description || 'No description provided'}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                        formData.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : formData.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                      </span>
                      
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-gray-700 bg-gray-100">
                        {formData.estimated_duration_weeks} week{formData.estimated_duration_weeks > 1 ? 's' : ''}
                      </span>
                      
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-blue-700 bg-blue-100">
                        {formData.difficulty_level}
                      </span>
                      
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-purple-700 bg-purple-100">
                        {formData.program_type.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Community Assignments */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Community Assignments</h3>
                  
                  {program.communities && program.communities.length > 0 ? (
                    <div className="space-y-2">
                      {program.communities.map((community) => (
                        <div key={community.community_id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: community.brand_color }}
                          />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {community.community_name}
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={() => setAssignmentPanelOpen(true)}
                        className="w-full mt-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        Manage Assignments
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No community assignments</p>
                      <button
                        onClick={() => setAssignmentPanelOpen(true)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Assign Communities
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Program Metadata */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Program ID:</span>
                      <p className="text-gray-500 font-mono text-xs mt-1">{program.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-500">{formatDate(program.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <p className="text-gray-500">{formatDate(program.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Program Community Assignment Panel */}
        <ProgramCommunityAssignmentPanel
          program={program}
          isOpen={assignmentPanelOpen}
          onClose={() => {
            setAssignmentPanelOpen(false)
            // Refresh program data to show updated assignments
            loadProgram()
          }}
        />
      </div>
    </Layout>
  )
}