import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Package } from 'lucide-react'

interface WorkoutBlock {
  id: string
  title: string
  description: string
  thumbnail_url: string
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  block_category: 'warm-up' | 'cardio' | 'strength' | 'flexibility' | 'cool-down' | 'general'
  equipment_needed: string[]
  instructions: string
  created_by: string
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
  sortBy: 'created_at' | 'updated_at' | 'title'
  sortOrder: 'asc' | 'desc'
  viewMode: 'cards' | 'list'
}

export function BlocksRepository() {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentCounts, setAssignmentCounts] = useState<{[key: string]: number}>({})
  const mountedRef = useRef(true)
  const lastFetchRef = useRef<string>('')
  
  const [filters, setFilters] = useState<RepositoryFilters>({
    search: '',
    communities: [],
    status: 'all',
    difficulty: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    viewMode: 'cards'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Memoized filter key to prevent unnecessary re-renders
  const filterKey = useMemo(() => {
    return JSON.stringify({
      search: filters.search,
      communities: filters.communities.sort(),
      status: filters.status,
      difficulty: filters.difficulty,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })
  }, [filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder])

  // Stable fetch function
  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return
    
    const currentFilterKey = filterKey
    
    // Prevent duplicate requests
    if (lastFetchRef.current === currentFilterKey) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      lastFetchRef.current = currentFilterKey

      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.search.trim()) {
        params.append('search', filters.search)
      }
      if (filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.difficulty !== 'all') {
        params.append('difficulty', filters.difficulty)
      }

      const queryString = params.toString()
      const url = queryString ? `workout-blocks-api?${queryString}` : 'workout-blocks-api'

      const { data, error } = await supabase.functions.invoke(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!mountedRef.current) return
      
      if (error) {
        console.error('Error fetching workout blocks:', error)
        setError('Failed to load BLOCKS')
        setBlocks([])
        return
      }

      let filteredBlocks = data?.data || []

      // Filter by community assignments if specified
      if (filters.communities.length > 0) {
        const { data: assignments, error: assignError } = await supabase
          .from('workout_block_community_assignments')
          .select('workout_block_id')
          .in('community_id', filters.communities)
        
        if (assignError) {
          console.error('Error fetching assignments:', assignError)
        } else if (assignments) {
          const assignedBlockIds = assignments.map(a => a.workout_block_id)
          filteredBlocks = filteredBlocks.filter((block: WorkoutBlock) => assignedBlockIds.includes(block.id))
        }
      }

      // Apply client-side sorting
      filteredBlocks.sort((a: WorkoutBlock, b: WorkoutBlock) => {
        const aValue = a[filters.sortBy as keyof WorkoutBlock] as string
        const bValue = b[filters.sortBy as keyof WorkoutBlock] as string
        
        if (filters.sortOrder === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })

      if (!mountedRef.current) return
      setBlocks(filteredBlocks)

      // Fetch assignment counts for each block
      if (filteredBlocks.length > 0) {
        const blockIds = filteredBlocks.map((block: WorkoutBlock) => block.id)
        const communityAssignments = await supabase
          .from('workout_block_community_assignments')
          .select('workout_block_id')
          .in('workout_block_id', blockIds)

        const counts: {[key: string]: number} = {}
        blockIds.forEach(id => {
          const communityCount = communityAssignments.data?.filter(a => a.workout_block_id === id).length || 0
          counts[id] = communityCount
        })
        
        if (mountedRef.current) {
          setAssignmentCounts(counts)
        }
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
      if (mountedRef.current) {
        setError('Failed to load BLOCKS')
        setBlocks([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [filterKey, filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder])

  // Fetch communities once on mount
  const fetchCommunities = useCallback(async () => {
    try {
      const { data: communitiesData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('status', 'active')
        .order('name')
      
      if (communityError) {
        console.error('Error fetching communities:', communityError)
      } else if (communitiesData && mountedRef.current) {
        setCommunities(communitiesData)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }, [])

  // Initial data fetch on mount and filter changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch communities on mount
  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCreateNew = useCallback(() => {
    navigate('/page-builder?repo=blocks')
  }, [navigate])

  const handleBlockClick = useCallback((blockId: string) => {
    navigate(`/page-builder?repo=blocks&id=${blockId}`)
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
      sortBy: 'updated_at',
      sortOrder: 'desc',
      viewMode: prev.viewMode // Preserve view mode
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

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }, [])

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading BLOCKS</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              fetchData()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                Search BLOCKS
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort BLOCKS
              </label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_')
                  handleFilterChange('sortBy', sortBy)
                  handleFilterChange('sortOrder', sortOrder)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BLOCKS (Modular Workout Components)</h1>
                <p className="text-sm text-gray-600 mt-1">Create and manage reusable workout building blocks</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {blocks.length} {blocks.length === 1 ? 'BLOCK' : 'BLOCKS'}
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
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Create BLOCK
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
                <p className="text-sm text-gray-500 mt-3">Loading BLOCKS...</p>
              </div>
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-blue-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4">
                <Package className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No BLOCKS found</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                {filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.communities.length > 0
                  ? 'Try adjusting your filters to find more results.'
                  : 'BLOCKS are modular workout components that can be reused across different programs. Get started by creating your first BLOCK.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Create BLOCK
                </button>
              </div>
            </div>
          ) : (
            <div className={filters.viewMode === 'cards' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {blocks.map((block) => (
                <div
                  key={block.id}
                  onClick={() => handleBlockClick(block.id)}
                  className={`cursor-pointer group transition-all ${
                    filters.viewMode === 'cards'
                      ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
                      : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'
                  }`}
                >
                  {filters.viewMode === 'cards' ? (
                    <>
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {block.thumbnail_url ? (
                          <img
                            src={block.thumbnail_url}
                            alt={block.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <Package className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {getStatusBadge(block.status)}
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {block.block_category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {block.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {block.description || 'No description provided'}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {block.difficulty_level && getDifficultyBadge(block.difficulty_level)}
                            {block.estimated_duration_minutes && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDuration(block.estimated_duration_minutes)}
                              </span>
                            )}
                          </div>
                        </div>
                        {block.equipment_needed && block.equipment_needed.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {block.equipment_needed.slice(0, 2).map((equipment, index) => (
                              <span key={index} className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {equipment}
                              </span>
                            ))}
                            {block.equipment_needed.length > 2 && (
                              <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                +{block.equipment_needed.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {block.thumbnail_url ? (
                          <img
                            src={block.thumbnail_url}
                            alt={block.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{block.title}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {block.description || 'No description provided'}
                        </p>
                        <div className="flex items-center space-x-3 mt-2">
                          {getStatusBadge(block.status)}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {block.block_category}
                          </span>
                          {block.difficulty_level && getDifficultyBadge(block.difficulty_level)}
                          {block.estimated_duration_minutes && (
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDuration(block.estimated_duration_minutes)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            Updated {formatDate(block.updated_at)}
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

export default BlocksRepository