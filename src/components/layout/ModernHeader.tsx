import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { ChevronDown, BarChart3, Users, FileText, Settings, LogOut, User } from 'lucide-react'

export function ModernHeader() {
  const { admin, signOut } = useAuth()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const navigationSections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard',
      description: 'Analytics and overview'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      path: '/clients',
      description: 'Client management'
    },
    {
      id: 'content',
      label: 'Content Repositories',
      icon: FileText,
      path: '/content',
      description: 'Content management',
      subItems: [
        { label: 'AI Agents', path: '/content/ai-agents' },
        { label: 'Videos', path: '/content/videos' },
        { label: 'Documents', path: '/content/documents' },
        { label: 'Prompts', path: '/content/prompts' },
        { label: 'Automations', path: '/content/automations' }
      ]
    }
  ]

  const getCurrentSection = () => {
    return navigationSections.find(section => 
      location.pathname.startsWith(section.path)
    ) || navigationSections[0]
  }

  const currentSection = getCurrentSection()

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      setUserMenuOpen(false)
      setIsSettingsDropdownOpen(false)
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                className="h-8 w-auto"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F59E0B'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E"
                alt="AI Workify"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Workify</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationSections.map((section) => {
              const Icon = section.icon
              const isActive = currentSection.id === section.id
              
              return (
                <Link
                  key={section.id}
                  to={section.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.label}</span>
                  {section.subItems && (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="relative flex items-center space-x-4">
            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Settings className="h-5 w-5" />
              </button>

              {isSettingsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-500 font-medium border-b border-gray-100">
                      Settings
                    </div>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                      {isSigningOut && (
                        <div className="ml-auto h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay to close dropdown when clicking outside */}
              {isSettingsDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSettingsDropdownOpen(false)}
                />
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {admin?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {admin?.email}
                      </p>
                      <p className="text-xs text-gray-500">Super Admin</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay to close dropdown when clicking outside */}
              {userMenuOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setUserMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Current Section Indicator */}
        <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2 text-sm">
            <currentSection.icon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">{currentSection.label}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{currentSection.description}</span>
          </div>
        </div>
      </div>
    </header>
  )
}