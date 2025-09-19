/**
 * PageBuilder Sidebar - Left panel with tools and navigation
 */

import React from 'react'
import { useContentStore, useUIState } from '@/lib/stores/contentStore'

export const PageBuilderSidebar: React.FC = () => {
  const { activeLeftMenu, setActiveLeftMenu, setRepositoryPopup } = useContentStore()
  const uiState = useUIState()

  const menuItems = [
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'blocks', label: 'Blocks', icon: '🧱' },
    { id: 'wods', label: 'WODs', icon: '🏋️' },
    { id: 'programs', label: 'Programs', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const handleMenuClick = (menuId: string) => {
    if (activeLeftMenu === menuId) {
      setActiveLeftMenu(null)
    } else {
      setActiveLeftMenu(menuId)
      
      // Open repository popup for content types
      if (['blocks', 'wods', 'programs'].includes(menuId)) {
        setRepositoryPopup({ type: menuId, isOpen: true })
      }
    }
  }

  return (
    <div className="w-16 bg-gray-800 flex flex-col">
      {/* Menu items */}
      <div className="flex-1 py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            className={`w-full h-12 flex items-center justify-center text-2xl hover:bg-gray-700 transition-colors ${
              activeLeftMenu === item.id ? 'bg-gray-700' : ''
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
      
      {/* Bottom spacer */}
      <div className="p-4">
        {/* Could add user avatar or additional controls here */}
      </div>
    </div>
  )
}
