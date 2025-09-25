import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, ContentItem, ContentType, Community } from '../../lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Search, Filter, Grid, List, Plus, ChevronDown, Eye, EyeOff, Calendar, Tag as TagIcon, Users as UsersIcon } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'

interface RepositoryFilters {
  search: string
  communities: string[]
  status: 'all' | 'draft' | 'published'
  sortBy: 'created_at' | 'updated_at' | 'title'
  sortOrder: 'asc' | 'desc'
  viewMode: 'cards' | 'list'
}

interface ContentRepositoryProps {
  contentType: ContentType
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
}

export function ContentRepository({ contentType, title, description, icon: Icon, color }: ContentRepositoryProps) {
  const navigate = useNavigate()
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemCounts, setItemCounts] = useState<{[key: string]: number}>({})
  const mountedRef = useRef(true)
  const lastFetchRef = useRef<string>('')
  
  const [filters, setFilters] = useState<RepositoryFilters>({
    search: '',
    communities: [],
    status: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    viewMode: 'cards'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Memoized filter key to prevent unnecessary re-renders
  const filterKey = useMemo(() => {
    return JSON.stringify({
      contentType,
      search: filters.search,
      communities: filters.communities.sort(),
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })
  }, [contentType, filters.search, filters.communities, filters.status, filters.sortBy, filters.sortOrder])

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

      // Build query with filters
      let query = supabase
        .from('content_items')
        .select('*')
        .eq('content_type', contentType)

      // Apply search filter
      if (filters.search.trim()) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

      const { data: items, error: itemsError } = await query
      
      if (!mountedRef.current) return
      
      if (itemsError) {
        console.error('Error fetching content items:', itemsError)
        setError('Failed to load content items')
        setContentItems([])
        return
      }

      let filteredItems = items || []

      // Filter by client assignments if specified
      if (filters.communities.length > 0) {
        const { data: assignments, error: assignError } = await supabase
          .from('content_community_assignments')
          .select('content_item_id')
          .in('community_id', filters.communities)
        
        if (assignError) {
          console.error('Error fetching assignments:', assignError)
        } else if (assignments) {
          const assignedItemIds = assignments.map(a => a.content_item_id)
          filteredItems = filteredItems.filter(item => assignedItemIds.includes(item.id))
        }
      }

      if (!mountedRef.current) return
      setContentItems(filteredItems)

      // Fetch assignment counts for each item
      if (filteredItems.length > 0) {
        const itemIds = filteredItems.map(item => item.id)
        const [communityAssignments, userAssignments] = await Promise.all([
          supabase.from('content_community_assignments').select('content_item_id').in('content_item_id', itemIds),
          supabase.from('content_user_assignments').select('content_item_id').in('content_item_id', itemIds)
        ])

        const counts: {[key: string]: number} = {}
        itemIds.forEach(id => {
          const communityCount = communityAssignments.data?.filter(a => a.content_item_id === id).length || 0
          const userCount = userAssignments.data?.filter(a => a.content_item_id === id).length || 0
          counts[id] = communityCount + userCount
        })
        
        if (mountedRef.current) {
          setItemCounts(counts)
        }
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
      if (mountedRef.current) {
        setError('Failed to load content')
        setContentItems([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [contentType, filterKey, filters.search, filters.communities, filters.status, filters.sortBy, filters.sortOrder])

  // Fetch communities once on mount
  const fetchCommunities = useCallback(async () => {
    try {
      const { data: communitiesData, error: communityError } = await supabase
        .from('clients')
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

  const getRoutePrefix = useCallback(() => {
    const routeMap: Record<ContentType, string> = {
      'ai_agent': 'ai-agents',
      'video': 'videos', 
      'document': 'documents',
      'image': 'images',
      'pdf': 'pdfs',
      'prompt': 'prompts',
      'automation': 'automations'
    }
    return routeMap[contentType] || contentType
  }, [contentType])

  const handleCreateNew = useCallback(() => {
    const routePrefix = getRoutePrefix()
    navigate(`/content/${routePrefix}/create`)
  }, [navigate, getRoutePrefix])

  const handleItemClick = useCallback((itemId: string) => {
    const routePrefix = getRoutePrefix()
    navigate(`/content/${routePrefix}/${itemId}/edit`)
  }, [navigate, getRoutePrefix])

  const handleFilterChange = useCallback((key: keyof RepositoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters(prev => ({
      search: '',
      communities: [],
      status: 'all',
      sortBy: 'updated_at',
      sortOrder: 'desc',
      viewMode: prev.viewMode // Preserve view mode
    }))
  }, [])

  const getStatusBadge = useCallback((status: string) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        status === 'published' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {status === 'published' ? (
          <><Eye className="h-3 w-3 mr-1" /> Published</>
        ) : (
          <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
        )}
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

  // Error state
  if (error && !loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Icon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Content</h3>
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
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen flex bg-gray-50">
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
                  Search Content
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
                  Sort Content
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
                <div 
                  className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      {contentItems.length} {contentItems.length === 1 ? 'item' : 'items'}
                    </span>
                    {filters.status !== 'all' && (
                      <span className="text-xs text-gray-500">• Filtered by {filters.status}</span>
                    )}
                    {filters.communities.length > 0 && (
                      <span className="text-xs text-gray-500">• {filters.communities.length} client(s)</span>
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
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                  style={{ backgroundColor: color, boxShadow: `0 4px 12px ${color}40` }}
                >
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Create New
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
                  <p className="text-sm text-gray-500 mt-3">Loading {title.toLowerCase()}...</p>
                </div>
              </div>
            ) : (
              <>
                {contentItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div 
                      className="mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: color + '10' }}
                    >
                      <Icon className="h-12 w-12" style={{ color }} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No {title.toLowerCase()} yet</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                      {filters.search || filters.status !== 'all' || filters.communities.length > 0
                        ? `No ${title.toLowerCase()} match your current filters. Try adjusting your search criteria.`
                        : `Get started by creating your first ${contentType.replace('_', ' ')}.`
                      }
                    </p>
                    <div className="mt-8">
                      {filters.search || filters.status !== 'all' || filters.communities.length > 0 ? (
                        <button
                          onClick={clearAllFilters}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateNew}
                          className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{ backgroundColor: color }}
                        >
                          <Plus className="-ml-1 mr-2 h-5 w-5" />
                          Create {contentType.replace('_', ' ')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={filters.viewMode === 'cards' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                    : 'space-y-3'
                  }>
                    {contentItems.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleItemClick(item.id)} 
                        className={`${filters.viewMode === 'cards' 
                          ? 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer transition-all hover:scale-105'
                          : 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all'
                        }`}
                      >
                        {filters.viewMode === 'cards' ? (
                          <>
                            {/* Card Header */}
                            <div 
                              className="h-32 bg-gradient-to-br from-opacity-10 to-opacity-20 flex items-center justify-center relative"
                              style={{ 
                                backgroundColor: color + '08',
                                backgroundImage: `linear-gradient(135deg, ${color}15, ${color}05)`
                              }}
                            >
                              <Icon className="h-8 w-8" style={{ color }} />
                              {item.thumbnail_url && (
                                <img 
                                  src={item.thumbnail_url} 
                                  alt={item.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                            </div>
                            {/* Card Content */}
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-5">
                                  {item.title}
                                </h3>
                                {getStatusBadge(item.status)}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-4">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(item.updated_at)}</span>
                                </div>
                                {itemCounts[item.id] > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <UsersIcon className="h-3 w-3" />
                                    <span>{itemCounts[item.id]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          /* List View */
                          <div className="flex items-center space-x-4">
                            <div 
                              className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: color + '15' }}
                            >
                              <Icon className="h-6 w-6" style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                  {item.title}
                                </h3>
                                {getStatusBadge(item.status)}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-600 truncate mt-1">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Updated {formatDate(item.updated_at)}</span>
                                  </div>
                                  {itemCounts[item.id] > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <UsersIcon className="h-3 w-3" />
                                      <span>{itemCounts[item.id]} assignment{itemCounts[item.id] !== 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ContentRepository
