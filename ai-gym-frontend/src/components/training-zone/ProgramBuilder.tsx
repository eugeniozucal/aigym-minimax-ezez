import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProgramIndexBuilder } from './components/program-builder/ProgramIndexBuilder'
import { ProgramPreview } from './components/program-builder/ProgramPreview'
import { RepositoryPopup } from './components/RepositoryPopup'
import { supabase } from '../../../lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Save, Eye, Settings } from 'lucide-react'

export interface ProgramSection {
  id: string
  title: string
  order: number
  isExpanded: boolean
  subsections: ProgramSubsection[]
}

export interface ProgramSubsection {
  id: string
  title: string
  order: number
  sectionId: string
  assignedContent?: {
    type: 'wods' | 'blocks'
    id: string
    title: string
    thumbnail_url?: string
    description?: string
  }
}

export interface ProgramData {
  id?: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  sections: ProgramSection[]
  settings: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    estimatedDurationWeeks: number
    programType: 'strength' | 'cardio' | 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility'
    tags: string[]
  }
}

export function ProgramBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const isEditing = Boolean(id)
  
  // Core state
  const [programData, setProgramData] = useState<ProgramData>({
    title: 'New Program',
    description: '',
    status: 'draft',
    sections: [
      {
        id: 'section-1',
        title: 'Introduction',
        order: 1,
        isExpanded: true,
        subsections: []
      }
    ],
    settings: {
      difficulty: 'beginner',
      estimatedDurationWeeks: 8,
      programType: 'strength',
      tags: []
    }
  })
  
  const [currentSubsectionId, setCurrentSubsectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Repository popup state
  const [repositoryPopup, setRepositoryPopup] = useState<{
    type: 'wods' | 'blocks'
    isOpen: boolean
    subsectionId: string | null
  }>({ type: 'wods', isOpen: false, subsectionId: null })

  // Load program data when editing
  useEffect(() => {
    if (isEditing && id) {
      loadProgramData(id)
    }
  }, [isEditing, id])

  const loadProgramData = async (programId: string) => {
    try {
      setLoading(true)
      
      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User not authenticated')
      }
      
      // Load from programs API
      const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
      const apiUrl = `${supabaseUrl}/functions/v1/programs-api?id=${programId}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to load program: ${response.status}`)
      }
      
      const data = await response.json()
      const program = data.data
      
      if (!program) {
        throw new Error('Program not found')
      }
      
      // Transform API data to frontend format
      const transformedProgram: ProgramData = {
        id: program.id,
        title: program.title,
        description: program.description || '',
        status: program.status,
        sections: program.sections || [
          {
            id: 'section-1',
            title: 'Introduction',
            order: 1,
            isExpanded: true,
            subsections: []
          }
        ],
        settings: {
          difficulty: program.difficulty_level || 'beginner',
          estimatedDurationWeeks: program.estimated_duration_weeks || 8,
          programType: program.program_type || 'strength',
          tags: program.tags || []
        }
      }
      
      setProgramData(transformedProgram)
    } catch (err) {
      setError('Failed to load program data')
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveProgramData = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User not authenticated. Please log in and try again.')
      }
      
      // Prepare data for API
      const apiData = {
        title: programData.title,
        description: programData.description,
        status: programData.status,
        difficulty_level: programData.settings.difficulty,
        estimated_duration_weeks: programData.settings.estimatedDurationWeeks,
        program_type: programData.settings.programType,
        tags: programData.settings.tags,
        sections: programData.sections,
        settings: programData.settings
      }
      
      const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
      const method = isEditing ? 'PUT' : 'POST'
      const apiUrl = isEditing 
        ? `${supabaseUrl}/functions/v1/programs-api?id=${id}`
        : `${supabaseUrl}/functions/v1/programs-api`
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
        },
        body: JSON.stringify(apiData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to save program: ${response.status}`)
      }
      
      const data = await response.json()
      
      // If creating new program, redirect to edit mode
      if (!isEditing && data?.data?.id) {
        navigate(`/program-builder?id=${data.data.id}`)
      }
      
      // Success feedback
      setSuccessMessage('Program saved successfully!')
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save program'
      setError(errorMessage)
      console.error('Save error:', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleBackToRepository = () => {
    navigate('/training-zone/programs')
  }

  const handleAssignContent = (subsectionId: string, contentType: 'wods' | 'blocks') => {
    setRepositoryPopup({
      type: contentType,
      isOpen: true,
      subsectionId
    })
  }

  const handleContentSelect = (contentItem: any) => {
    if (!repositoryPopup.subsectionId) return
    
    setProgramData(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => 
          subsection.id === repositoryPopup.subsectionId
            ? {
                ...subsection,
                assignedContent: {
                  type: repositoryPopup.type,
                  id: contentItem.id,
                  title: contentItem.title,
                  thumbnail_url: contentItem.thumbnail_url,
                  description: contentItem.description
                }
              }
            : subsection
        )
      }))
    }))
    
    setRepositoryPopup({ type: 'wods', isOpen: false, subsectionId: null })
  }

  const getCurrentSubsection = () => {
    if (!currentSubsectionId) return null
    
    for (const section of programData.sections) {
      const subsection = section.subsections.find(sub => sub.id === currentSubsectionId)
      if (subsection) return subsection
    }
    
    return null
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading Program Builder...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToRepository}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Program' : 'Create New Program'}
              </h1>
              <p className="text-sm text-gray-500">
                Build hierarchical training programs with sections and subsections
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Status Messages */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                {successMessage}
              </div>
            )}
            
            {/* Save Button */}
            <button
              onClick={saveProgramData}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  Save Program
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Index Builder */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Program Structure</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create sections and subsections to organize your training program
            </p>
          </div>
          
          <ProgramIndexBuilder
            programData={programData}
            setProgramData={setProgramData}
            onAssignContent={handleAssignContent}
            onSubsectionSelect={setCurrentSubsectionId}
            selectedSubsectionId={currentSubsectionId}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Preview</h2>
            <p className="text-sm text-gray-500 mt-1">
              Navigate through subsections with assigned content
            </p>
          </div>
          
          <ProgramPreview
            programData={programData}
            currentSubsectionId={currentSubsectionId}
            onSubsectionSelect={setCurrentSubsectionId}
          />
        </div>
      </div>

      {/* Repository Popup */}
      {repositoryPopup.isOpen && (
        <RepositoryPopup
          contentType={repositoryPopup.type}
          onContentSelect={handleContentSelect}
          onClose={() => setRepositoryPopup({ type: 'wods', isOpen: false, subsectionId: null })}
        />
      )}
    </div>
  )
}

export default ProgramBuilder