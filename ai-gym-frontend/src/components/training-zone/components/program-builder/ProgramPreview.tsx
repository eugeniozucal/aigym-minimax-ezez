import React, { useState, useEffect } from 'react'
import { ProgramData } from '../../ProgramBuilder'
import { 
  Calendar, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Clock,
  Loader2,
  Dumbbell,
  Package
} from 'lucide-react'
import { PageData } from '@/types/pageBuilder'
import { BlockRenderer } from '../BlockRenderer'
import { supabase } from '../../../lib/supabase'

interface ProgramPreviewProps {
  programData: ProgramData
  currentSubsectionId: string | null
  onSubsectionSelect: (subsectionId: string) => void
}

export function ProgramPreview({
  programData,
  currentSubsectionId,
  onSubsectionSelect
}: ProgramPreviewProps) {
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // FIXED FETCH FUNCTION WITH CORRECT TABLE MAPPING
  const fetchPageData = async (contentId: string, contentType: 'wods' | 'blocks') => {
    setLoading(true)
    setError(null)
    
    // Map content types to correct table names
    const tableMap: Record<string, string> = {
      'wods': 'wods',
      'blocks': 'workout_blocks' // FIX: blocks content is stored in workout_blocks table
    }
    
    const tableName = tableMap[contentType] || contentType
    
    try {
      // Use direct database query with correct table name
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', contentId)
        .single()
      
      if (error) {
        console.error(`Error fetching ${contentType} from ${tableName}:`, error)
        setError(`Failed to load ${contentType} content`)
        setPageData(null)
        return
      }
      
      // EXACT backend connection logic from PreviewModal.tsx - construct PageData format
      if (data) {
        const pageDataFormatted = {
          title: data.title,
          description: data.description || '',
          targetRepository: contentType,
          status: data.status || 'draft',
          pages: data.pages || [],
          settings: data.settings || {}
        }
        setPageData(pageDataFormatted)
      } else {
        setError(`No content found for ${contentType}`)
        setPageData(null)
      }
    } catch (error) {
      console.error(`Error fetching ${contentType} from ${tableName}:`, error)
      setError(`Failed to load ${contentType} content`)
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }
  
  // EXACT EFFECT LOGIC FROM PreviewModal.tsx
  useEffect(() => {
    const currentSubsection = currentSubsectionId 
      ? programData.sections.flatMap(s => s.subsections).find(sub => sub.id === currentSubsectionId)
      : null
    
    if (!currentSubsection || !currentSubsection.assignedContent) {
      setPageData(null)
      setLoading(false)
      setError(null)
      return
    }
    
    // Check if this is WODs or BLOCKS content that needs special fetching - EXACT LOGIC FROM PreviewModal.tsx
    if (currentSubsection.assignedContent.type === 'wods' || currentSubsection.assignedContent.type === 'blocks') {
      // For WODs/BLOCKS, we need to fetch from database directly
      const contentId = currentSubsection.assignedContent.id
      if (contentId) {
        fetchPageData(contentId, currentSubsection.assignedContent.type)
      } else {
        setError('No content ID available for fetching')
        setPageData(null)
        setLoading(false)
      }
    } else {
      // For other content types, handle differently or show error
      setError(`Unsupported content type: ${currentSubsection.assignedContent.type}`)
      setPageData(null)
      setLoading(false)
    }
  }, [currentSubsectionId, programData])
  
  // Get all subsections with assigned content
  const assignedSubsections = programData.sections.flatMap(section => 
    section.subsections.filter(sub => sub.assignedContent)
  )
  
  const currentSubsection = currentSubsectionId 
    ? programData.sections.flatMap(s => s.subsections).find(sub => sub.id === currentSubsectionId)
    : null
  
  const currentIndex = assignedSubsections.findIndex(sub => sub.id === currentSubsectionId)
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < assignedSubsections.length - 1
  
  const navigatePrev = () => {
    if (canNavigatePrev) {
      onSubsectionSelect(assignedSubsections[currentIndex - 1].id)
    }
  }
  
  const navigateNext = () => {
    if (canNavigateNext) {
      onSubsectionSelect(assignedSubsections[currentIndex + 1].id)
    }
  }
  
  // Repository configuration for icon - copying from PreviewModal.tsx
  const getRepositoryIcon = (repo: 'wods' | 'blocks' | 'programs') => {
    switch (repo) {
      case 'wods': return Dumbbell
      case 'blocks': return Package
      case 'programs': return Calendar
      default: return FileText
    }
  }
  
  const getRepositoryColor = (repo: 'wods' | 'blocks' | 'programs') => {
    switch (repo) {
      case 'wods': return 'orange'
      case 'blocks': return 'blue'
      case 'programs': return 'purple'
      default: return 'gray'
    }
  }
  
  if (assignedSubsections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-gray-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Content Assigned
          </h3>
          <p className="text-sm text-gray-500">
            Assign WODs or BLOCKS to subsections to preview them here. Use the three-dot menu on any subsection and select "Assign".
          </p>
        </div>
      </div>
    )
  }
  
  if (!currentSubsection || !currentSubsection.assignedContent) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Navigation List */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Program Content ({assignedSubsections.length} items)
          </h3>
          
          <div className="space-y-3">
            {assignedSubsections.map((subsection, index) => {
              const section = programData.sections.find(s => s.id === subsection.sectionId)
              if (!subsection.assignedContent) return null
              
              const RepositoryIcon = getRepositoryIcon(subsection.assignedContent.type)
              const color = getRepositoryColor(subsection.assignedContent.type)
              
              return (
                <div
                  key={subsection.id}
                  onClick={() => onSubsectionSelect(subsection.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      color === 'orange' ? 'bg-orange-100 text-orange-600' :
                      color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <RepositoryIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        {section?.title} • Item {index + 1}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {subsection.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {subsection.assignedContent.type.toUpperCase()}: {subsection.assignedContent.title}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  const section = programData.sections.find(s => s.id === currentSubsection.sectionId)
  const color = getRepositoryColor(currentSubsection.assignedContent.type)
  const RepositoryIcon = getRepositoryIcon(currentSubsection.assignedContent.type)
  
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {assignedSubsections.length}
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            {section?.title}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={navigatePrev}
            disabled={!canNavigatePrev}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={navigateNext}
            disabled={!canNavigateNext}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* ✅ EXACT WORKING BLOCKS PREVIEW CODE COPIED FROM PreviewModal.tsx */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50 min-h-0">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
          
          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading content...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="text-red-500 mb-4">
                <RepositoryIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Content</h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  if (currentSubsection.assignedContent) {
                    fetchPageData(currentSubsection.assignedContent.id, currentSubsection.assignedContent.type)
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                  color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                Try Again
              </button>
            </div>
          )}
          
          {/* Content Preview - Only show when pageData is loaded and not loading/error - EXACT CODE FROM PreviewModal.tsx */}
          {pageData && !loading && !error && (
            <>
              {/* Page Title and Description */}
              <div className="mb-8">
                <h1 className={`text-3xl font-bold mb-4 ${
                  color === 'orange' ? 'text-orange-900' :
                  color === 'blue' ? 'text-blue-900' :
                  color === 'purple' ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  {pageData.title}
                </h1>
                {pageData.description && (
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {pageData.description}
                  </p>
                )}
                
                {/* Metadata */}
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                  {pageData.settings.estimatedDuration && (
                    <span>
                      Duration: {pageData.settings.estimatedDuration} minutes
                    </span>
                  )}
                  {pageData.settings.difficulty && (
                    <span>
                      Difficulty: {pageData.settings.difficulty}/5
                    </span>
                  )}
                  {pageData.settings.tags && pageData.settings.tags.length > 0 && (
                    <span>
                      Tags: {pageData.settings.tags.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Page Content Blocks - EXACT CODE FROM PreviewModal.tsx */}
              {(() => {
                const currentPage = pageData.pages[0]  // For program preview, always use first page
                const blocks = currentPage?.blocks || []
                
                return blocks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl text-gray-400 mb-4">📄</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No content yet
                    </h3>
                    <p className="text-gray-600">
                      Add some blocks to see the preview content.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {blocks.map((block) => (
                      <div key={block.id} className="preview-block">
                        <BlockRenderer
                          block={block}
                          isSelected={false}
                          canMoveUp={false}
                          canMoveDown={false}
                          onSelect={() => {}}
                          onMoveUp={() => {}}
                          onMoveDown={() => {}}
                          isPreview={true}
                        />
                      </div>
                    ))}
                  </div>
                )
              })()}
            </>
          )}
          
          {/* No Content State */}
          {!pageData && !loading && !error && (
            <div className="text-center py-16">
              <div className={`h-16 w-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                color === 'orange' ? 'bg-orange-600' :
                color === 'blue' ? 'bg-blue-600' :
                color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'
              }`}>
                <RepositoryIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {currentSubsection.assignedContent.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {currentSubsection.assignedContent.type.toUpperCase()} content
              </p>
              <button
                onClick={() => {
                  if (currentSubsection.assignedContent) {
                    fetchPageData(currentSubsection.assignedContent.id, currentSubsection.assignedContent.type)
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                  color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                Load Content
              </button>
            </div>
          )}
        </div>
        
        {/* Preview Footer - EXACT CODE FROM PreviewModal.tsx */}
        <div className="max-w-3xl mx-auto mt-6 text-center">
          <div className="text-sm text-gray-600">
            Preview mode • Changes are not saved automatically
          </div>
        </div>
      </div>
    </div>
  )
}