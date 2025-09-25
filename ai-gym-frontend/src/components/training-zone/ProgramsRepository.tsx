import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Target, Dumbbell, Star, StarOff, FolderPlus, Home, ChevronRight } from 'lucide-react'
import { ItemContextMenu } from './components/ItemContextMenu'
import { BulkActionBar } from './components/BulkActionBar'
import { FolderCreateModal } from './components/FolderCreateModal'
import { supabase } from '../../../lib/supabase'

interface Program {
  id: string
  title: string
  description: string
  thumbnail_url: string
  status: 'draft' | 'published' | 'archived'
  estimated_duration_weeks: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
  folder_id: string | null
  is_favorite: boolean
  program_type: 'strength' | 'cardio' | 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility'
  weeks_count: number
}

interface Folder {
  id: string
  name: string
  parent_folder_id: string | null
  repository_type: 'wods' | 'blocks' | 'programs'
  created_at: string
  updated_at: string
}

interface Community {
  id: string
  name: string
  brand_color: string
}

interface RepositoryFilters {
  search: string
  communities: string[]
  status: 'all' | 'draft' | 'published' | 'archived'
  difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced'
  programType: 'all' | 'strength' | 'cardio' | 'weight-loss' | 'muscle-gain' | 'endurance' | 'flexibility'
  sortBy: 'created_at' | 'updated_at' | 'title'
  sortOrder: 'asc' | 'desc'
  viewMode: 'cards' | 'list'
  showFavorites: boolean
  folderId: string | null
}

// Mock data for demonstration
const mockPrograms: Program[] = [
  {
    id: '1',
    title: 'Beginner Fitness Foundation',
    description: 'A comprehensive 8-week program designed for fitness beginners to build strength, endurance, and healthy habits.',
    thumbnail_url: '',
    status: 'published',
    estimated_duration_weeks: 8,
    difficulty_level: 'beginner',
    tags: ['foundation', 'beginner', 'full-body'],
    created_by: 'admin',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    folder_id: null,
    is_favorite: false,
    program_type: 'strength',
    weeks_count: 8
  },
  {
    id: '2',
    title: 'Advanced Strength Building',
    description: 'Intensive 12-week program focused on progressive strength training and muscle development.',
    thumbnail_url: '',
    status: 'published',
    estimated_duration_weeks: 12,
    difficulty_level: 'advanced',
    tags: ['strength', 'muscle-gain', 'progressive'],
    created_by: 'admin',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
    folder_id: null,
    is_favorite: true,
    program_type: 'muscle-gain',
    weeks_count: 12
  },
  {
    id: '3',
    title: 'Cardio Blast Program',
    description: 'High-intensity 6-week cardiovascular program to improve endurance and burn calories.',
    thumbnail_url: '',
    status: 'draft',
    estimated_duration_weeks: 6,
    difficulty_level: 'intermediate',
    tags: ['cardio', 'hiit', 'endurance'],
    created_by: 'admin',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-22T00:00:00Z',
    folder_id: null,
    is_favorite: false,
    program_type: 'cardio',
    weeks_count: 6
  }
]

const mockCommunities: Community[] = [
  { id: '1', name: 'Fitness Beginners', brand_color: '#10B981' },
  { id: '2', name: 'Strength Athletes', brand_color: '#F59E0B' },
  { id: '3', name: 'Cardio Enthusiasts', brand_color: '#EF4444' }
]

