import React from 'react'
import { Settings, Plus, FileText, Layers } from 'lucide-react'

interface FixedLeftRailProps {
  activeMenu: string | null
  onMenuToggle: (menuId: string) => void
}

export function FixedLeftRail({ activeMenu, onMenuToggle }: FixedLeftRailProps) {
  const menuItems = [
    {
      id: 'settings',
      icon: Settings,
      title: 'WOD Settings',
      description: 'Configure WOD metadata and targeting'
    },
    {
      id: 'elements',
      icon: Plus,
      title: 'Elements',
      description: 'Basic building blocks'
    },
    {
      id: 'content',
      icon: FileText,
      title: 'Content',
      description: 'Repository content blocks'
    },
    {
      id: 'pages',
      icon: Layers,
      title: 'Pages',
      description: 'Page management'
    }
  ]

  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-4 z-50">
      <div className="flex flex-col space-y-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeMenu === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onMenuToggle(item.id)}
              className={`
                p-3 rounded-lg transition-all duration-200 group relative
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
              title={item.title}
            >
              <Icon className="h-5 w-5" />
              
              {/* Tooltip */}
              <div className="
                absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                pointer-events-none whitespace-nowrap z-50
              ">
                <div className="font-medium">{item.title}</div>
                <div className="text-gray-300 text-xs">{item.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}