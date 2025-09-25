import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Search, Filter, Grid, List, Plus, Eye, EyeOff, Calendar, Package, Star, StarOff, FolderPlus, Home, ChevronRight, Folder, CheckSquare, Square } from 'lucide-react'
import { ItemContextMenu } from './components/ItemContextMenu'
import { BulkActionBar } from './components/BulkActionBar'
import { FolderCreateModal } from './components/FolderCreateModal'
import { MoveToFolderModal } from './components/MoveToFolderModal'

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
  folder_id: string | null
  is_favorite: boolean
}

interface FolderItem {
  id: string
  name: string
  parent_folder_id: string | null
  repository_type: 'wods' | 'blocks'
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
  showFavorites: boolean
  folderId: string | null
}

export function BlocksRepository() {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentCounts, setAssignmentCounts] = useState<{[key: string]: number}>({})
  const mountedRef = useRef(true)
  const lastFetchRef = useRef<string>('')
  
  // Selection and bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  
  // Folder creation modal state
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderCreating, setFolderCreating] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)
  
  // Move to folder modal state
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveItem, setMoveItem] = useState<{ id: string; name: string } | null>(null)
  const [itemMoving, setItemMoving] = useState(false)
  
  const [filters, setFilters] = useState<RepositoryFilters>({
    search: '',
    communities: [],
    status: 'all',
    difficulty: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    viewMode: 'cards',
    showFavorites: false,
    folderId: null
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
      sortOrder: filters.sortOrder,
      showFavorites: filters.showFavorites,
      folderId: filters.folderId
    })
  }, [filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder, filters.showFavorites, filters.folderId])

  // API functions for folder and content management
  const fetchFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('folders-api', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (error) {
        console.error('Error fetching folders:', error)
        return []
      }
      
      // Filter folders by repository type on client side since API returns all
      const allFolders = data?.data || []
      return allFolders.filter(folder => folder.repository_type === 'blocks')
    } catch (error) {
      console.error('Error fetching folders:', error)
      return []
    }
  }, [])

  const createFolder = useCallback(async (name: string, parentFolderId: string | null) => {
    const { data, error } = await supabase.functions.invoke('folders-api', {
      method: 'POST',
      body: {
        name,
        parent_folder_id: parentFolderId,
        repository_type: 'blocks'
      }
    })
    
    if (error) {
      throw new Error(error.message || 'Failed to create folder')
    }
    
    return data?.data
  }, [])

  const bulkOperation = useCallback(async (action: string, items: string[], folderId?: string | null) => {
    const { data, error } = await supabase.functions.invoke('content-management-api', {
      method: 'POST',
      body: {
        action,
        items,
        repository_type: 'blocks',
        folder_id: folderId
      }
    })
    
    if (error) {
      throw new Error(error.message || `Failed to ${action} items`)
    }
    
    return data?.data
  }, [])

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
      if (filters.folderId !== null) {
        params.append('folder_id', filters.folderId)
      } else {
        params.append('folder_id', 'null')
      }
      if (filters.showFavorites) {
        params.append('is_favorite', 'true')
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
  }, [filterKey, filters.search, filters.communities, filters.status, filters.difficulty, filters.sortBy, filters.sortOrder, filters.showFavorites, filters.folderId])

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

  // Load folders on mount
  useEffect(() => {
    fetchFolders().then(folderData => {
      if (mountedRef.current) {
        setFolders(folderData.filter(f => f.repository_type === 'blocks'))
      }
    })
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

  // Selection handlers
  const handleSelectItem = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev)
      if (selected) {
        newSelected.add(itemId)
      } else {
        newSelected.delete(itemId)
      }
      return newSelected
    })
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(blocks.map(block => block.id)))
    } else {
      setSelectedItems(new Set())
    }
  }, [blocks])

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set())
    setIsSelectionMode(false)
  }, [])

  // Content management handlers
  const handleToggleFavorite = useCallback(async (blockId: string) => {
    try {
      await bulkOperation('toggle_favorite', [blockId])
      // Refresh data to show updated favorite status
      fetchData()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }, [bulkOperation, fetchData])

  const handleCopyItem = useCallback(async (blockId: string) => {
    try {
      await bulkOperation('copy', [blockId], filters.folderId)
      // Refresh data to show copied item
      fetchData()
    } catch (error) {
      console.error('Error copying item:', error)
    }
  }, [bulkOperation, fetchData, filters.folderId])

  const handleDeleteItem = useCallback(async (blockId: string) => {
    if (confirm('Are you sure you want to delete this BLOCK?')) {
      try {
        await bulkOperation('delete', [blockId])
        // Refresh data to remove deleted item
        fetchData()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }, [bulkOperation, fetchData])

  const handleMoveToFolder = useCallback(async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block) {
      setMoveItem({ id: blockId, name: block.title })
      setShowMoveModal(true)
    }
  }, [blocks])

  const handleSingleItemMove = useCallback(async (folderId: string | null) => {
    if (!moveItem) return
    
    setItemMoving(true)
    try {
      await bulkOperation('move', [moveItem.id], folderId)
      fetchData() // Refresh data to show updated folder
      setShowMoveModal(false)
      setMoveItem(null)
    } catch (error) {
      console.error('Error moving item:', error)
    } finally {
      setItemMoving(false)
    }
  }, [moveItem, bulkOperation, fetchData])

  // Bulk operation handlers
  const handleBulkMove = useCallback(async (folderId: string) => {
    try {
      const targetFolderId = folderId === 'root' ? null : folderId
      await bulkOperation('move', Array.from(selectedItems), targetFolderId)
      handleClearSelection()
      fetchData()
    } catch (error) {
      console.error('Error moving items:', error)
    }
  }, [bulkOperation, selectedItems, handleClearSelection, fetchData])

  const handleBulkCopy = useCallback(async () => {
    try {
      await bulkOperation('copy', Array.from(selectedItems), filters.folderId)
      handleClearSelection()
      fetchData()
    } catch (error) {
      console.error('Error copying items:', error)
    }
  }, [bulkOperation, selectedItems, filters.folderId, handleClearSelection, fetchData])

  const handleBulkDelete = useCallback(async () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      try {
        await bulkOperation('delete', Array.from(selectedItems))
        handleClearSelection()
        fetchData()
      } catch (error) {
        console.error('Error deleting items:', error)
      }
    }
  }, [bulkOperation, selectedItems, handleClearSelection, fetchData])

  // Folder management handlers
  const handleCreateFolder = useCallback(async (name: string, parentFolderId: string | null) => {
    setFolderCreating(true)
    setFolderError(null)
    
    try {
      const newFolder = await createFolder(name, parentFolderId)
      // Refresh folders
      const updatedFolders = await fetchFolders()
      setFolders(updatedFolders.filter(f => f.repository_type === 'blocks'))
      setShowFolderModal(false)
    } catch (error) {
      setFolderError(error.message)
    } finally {
      setFolderCreating(false)
    }
  }, [createFolder, fetchFolders])

  const handleCreateFolderAndMove = useCallback(async () => {
    setShowFolderModal(true)
  }, [])

  const handleNavigateToFolder = useCallback((folderId: string | null) => {
    setFilters(prev => ({ ...prev, folderId }))
    handleClearSelection()
  }, [handleClearSelection])

  // Get current folder and breadcrumb path
  const currentFolder = useMemo(() => {
    return folders.find(f => f.id === filters.folderId) || null
  }, [folders, filters.folderId])

  const breadcrumbPath = useMemo(() => {
    const path: FolderItem[] = []
    let current = currentFolder
    
    while (current) {
      path.unshift(current)
      current = folders.find(f => f.id === current?.parent_folder_id) || null
    }
    
    return path
  }, [currentFolder, folders])

  // Get folders in current directory
  const currentFolders = useMemo(() => {
    return folders.filter(f => f.parent_folder_id === filters.folderId)
  }, [folders, filters.folderId])

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

            {/* Favorites Filter */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showFavorites}
                  onChange={(e) => handleFilterChange('showFavorites', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Star className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-900">Show Favorites Only</span>
              </label>
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
                <h1 className="text-2xl font-bold text-gray-900">BLOCKS (Workout Building Blocks)</h1>
                <p className="text-sm text-gray-600 mt-1">Create and manage reusable workout components and exercises</p>
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
              
              {/* New Folder Button */}
              <button
                onClick={() => setShowFolderModal(true)}
                className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <FolderPlus className="-ml-1 mr-2 h-4 w-4" />
                New Folder
              </button>
              
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Create BLOCK
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {(breadcrumbPath.length > 0 || filters.folderId !== null) && (
            <div className="flex items-center space-x-2 mt-4 text-sm text-gray-600">
              <button
                onClick={() => handleNavigateToFolder(null)}
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                <Home className="h-4 w-4 mr-1" />
                Root
              </button>
              {breadcrumbPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <ChevronRight className="h-4 w-4" />
                  <button
                    onClick={() => handleNavigateToFolder(folder.id)}
                    className={`hover:text-blue-600 transition-colors ${
                      index === breadcrumbPath.length - 1 ? 'font-medium text-gray-900' : ''
                    }`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Selection toolbar */}
          {selectedItems.size > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-800">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleClearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
          )}
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
          ) : (
            <>
              {/* Folders */}
              {currentFolders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Folders</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {currentFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleNavigateToFolder(folder.id)}
                        className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                      >
                        <Folder className="h-12 w-12 text-blue-500 mb-2 group-hover:text-blue-600" />
                        <span className="text-sm text-center text-gray-900 truncate w-full">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCKS */}
              {blocks.length === 0 && currentFolders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-blue-100 mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4">
                    <Package className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No BLOCKS found</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                    {filters.search || filters.status !== 'all' || filters.difficulty !== 'all' || filters.communities.length > 0
                      ? 'Try adjusting your filters to find more results.'
                      : 'Get started by creating your first workout building block.'}
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
                <>
                  {blocks.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">BLOCKS</h3>
                        {blocks.length > 0 && (
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedItems.size === blocks.length && blocks.length > 0}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">Select all</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className={filters.viewMode === 'cards' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                  }>
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className={`relative group transition-all ${
                          filters.viewMode === 'cards'
                            ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
                            : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-3 left-3 z-10">
                          <label className="cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(block.id)}
                              onChange={(e) => handleSelectItem(block.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </label>
                        </div>

                        {/* Favorite Star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(block.id)
                          }}
                          className={`absolute ${
                            filters.viewMode === 'cards' ? 'top-3 right-12' : 'top-3 right-12'
                          } z-10 p-1 rounded-full hover:bg-white hover:bg-opacity-80 transition-all`}
                        >
                          {block.is_favorite ? (
                            <Star className="h-5 w-5 text-blue-500 fill-current" />
                          ) : (
                            <StarOff className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>

                        {/* Context Menu */}
                        <div className={`absolute ${
                          filters.viewMode === 'cards' ? 'top-3 right-3' : 'top-3 right-3'
                        } z-10`}>
                          <ItemContextMenu
                            isFavorited={block.is_favorite}
                            repositoryType="blocks"
                            onCopy={() => handleCopyItem(block.id)}
                            onDelete={() => handleDeleteItem(block.id)}
                            onMoveToFolder={() => handleMoveToFolder(block.id)}
                            onToggleFavorite={() => handleToggleFavorite(block.id)}
                            size="sm"
                          />
                        </div>

                        {/* Content */}
                        <div
                          onClick={() => handleBlockClick(block.id)}
                          className="cursor-pointer flex-1"
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
                                <div className="absolute bottom-2 left-2 flex space-x-1">
                                  {getStatusBadge(block.status)}
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
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedItems.size > 0 && (
        <BulkActionBar
          selectedCount={selectedItems.size}
          folders={folders.filter(f => f.repository_type === 'blocks')}
          repositoryType="blocks"
          onClearSelection={handleClearSelection}
          onDeleteSelected={handleBulkDelete}
          onCopySelected={handleBulkCopy}
          onMoveToFolder={handleBulkMove}
          onCreateFolderAndMove={handleCreateFolderAndMove}
        />
      )}

      {/* Folder Creation Modal */}
      <FolderCreateModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreateFolder={handleCreateFolder}
        folders={folders.filter(f => f.repository_type === 'blocks')}
        repositoryType="blocks"
        isCreating={folderCreating}
        error={folderError}
      />

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false)
          setMoveItem(null)
        }}
        onMoveToFolder={handleSingleItemMove}
        folders={folders.filter(f => f.repository_type === 'blocks')}
        repositoryType="blocks"
        isMoving={itemMoving}
        itemName={moveItem?.name || 'item'}
      />
    </div>
  )
}

export default BlocksRepository