export function ProgramsRepository() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignmentCounts, setAssignmentCounts] = useState<{[key: string]: number}>({})
  const mountedRef = useRef(true)
  
  // Selection and bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  // Folder creation modal state
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderCreating, setFolderCreating] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<RepositoryFilters>({
    search: '',
    communities: [],
    status: 'all',
    difficulty: 'all',
    programType: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    viewMode: 'cards',
    showFavorites: false,
    folderId: null
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load real data from API
  useEffect(() => {
    loadPrograms()
    setCommunities(mockCommunities) // TODO: Load from communities API when available
  }, [])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User not authenticated')
      }
      
      // Load from programs API
      const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
      const apiUrl = `${supabaseUrl}/functions/v1/programs-api`
      
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
        throw new Error(errorData.error?.message || `Failed to load programs: ${response.status}`)
      }
      
      const data = await response.json()
      const apiPrograms = data.data || []
      
      // Transform API data to frontend format
      const transformedPrograms: Program[] = apiPrograms.map((program: any) => ({
        id: program.id,
        title: program.title,
        description: program.description || '',
        thumbnail_url: program.thumbnail_url || '',
        status: program.status,
        estimated_duration_weeks: program.estimated_duration_weeks,
        difficulty_level: program.difficulty_level,
        tags: program.tags || [],
        created_by: program.created_by,
        created_at: program.created_at,
        updated_at: program.updated_at,
        folder_id: null, // TODO: Implement folder support
        is_favorite: false, // TODO: Implement favorites
        program_type: program.program_type,
        weeks_count: program.estimated_duration_weeks
      }))
      
      setPrograms(transformedPrograms)
      
    } catch (err) {
      console.error('Error loading programs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load programs')
      // Fall back to mock data on error
      setPrograms(mockPrograms)
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCreateNew = useCallback(() => {
    navigate('/program-builder')
  }, [navigate])

  const handleProgramClick = useCallback((programId: string) => {
    navigate(`/program-builder?id=${programId}`)
  }, [navigate])

  const handleFilterChange = useCallback((key: keyof RepositoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters(prev => ({
      search: '',
      communities: [],
      status: 'all',
      difficulty: 'all',
      programType: 'all',
      sortBy: 'updated_at',
      sortOrder: 'desc',
      viewMode: prev.viewMode, // Preserve view mode
      showFavorites: false,
      folderId: null
    }))
  }, [])

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      'published': { color: 'bg-green-100 text-green-800', icon: Eye, label: 'Published' },
      'draft': { color: 'bg-yellow-100 text-yellow-800', icon: EyeOff, label: 'Draft' },
      'archived': { color: 'bg-gray-100 text-gray-800', icon: EyeOff, label: 'Archived' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }, [])

  const getDifficultyBadge = useCallback((difficulty: string) => {
    const difficultyConfig = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        difficultyConfig[difficulty as keyof typeof difficultyConfig] || 'bg-gray-100 text-gray-800'
      }`}>
        {difficulty}
      </span>
    )
  }, [])

  const getProgramTypeBadge = useCallback((programType: string) => {
    const typeConfig = {
      'strength': 'bg-blue-100 text-blue-800',
      'cardio': 'bg-red-100 text-red-800',
      'weight-loss': 'bg-orange-100 text-orange-800',
      'muscle-gain': 'bg-purple-100 text-purple-800',
      'endurance': 'bg-green-100 text-green-800',
      'flexibility': 'bg-pink-100 text-pink-800'
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        typeConfig[programType as keyof typeof typeConfig] || 'bg-gray-100 text-gray-800'
      }`}>
        {programType.replace('-', ' ')}
      </span>
    )
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const formatDuration = useCallback((weeks: number) => {
    if (weeks === 1) {
      return '1 week'
    }
    return `${weeks} weeks`
  }, [])

  // Apply filters to programs
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

    // Favorites filter
    if (filters.showFavorites) {
      filtered = filtered.filter(program => program.is_favorite)
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

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Calendar className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading PROGRAMS</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadPrograms()
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex bg-gray-50">
      {/* Filter Sidebar */}
      <div className={`transition-all duration-300 ${
        showFilters ? 'w-80' : 'w-12'
      } bg-white border-r border-gray-200 flex flex-col shadow-sm`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="h-5 w-5" />
            {showFilters && <span className="ml-2 text-sm font-medium">Filters</span>}
          </button>
        </div>

        {showFilters && (
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Programs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
                <option value="archived">Archived Only</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Program Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Type
              </label>
              <select
                value={filters.programType}
                onChange={(e) => handleFilterChange('programType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>

            {/* Community Filter */}
            {communities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Communities
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {communities.map((community) => (
                    <label key={community.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.communities.includes(community.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('communities', [...filters.communities, community.id])
                          } else {
                            handleFilterChange('communities', filters.communities.filter(id => id !== community.id))
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: community.brand_color }}
                        />
                        <span className="text-sm text-gray-900">{community.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites Toggle */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showFavorites}
                  onChange={(e) => handleFilterChange('showFavorites', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Favorites Only</span>
              </label>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Programs
              </label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_')
                  handleFilterChange('sortBy', sortBy)
                  handleFilterChange('sortOrder', sortOrder)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="updated_at_desc">Last Updated (Newest)</option>
                <option value="updated_at_asc">Last Updated (Oldest)</option>
                <option value="created_at_desc">Date Created (Newest)</option>
                <option value="created_at_asc">Date Created (Oldest)</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PROGRAMS (Structured Training Programs)</h1>
                <p className="text-sm text-gray-600 mt-1">Create and manage comprehensive fitness programs that combine WODs and BLOCKS</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {filteredPrograms.length} {filteredPrograms.length === 1 ? 'PROGRAM' : 'PROGRAMS'}
                  </span>
                  {filters.status !== 'all' && (
                    <span className="text-xs text-gray-500">• Filtered by {filters.status}</span>
                  )}
                  {filters.difficulty !== 'all' && (
                    <span className="text-xs text-gray-500">• {filters.difficulty} level</span>
                  )}
                  {filters.communities.length > 0 && (
                    <span className="text-xs text-gray-500">• {filters.communities.length} community(s)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Create PROGRAM
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-gray-500 mt-3">Loading Programs...</p>
              </div>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-purple-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Programs found</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                {filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.communities.length > 0
                  ? 'Try adjusting your filters to find more results.'
                  : 'Get started by creating your first training program.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Create PROGRAM
                </button>
              </div>
            </div>
          ) : (
            <div className={filters.viewMode === 'cards' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  onClick={() => handleProgramClick(program.id)}
                  className={`cursor-pointer group transition-all ${
                    filters.viewMode === 'cards'
                      ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
                      : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'
                  }`}
                >
                  {filters.viewMode === 'cards' ? (
                    <>
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {program.thumbnail_url ? (
                          <img
                            src={program.thumbnail_url}
                            alt={program.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {getStatusBadge(program.status)}
                        </div>
                        {program.is_favorite && (
                          <div className="absolute top-2 left-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {program.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {program.description || 'No description provided'}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {program.difficulty_level && getDifficultyBadge(program.difficulty_level)}
                            {program.program_type && getProgramTypeBadge(program.program_type)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDuration(program.estimated_duration_weeks)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {program.weeks_count} weeks
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {program.thumbnail_url ? (
                          <img
                            src={program.thumbnail_url}
                            alt={program.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Calendar className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 truncate">{program.title}</h3>
                          {program.is_favorite && (
                            <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {program.description || 'No description provided'}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          {getStatusBadge(program.status)}
                          {program.difficulty_level && getDifficultyBadge(program.difficulty_level)}
                          {program.program_type && getProgramTypeBadge(program.program_type)}
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDuration(program.estimated_duration_weeks)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Updated {formatDate(program.updated_at)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgramsRepository