import React, { useState, useEffect } from 'react'
import { X, UserMinus, Check, Plus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Community {
  id: string;
  name: string;
  brand_color: string;
  logo_url?: string;
}

interface UserCommunity {
  community_id: string;
  community_name: string;
  role: string;
  joined_at: string;
  brand_color: string;
  logo_url?: string;
}

interface EnhancedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  communities?: UserCommunity[];
}

interface CommunityAssignmentPanelProps {
  user: EnhancedUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityAssignmentPanel: React.FC<CommunityAssignmentPanelProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const [assignableCommunities, setAssignableCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      setSelectedUser(user)
      loadAvailableCommunities()
    }
  }, [isOpen, user])

  const loadAvailableCommunities = async () => {
    setLoading(true)
    try {
      const { data: allCommunities, error } = await supabase
        .from('communities')
        .select('id, name, brand_color, logo_url')
        .eq('status', 'active')
        .order('name')
        .limit(10)
      
      if (error) {
        console.error('Error loading communities:', error)
      } else {
        setAssignableCommunities(allCommunities || [])
      }
    } catch (error) {
      console.error('Error loading communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCommunity = async (communityId: string, communityName: string) => {
    if (!selectedUser) return
    
    try {
      const { data, error } = await supabase.functions.invoke('community-membership-manager', {
        body: {
          action: 'add_user_to_community',
          user_id: selectedUser.id,
          community_id: communityId,
          role: 'member'
        }
      })

      if (error) throw error
      
      if (data?.data) {
        await refreshSelectedUserCommunities()
      }
    } catch (error) {
      console.error('Error adding user to community:', error)
      alert(`Failed to add user to ${communityName}. Please try again.`)
    }
  }

  const handleRemoveFromCommunity = async (communityId: string, communityName: string) => {
    if (!selectedUser) return
    
    const userName = getFullName(selectedUser)
    if (!confirm(`Are you sure you want to remove ${userName} from ${communityName}?`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('community-membership-manager', {
        body: {
          action: 'remove_user_from_community',
          user_id: selectedUser.id,
          community_id: communityId
        }
      })

      if (error) throw error
      
      if (data?.data?.success) {
        await refreshSelectedUserCommunities()
      }
    } catch (error) {
      console.error('Error removing user from community:', error)
      alert(`Failed to remove user from ${communityName}. Please try again.`)
    }
  }

  const refreshSelectedUserCommunities = async () => {
    if (!selectedUser) return
    
    try {
      const { data: userCommunities, error } = await supabase
        .from('user_communities')
        .select(`
          community_id,
          role,
          joined_at,
          communities (
            id,
            name,
            brand_color,
            logo_url
          )
        `)
        .eq('user_id', selectedUser.id)
      
      if (error) {
        console.error('Error refreshing user communities:', error)
        return
      }
      
      const communities = userCommunities?.map(uc => {
        const community = Array.isArray(uc.communities) ? uc.communities[0] : uc.communities
        return {
          community_id: uc.community_id,
          community_name: community?.name || 'Unknown',
          role: uc.role,
          joined_at: uc.joined_at,
          brand_color: community?.brand_color || '#6B7280',
          logo_url: community?.logo_url
        }
      }) || []
      
      setSelectedUser(prev => prev ? { ...prev, communities } : null)
    } catch (error) {
      console.error('Error refreshing user communities:', error)
    }
  }

  const getFullName = (user: EnhancedUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.first_name || user.last_name || 'Unnamed User'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="text-yellow-600">👑</span>
      case 'moderator':
        return <span className="text-blue-600">🛡️</span>
      default:
        return <span className="text-gray-600">👤</span>
    }
  }

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      moderator: { bg: 'bg-blue-100', text: 'text-blue-800' },
      member: { bg: 'bg-gray-100', text: 'text-gray-800' }
    }
    
    const { bg, text } = config[role as keyof typeof config] || config.member
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {getRoleIcon(role)}
        <span className="ml-1">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
      </span>
    )
  }

  if (!isOpen || !selectedUser) return null

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl border-l border-gray-200 z-40 overflow-y-auto">
      {/* Panel Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getFullName(selectedUser).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Community Assignments</h2>
              <p className="text-sm text-gray-600">{getFullName(selectedUser)}</p>
              <p className="text-xs text-gray-500">{selectedUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
            <p className="mt-2 text-gray-600">Loading communities...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Memberships */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Memberships</h3>
              {selectedUser.communities && selectedUser.communities.length > 0 ? (
                <div className="space-y-2">
                  {selectedUser.communities.map((membership) => (
                    <div key={membership.community_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {membership.logo_url ? (
                          <img
                            src={membership.logo_url}
                            alt={membership.community_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ backgroundColor: membership.brand_color }}
                          >
                            {membership.community_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{membership.community_name}</span>
                            {getRoleBadge(membership.role)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined {new Date(membership.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCommunity(membership.community_id, membership.community_name)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Remove from community"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No communities yet</p>
                </div>
              )}
            </div>

            {/* Add Communities */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Communities</h3>
              <div className="space-y-2">
                {assignableCommunities.length > 0 ? (
                  assignableCommunities.map((community) => {
                    const isAssigned = selectedUser.communities?.some(c => c.community_id === community.id) || false
                    
                    return (
                      <div key={community.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {community.logo_url ? (
                            <img
                              src={community.logo_url}
                              alt={community.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: community.brand_color }}
                            >
                              {community.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900">{community.name}</span>
                            {isAssigned && (
                              <div className="flex items-center space-x-1 text-xs text-green-600">
                                <Check size={12} />
                                <span>Already assigned</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCommunity(community.id, community.name)}
                          disabled={isAssigned}
                          className={`p-1 rounded transition-colors ${
                            isAssigned 
                              ? 'text-green-600 cursor-default' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title={isAssigned ? 'Already assigned' : 'Add to community'}
                        >
                          {isAssigned ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No communities available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityAssignmentPanel