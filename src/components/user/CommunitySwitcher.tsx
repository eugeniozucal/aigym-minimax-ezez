import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useCommunity } from '@/contexts/CommunityContext'

export function CommunitySwitcher() {
  const { currentCommunity, userCommunities, loading, switchCommunity } = useCommunity()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCommunitySelect = (communityId: string) => {
    switchCommunity(communityId)
    setIsOpen(false)
  }

  // Show loading or default state
  if (loading || !currentCommunity) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 rounded-full bg-gray-300 animate-pulse" />
        <div className="h-6 w-24 bg-gray-300 rounded animate-pulse" />
      </div>
    )
  }

  // If user has no communities, show default
  if (userCommunities.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">G</span>
        </div>
        <span className="text-xl font-bold text-gray-900">Guest Mode</span>
      </div>
    )
  }

  // If user has only one community, show it without dropdown
  if (userCommunities.length === 1) {
    return (
      <div className="flex items-center space-x-2">
        {currentCommunity.logo_url ? (
          <img
            src={currentCommunity.logo_url}
            alt={currentCommunity.name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: currentCommunity.brand_color }}
          >
            {currentCommunity.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-xl font-bold text-gray-900">{currentCommunity.name}</span>
      </div>
    )
  }

  // Show dropdown for multiple communities
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Community Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors group"
      >
        {currentCommunity.logo_url ? (
          <img
            src={currentCommunity.logo_url}
            alt={currentCommunity.name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: currentCommunity.brand_color }}
          >
            {currentCommunity.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span>{currentCommunity.name}</span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Switch Community
            </div>
            {userCommunities.map((community) => (
              <button
                key={community.id}
                onClick={() => handleCommunitySelect(community.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {community.logo_url ? (
                    <img
                      src={community.logo_url}
                      alt={community.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: community.brand_color }}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{community.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{community.role}</div>
                  </div>
                </div>
                {currentCommunity?.id === community.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
