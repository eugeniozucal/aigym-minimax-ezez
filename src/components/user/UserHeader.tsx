import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Bell, Settings, Search } from 'lucide-react'
import { UserAvatar } from './UserAvatar'

interface Community {
  name: string
  brand_color: string | null
  logo_url: string | null
}

export function UserHeader() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<Community | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadCommunity() {
      if (!user) return
      
      try {
        // Get user's client info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('client_id')
          .eq('id', user.id)
          .maybeSingle()
        
        if (userError || !userData) {
          console.error('Error fetching user data:', userError)
          return
        }
        
        // Get client/community info
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('name, brand_color, logo_url')
          .eq('id', userData.client_id)
          .maybeSingle()
        
        if (clientError) {
          console.error('Error fetching client data:', clientError)
          return
        }
        
        if (clientData) {
          setCommunity(clientData)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    
    loadCommunity()
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Search:', searchQuery)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left: Community Logo and Name */}
        <div className="flex items-center space-x-3">
          {community?.logo_url ? (
            <img 
              src={community.logo_url} 
              alt={community.name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {community?.name?.charAt(0) || 'C'}
              </span>
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900">
            {community?.name || 'Community'}
          </h1>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </form>
        </div>

        {/* Right: Notifications and User Controls */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">1</span>
            </span>
          </button>

          {/* User Configuration Zone */}
          <div className="flex items-center space-x-2">
            <UserAvatar user={user} />
            <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}