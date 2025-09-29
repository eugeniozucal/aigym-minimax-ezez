import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Search, Grid, List, Plus, Settings, Trash2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProgramCommunityAssignmentPanel } from './ProgramCommunityAssignmentPanel'

interface Program {
  id: string
  title: string
  description: string
  thumbnail_url: string
  status: 'draft' | 'published' | 'archived'
  estimated_duration_hours: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  program_type: string
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

interface ProgramsGalleryProps {
  className?: string
}

interface RepositoryFilters {
  search: string
  status: 'all' | 'draft' | 'published' | 'archived'
  difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced'
  programType: string
  sortBy: 'created_at' | 'updated_at' | 'title'
  sortOrder: 'asc' | 'desc'
  viewMode: 'cards' | 'list'
}

export function AdminProgramsGallery({ className }: ProgramsGalleryProps) {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Canva-style selection state
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  // Assignment panel state
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [assignmentPanelOpen, setAssignmentPanelOpen] = useState(false)
  
  // Bulk delete state
  const [bulkDeleting, setBulkDeleting] = useState(false)
  
  const [filters, setFilters] = useState<RepositoryFilters>({
    search: '',
    status: 'all',
    difficulty: 'all',
    programType: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    viewMode: 'cards'
  })
  
  // Apply filters first (needed by other functions)
  const filteredPrograms = useMemo(() => {
    let filtered = [...programs]
    
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(program => 
        program.title.toLowerCase().includes(searchTerm) ||
        program.description.toLowerCase().includes(searchTerm)
      )
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(program => program.status === filters.status)
    }
    
    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(program => program.difficulty_level === filters.difficulty)
    }
    
    // Program type filter
    if (filters.programType !== 'all') {
      filtered = filtered.filter(program => program.program_type === filters.programType)
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Program] as string
      const bValue = b[filters.sortBy as keyof Program] as string
      
      if (filters.sortOrder === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })
    
