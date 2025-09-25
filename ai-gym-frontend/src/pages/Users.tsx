import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { supabase, User, Community, UserTag } from '../lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Plus, Users, Search, Building2, Tag, MoreHorizontal } from 'lucide-react'

function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [usersRes, communitiesRes, tagsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('communities').select('*').order('name'),
        supabase.from('user_tags').select('*').order('name')
      ])
      
      if (usersRes.data) setUsers(usersRes.data)
      if (communitiesRes.data) setCommunities(communitiesRes.data)
      if (tagsRes.data) setUserTags(tagsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCommunity = selectedCommunity === '' || user.community_id === selectedCommunity
    
    return matchesSearch && matchesCommunity
  })

  const getUserCommunity = (communityId: string) => {
    return communities.find(c => c.id === communityId)
  }

  const getFullName = (user: User) => {
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
              const community = getUserCommunity(user.community_id)
              return (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
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
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {community && (
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3" style={{ color: community.brand_color }} />
                              <span className="text-xs text-gray-500">{community.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <p className="text-gray-900">Created</p>
                        <p className="text-gray-500">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                      {user.last_active && (
                        <div className="text-right text-sm">
                          <p className="text-gray-900">Last Active</p>
                          <p className="text-gray-500">{new Date(user.last_active).toLocaleDateString()}</p>
                        </div>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
                  : 'Users will appear here once they are created for communities.'
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