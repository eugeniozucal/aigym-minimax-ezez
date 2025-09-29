import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { Bell, Settings, Search, LogOut } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { CommunitySwitcher } from './CommunitySwitcher'

export function UserHeader() {
  const { user, signOut, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Search:', searchQuery)
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      // Redirect will be handled by auth state change
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
      setIsSettingsOpen(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsOpen])

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left: Logo/Brand & Community Switcher */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <CommunitySwitcher />
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
          <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
            <UserAvatar user={user} />
            <button 
              onClick={handleSettingsClick}
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
              disabled={loading || isSigningOut}
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                {/* Settings Header */}
                <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
                  Settings
                </div>
                
                {/* Sign Out Option */}
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