    return filtered
  }, [programs, filters])
  
  const loadPrograms = async () => {
    try {
      console.log('AdminProgramsGallery: Loading programs via API...')
      setLoading(true)
      setError(null)
      
      // Use the programs API edge function with service role access
      const { data, error } = await supabase.functions.invoke('programs-api', {
        body: {
          limit: 50,
          include_communities: true
        }
      })
      
      if (error) {
        console.error('AdminProgramsGallery: API error:', error)
        setError(`Failed to load programs: ${error.message}`)
        setPrograms([])
        return
      }
      
      if (data?.data && Array.isArray(data.data)) {
        console.log('AdminProgramsGallery: Successfully loaded', data.data.length, 'programs')
        
        // Transform programs to ensure they have all required fields
        const transformedPrograms = data.data.map(program => ({
          id: program.id || 'unknown',
          title: program.title || 'Untitled Program',
          description: program.description || 'No description available',
          thumbnail_url: program.thumbnail_url || '',
          status: program.status || 'draft',
          estimated_duration_hours: program.estimated_duration_hours || 4,
          difficulty_level: program.difficulty_level || 'beginner',
          program_type: program.program_type || 'general',
          created_by: program.created_by || '',
          created_at: program.created_at || new Date().toISOString(),
          updated_at: program.updated_at || new Date().toISOString(),
          communities: program.communities || []
        }))
        
        setPrograms(transformedPrograms)
      } else {
        console.log('AdminProgramsGallery: No data returned from API')
        setPrograms([])
      }
    } catch (err) {
      console.error('AdminProgramsGallery: Unexpected error loading programs:', err)
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }
  
  // Load programs
  useEffect(() => {
    loadPrograms()
  }, [filters.sortBy, filters.sortOrder])
  
  // Handle program selection (Canva-style)
  const handleProgramSelect = useCallback((programId: string, isCtrlKey = false) => {
    setSelectedPrograms(prev => {
      const newSelection = new Set(prev)
      
      if (isCtrlKey) {
        // Ctrl+Click: Toggle individual selection
        if (newSelection.has(programId)) {
          newSelection.delete(programId)
        } else {
          newSelection.add(programId)
        }
      } else {
        // Regular click in selection mode: Toggle selection
        if (newSelection.has(programId)) {
          newSelection.delete(programId)
        } else {
          newSelection.add(programId)
        }
      }
      
      // Update selection mode based on whether any programs are selected
      setIsSelectionMode(newSelection.size > 0)
      
      return newSelection
    })
  }, [])
  
  // Handle program card click
  const handleProgramClick = useCallback((program: Program, event: React.MouseEvent) => {
    // Prevent navigation when clicking checkbox area
    const target = event.target as HTMLElement
    const isCtrlKey = event.ctrlKey || event.metaKey
    
    if (target.closest('.checkbox-area') || selectedPrograms.size > 0 || isCtrlKey) {
      handleProgramSelect(program.id, isCtrlKey)
      return
    }
    
    // Navigate to program configuration page
    navigate(`/admin/programs/${program.id}`)
  }, [navigate, selectedPrograms.size, handleProgramSelect])
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPrograms(new Set())
    setIsSelectionMode(false)
  }, [])
  
  // Select all visible programs
  const selectAllVisible = useCallback(() => {
    const allVisibleIds = new Set(filteredPrograms.map(p => p.id))
    setSelectedPrograms(allVisibleIds)
    setIsSelectionMode(true)
  }, [filteredPrograms])
  
  // Check if all visible programs are selected
  const allVisibleSelected = useMemo(() => {
    if (filteredPrograms.length === 0) return false
    return filteredPrograms.every(p => selectedPrograms.has(p.id))
  }, [filteredPrograms, selectedPrograms])
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPrograms.size === 0) return
    
    const programCount = selectedPrograms.size
    if (!confirm(`Are you sure you want to delete ${programCount} program${programCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return
    }
    
    try {
      setBulkDeleting(true)
      
      // Delete programs one by one (API doesn't support bulk delete)
      for (const programId of selectedPrograms) {
        const { error } = await supabase.functions.invoke('programs-api', {
          method: 'DELETE',
          body: { id: programId }
        })
        
        if (error) {
          console.error(`Failed to delete program ${programId}:`, error)
        }
      }
      
      // Clear selection and reload
      clearSelection()
      await loadPrograms()
      
    } catch (error) {
      console.error('Error during bulk delete:', error)
      alert('Some programs could not be deleted. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }
  
  // Handle manage communities
  const handleManageCommunities = useCallback((program: Program) => {
    setSelectedProgram(program)
    setAssignmentPanelOpen(true)
  }, [])
  
  // Handle close assignment panel
  const handleCloseAssignmentPanel = useCallback(() => {
    setAssignmentPanelOpen(false)
    setSelectedProgram(null)
    // Refresh programs to show updated assignments
    loadPrograms()
  }, [])
  

  
  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Published
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Draft
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }, [])
  
  // Handle filter change
  const handleFilterChange = useCallback((key: keyof RepositoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Calendar className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Programs</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadPrograms()
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
            <p className="mt-2 text-gray-600">Manage training programs and community assignments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/program-builder')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Create Program
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search programs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleFilterChange('viewMode', 'cards')}
                className={`p-2 rounded-md transition-colors ${
                  filters.viewMode === 'cards' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Card View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFilterChange('viewMode', 'list')}
                className={`p-2 rounded-md transition-colors ${
                  filters.viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Selection Info and Bulk Actions */}
          {selectedPrograms.size > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedPrograms.size} of {filteredPrograms.length} program{selectedPrograms.size > 1 ? 's' : ''} selected
              </span>
              {!allVisibleSelected && filteredPrograms.length > selectedPrograms.size && (
                <button
                  onClick={selectAllVisible}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Select All
                </button>
              )}
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-1.5" />
                    Delete Selected
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Programs Grid/List */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-3">Loading programs...</p>
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No programs found</h3>
            <p className="text-sm text-gray-500 mt-2">
              {filters.search || filters.status !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first program.'}
            </p>
            {!filters.search && filters.status === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/program-builder')}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Create First Program
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={filters.viewMode === 'cards' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-3'
          }>
            {filteredPrograms.map((program) => {
              const isSelected = selectedPrograms.has(program.id)
              const isHovered = hoveredProgram === program.id
              const showCheckbox = isSelected || isHovered || isSelectionMode
              
              return (
                <div
                  key={program.id}
                  onClick={(e) => handleProgramClick(program, e)}
                  onMouseEnter={() => setHoveredProgram(program.id)}
                  onMouseLeave={() => setHoveredProgram(null)}
                  className={`group cursor-pointer transition-all duration-200 ${
                    filters.viewMode === 'cards'
                      ? `bg-white rounded-lg shadow-sm border-2 hover:shadow-md ${
                          isSelected 
                            ? 'border-green-500 ring-2 ring-green-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`
                      : `flex items-center space-x-4 p-4 bg-white rounded-lg border-2 hover:bg-gray-50 ${
                          isSelected 
                            ? 'border-green-500 ring-2 ring-green-200' 
                            : 'border-gray-200'
                        }`
                  }`}
                >
                  {filters.viewMode === 'cards' ? (
                    <>
                      {/* Card Header with Thumbnail */}
                      <div className="relative aspect-video bg-gray-200 overflow-hidden rounded-t-lg">
                        {program.thumbnail_url ? (
                          <img
                            src={program.thumbnail_url}
                            alt={program.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-white" />
                          </div>
                        )}
                        
                        {/* Canva-style Checkbox - Top Left */}
                        <div className={`checkbox-area absolute top-2 left-2 transition-opacity duration-200 ${
                          showCheckbox ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProgramSelect(program.id)
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'bg-white border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Gear Icon - Top Right (only when no selection) */}
                        {!isSelectionMode && (
                          <div className={`absolute top-2 right-2 transition-opacity duration-200 ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleManageCommunities(program)
                              }}
                              className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                              title="Manage Communities"
                            >
                              <Settings className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-green-600 transition-colors flex-1">
                            {program.title}
                          </h3>
                        </div>
                        
                        {/* Status Badge in Body */}
                        <div className="mb-2">
                          {getStatusBadge(program.status)}
                        </div>
                        
                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                          {program.description || 'No description available'}
                        </p>
                        
                        {/* Community Assignments Count */}
                        {program.communities && program.communities.length > 0 && (
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <div className="flex -space-x-1 mr-2">
                              {program.communities.slice(0, 3).map((community, idx) => (
                                <div
                                  key={community.community_id}
                                  className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-white text-[8px] font-medium"
                                  style={{ backgroundColor: community.brand_color }}
                                  title={community.community_name}
                                >
                                  {community.community_name.charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {program.communities.length > 3 && (
                                <div className="w-4 h-4 rounded-full border border-white bg-gray-400 flex items-center justify-center text-white text-[8px] font-medium">
                                  +{program.communities.length - 3}
                                </div>
                              )}
                            </div>
                            <span>{program.communities.length} communit{program.communities.length === 1 ? 'y' : 'ies'}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Updated {formatDate(program.updated_at)}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* List View */
                    <>
                      {/* List Item Checkbox */}
                      <div className={`checkbox-area transition-opacity duration-200 ${
                        showCheckbox ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProgramSelect(program.id)
                          }}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-white border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Thumbnail */}
                      <div className="w-16 h-10 bg-gray-200 rounded flex-shrink-0">
                        {program.thumbnail_url ? (
                          <img
                            src={program.thumbnail_url}
                            alt={program.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                            {program.title}
                          </h3>
                          <div className="flex items-center space-x-2 ml-4">
                            {getStatusBadge(program.status)}
                            {program.communities && program.communities.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {program.communities.length} communit{program.communities.length === 1 ? 'y' : 'ies'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {program.description || 'No description available'}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          Updated {formatDate(program.updated_at)}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleManageCommunities(program)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Manage Communities"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Program Community Assignment Panel */}
      <ProgramCommunityAssignmentPanel
        program={selectedProgram}
        isOpen={assignmentPanelOpen}
        onClose={handleCloseAssignmentPanel}
      />
    </div>
  )
}