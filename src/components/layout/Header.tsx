import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, ChevronDown, Users, Settings, LogOut, Home, Tag, Bot, Play, FileText, MessageSquare, Zap, Image, FileType } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const { admin, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isContentDropdownOpen, setIsContentDropdownOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Clients', href: '/clients', icon: Building2 },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Tags', href: '/tags', icon: Tag },
  ]

  const contentRepositories = [
    { name: 'AI Agents', href: '/content/ai-agents', icon: Bot, color: '#3B82F6' },
    { name: 'Videos', href: '/content/videos', icon: Play, color: '#EF4444' },
    { name: 'Documents', href: '/content/documents', icon: FileText, color: '#10B981' },
    { name: 'Images', href: '/content/images', icon: Image, color: '#06B6D4' },
    { name: 'PDFs', href: '/content/pdfs', icon: FileType, color: '#DC2626' },
    { name: 'Prompts', href: '/content/prompts', icon: MessageSquare, color: '#8B5CF6' },
    { name: 'Automations', href: '/content/automations', icon: Zap, color: '#F59E0B' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const isContentActive = location.pathname.startsWith('/content')

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI GYM</h1>
                <p className="text-xs text-gray-500">by AI Workify</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center space-x-1 px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Content Repositories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsContentDropdownOpen(!isContentDropdownOpen)}
                className={`inline-flex items-center space-x-1 px-1 pt-1 text-sm font-medium transition-colors ${
                  isContentActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Content</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {isContentDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsContentDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-2">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Repositories
                      </div>
                      {contentRepositories.map((repo) => {
                        const Icon = repo.icon
                        const isActive = location.pathname === repo.href
                        return (
                          <Link
                            key={repo.name}
                            to={repo.href}
                            className={`flex items-center px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => setIsContentDropdownOpen(false)}
                          >
                            <Icon className="mr-3 h-4 w-4" style={{ color: repo.color }} />
                            {repo.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {admin?.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{admin?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{admin?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
    </header>
  )
}