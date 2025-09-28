import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { Bell, Settings, Search, LogOut, User, Palette } from 'lucide-react'
import { UserAvatar } from './UserAvatar'

export function UserHeader() {
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Search:', searchQuery)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsSettingsDropdownOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const toggleSettingsDropdown = () => {
    setIsSettingsDropdownOpen(!isSettingsDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsSettingsDropdownOpen(false)
      }
    }

    if (isSettingsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsDropdownOpen])

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left: Logo/Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">AI Gym</h1>
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
            
            {/* Settings Dropdown */}
            <div className="relative">
              <button 
                ref={buttonRef}
                onClick={toggleSettingsDropdown}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Dropdown Menu */}
              {isSettingsDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsSettingsDropdownOpen(false)}
                  />
                  <div 
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20 divide-y divide-gray-100"
                  >
                    {/* User Info Section */}
                    <div className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={user} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.email}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            Community Member
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsSettingsDropdownOpen(false)
                          // TODO: Navigate to profile page
                          console.log('Navigate to profile')
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsSettingsDropdownOpen(false)
                          // TODO: Navigate to preferences/settings page
                          console.log('Navigate to preferences')
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Palette className="mr-3 h-4 w-4" />
                        Preferences
                      </button>
                    </div>

                    {/* Sign Out Section */}
                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
