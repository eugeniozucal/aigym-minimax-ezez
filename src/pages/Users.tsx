import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { supabase, User, Client, UserTag } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Plus, Users, Search, Building2, Tag, MoreHorizontal, UserPlus, Crown, Shield, ChevronDown, ChevronRight } from 'lucide-react'

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

function UsersPage() {
  const [users, setUsers] = useState<EnhancedUser[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [expandedUsers, setExpandedUsers] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch communities and tags in parallel
      const [communitiesRes, tagsRes] = await Promise.all([
        supabase.from('communities').select('id, name, brand_color, logo_url').eq('status', 'active').order('name'),
        supabase.from('user_tags').select('*').order('name')
      ])
      
      // Optimized query: Get users with their communities in a single query
      // This eliminates the N+1 query problem
      const { data: usersWithCommunities, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          user_communities (
            community_id,
            role,
            joined_at,
            communities (
              id,
              name,
              brand_color,
              logo_url
            )
          )
        `)
        .order('created_at', { ascending: false })
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }
      
      if (usersWithCommunities) {
        // Transform the data to match the expected format
        const transformedUsers = usersWithCommunities.map(user => ({
          ...user,
          communities: user.user_communities?.map(uc => {
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
        }))
        
        setUsers(transformedUsers)
      }
      
      if (communitiesRes.data) setCommunities(communitiesRes.data)
      if (tagsRes.data) setUserTags(tagsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Add user-friendly error handling
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCommunity = selectedCommunity === '' || 
      (user.communities && user.communities.some(c => c.community_id === selectedCommunity))
    
    return matchesSearch && matchesCommunity
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={12} className="text-yellow-600" />;
      case 'moderator':
        return <Shield size={12} className="text-blue-600" />;
      default:
        return <Users size={12} className="text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      moderator: { bg: 'bg-blue-100', text: 'text-blue-800' },
      member: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    
    const { bg, text } = config[role as keyof typeof config] || config.member;
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
        {getRoleIcon(role)}
        <span className="ml-1">{role}</span>
      </span>
    );
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const getFullName = (user: EnhancedUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.first_name || user.last_name || 'Unnamed User'
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="mt-2 text-gray-600">Manage users across all community organizations</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Users List */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
              <span className="text-sm text-gray-500">{filteredUsers.length} users</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUsers[user.id];
              const userCommunities = user.communities || [];
              
              return (
                <div key={user.id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getFullName(user).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-medium text-gray-900">{getFullName(user)}</h3>
                            {userCommunities.length > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                {userCommunities.length} communit{userCommunities.length === 1 ? 'y' : 'ies'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="text-xs text-gray-500">
                              Created {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {userCommunities.length > 0 && (
                          <button
                            onClick={() => toggleUserExpanded(user.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span className="text-sm">Communities</span>
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Communities */}
                  {isExpanded && userCommunities.length > 0 && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <div className="pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Community Memberships</h4>
                        <div className="space-y-2">
                          {userCommunities.map((membership) => (
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
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || selectedCommunity ? 'No users found' : 'No users yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCommunity 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Users will appear here once they join communities.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default UsersPage