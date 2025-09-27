import React, { useState, useEffect } from 'react'
import { ModernLayout } from '@/components/layout/ModernLayout'
import { Link } from 'react-router-dom'
import {
  supabase,
  createClientFromTemplate,
  ApiKey,
  PLATFORM_FEATURES
} from '@/lib/supabase'
import { Community } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Plus,
  Settings,
  Users,
  Archive,
  Eye,
  Calendar,
  Building,
  Palette,
  Key,
  Copy,
  CheckCircle
} from 'lucide-react'
import CommunityModal from '@/components/modals/CommunityModal'

interface ExtendedCommunity extends Community {
  active_users?: number
}

export function EnhancedCommunitiesPage() {
  const [communities, setCommunities] = useState<ExtendedCommunity[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'active_users'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchData()
  }, [showArchived])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch communities
      const communityQuery = supabase
        .from('communities')
        .select('*')
        .order('name')
      
      if (!showArchived) {
        communityQuery.eq('status', 'active')
      }
      
      const { data: communitiesData, error: communitiesError } = await communityQuery
      if (communitiesError) throw communitiesError
      
      // Fetch user counts for each community
      const communitiesWithCounts = await Promise.all(
        (communitiesData || []).map(async (community) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('community_id', community.id)
          
          return {
            ...community,
            active_users: count || 0
          }
        })
      )
      
      setCommunities(communitiesWithCounts)
      
      // Fetch API keys
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('name')
      
      if (keysError) throw keysError
      setApiKeys(keysData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveCommunity = async (communityId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('communities')
        .update({ status: archive ? 'archived' : 'active' })
        .eq('id', communityId)
      
      if (error) throw error
      
      await fetchData()
    } catch (error) {
      console.error('Error updating community status:', error)
      alert('Failed to update community status. Please try again.')
    }
  }

  const getSortedCommunities = () => {
    return [...communities].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'active_users':
          aValue = a.active_users || 0
          bValue = b.active_users || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getApiKeyName = (apiKeyId?: string) => {
    if (!apiKeyId) return 'None'
    return apiKeys.find(key => key.id === apiKeyId)?.name || 'Unknown'
  }

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your community ecosystem, configurations, and user access
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Archived Communities</span>
            </label>
            
            <button
              onClick={() => {
                setEditingCommunity(null)
                setModalOpen(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Community
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Community Name</span>
                    {sortBy === 'name' && (
                      <span className="text-blue-500">↑↓</span>
                    )}
                  </button>
                </div>
                <div className="col-span-2">Project Name</div>
                <div className="col-span-1">
                  <button
                    onClick={() => handleSort('active_users')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Users</span>
                    {sortBy === 'active_users' && (
                      <span className="text-blue-500">↑↓</span>
                    )}
                  </button>
                </div>
                <div className="col-span-2">API Key</div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Created Date</span>
                    {sortBy === 'created_at' && (
                      <span className="text-blue-500">↑↓</span>
                    )}
                  </button>
                </div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {getSortedCommunities().map((community) => (
                <div key={community.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Community Name with Logo */}
                    <div className="col-span-3 flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {community.logo_url ? (
                          <img
                            src={community.logo_url}
                            alt={community.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                            style={{ backgroundColor: community.brand_color }}
                          >
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{community.name}</p>
                        {community.template_source_id && (
                          <p className="text-xs text-blue-600 flex items-center mt-1">
                            <Copy className="h-3 w-3 mr-1" />
                            From Template
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Project Name */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-900">{community.project_name}</p>
                    </div>

                    {/* Active Users */}
                    <div className="col-span-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Users className="h-3 w-3 mr-1" />
                        {community.active_users}
                      </span>
                    </div>

                    {/* API Key */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <Key className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">
                          {getApiKeyName(community.api_key_id)}
                        </span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(community.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        community.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {community.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {community.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/communities/${community.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Manage Community"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleArchiveCommunity(community.id, community.status === 'active')}
                          className={`${
                            community.status === 'active' 
                              ? 'text-orange-600 hover:text-orange-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={community.status === 'active' ? 'Archive Community' : 'Restore Community'}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {getSortedCommunities().length === 0 && (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {showArchived ? 'No archived communities' : 'No communities yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {showArchived 
                    ? 'Archived communities will appear here when you archive them.'
                    : 'Create your first community to get started with the platform.'}
                </p>
                {!showArchived && (
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setEditingCommunity(null)
                        setModalOpen(true)
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Community
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Community Modal */}
        <CommunityModal
          isOpen={modalOpen}
          editingCommunity={editingCommunity}
          onClose={() => {
            setModalOpen(false)
            setEditingCommunity(null)
          }}
          onCommunityCreated={() => {
            setModalOpen(false)
            setEditingCommunity(null)
            fetchData()
          }}
        />
      </div>
    </ModernLayout>
  )
}