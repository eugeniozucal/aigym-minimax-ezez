import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { supabase, UserTag, Community } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Plus, Tag, Building2, Users, Edit2, Trash2 } from 'lucide-react'
import { TagModal } from '@/components/modals/TagModal'

function Tags() {
  const [tags, setTags] = useState<UserTag[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<UserTag | null>(null)
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [tagsRes, communitiesRes] = await Promise.all([
        supabase.from('user_tags').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*').order('name')
      ])
      
      if (tagsRes.data) setTags(tagsRes.data)
      if (communitiesRes.data) setCommunities(communitiesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = () => {
    setEditingTag(null)
    setIsModalOpen(true)
  }

  const handleEditTag = (tag: UserTag) => {
    setEditingTag(tag)
    setIsModalOpen(true)
  }

  const handleDeleteTag = async (tag: UserTag) => {
    if (!confirm(`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', tag.id)
      
      if (error) throw error
      
      setTags(tags.filter(t => t.id !== tag.id))
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag. Please try again.')
    }
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    fetchData()
  }

  const filteredTags = selectedCommunity 
    ? tags.filter(tag => tag.community_id === selectedCommunity)
    : tags

  const getCommunityName = (communityId: string) => {
    return communities.find(c => c.id === communityId)?.name || 'Unknown Community'
  }

  const groupedTags = filteredTags.reduce((groups, tag) => {
    const communityName = getCommunityName(tag.community_id)
    if (!groups[communityName]) {
      groups[communityName] = []
    }
    groups[communityName].push(tag)
    return groups
  }, {} as Record<string, UserTag[]>)

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Tags</h1>
            <p className="mt-2 text-gray-600">Manage user categorization tags for each community</p>
          </div>
          <button
            onClick={handleCreateTag}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Create Tag
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <label htmlFor="community-filter" className="text-sm font-medium text-gray-700">
              Filter by Community:
            </label>
            <select
              id="community-filter"
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags by Client */}
        {Object.keys(groupedTags).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedTags).map(([communityName, communityTags]) => {
              const community = communities.find(c => c.name === communityName)
              return (
                <div key={communityName} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      {community && (
                        <div 
                          className="h-6 w-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: community.brand_color + '20' }}
                        >
                          <Building2 
                            className="h-4 w-4" 
                            style={{ color: community.brand_color }}
                          />
                        </div>
                      )}
                      <h2 className="text-lg font-semibold text-gray-900">{communityName}</h2>
                      <span className="text-sm text-gray-500">({communityTags.length} tags)</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {communityTags.map((tag) => (
                        <div key={tag.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: tag.color }}
                              >
                                <Tag className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{tag.name}</h3>
                                <p className="text-sm text-gray-500">
                                  Created {new Date(tag.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditTag(tag)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTag(tag)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {selectedCommunity ? 'No tags found for this community' : 'No tags yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCommunity 
                ? 'This community has no user tags created yet.'
                : 'Get started by creating your first user tag.'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateTag}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Create Tag
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tag Modal */}
      <TagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        tag={editingTag}
        communities={communities}
      />
    </Layout>
  )
}

export default Tags