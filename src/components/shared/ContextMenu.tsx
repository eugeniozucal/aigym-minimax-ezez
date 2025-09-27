import React, { useState } from 'react'
import { MoreVertical, Star, Copy, Trash2, Folder, Heart, Edit, ExternalLink } from 'lucide-react'

interface ContextMenuOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface ContextMenuProps {
  options: ContextMenuOption[]
  children: React.ReactNode
  className?: string
}

export function ContextMenu({ options, children, className = '' }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsOpen(true)
  }

  const handleOptionClick = (option: ContextMenuOption) => {
    if (!option.disabled) {
      option.action()
      setIsOpen(false)
    }
  }

  const handleClickOutside = () => {
    setIsOpen(false)
  }

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} onContextMenu={handleContextMenu}>
      {children}
      
      {isOpen && (
        <div 
          className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -10px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  option.variant === 'danger' 
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Quick action menu component (3-dot menu)
interface QuickActionsProps {
  onCopy: () => void
  onMove: () => void
  onDelete: () => void
  onEdit: () => void
  onView: () => void
  isFavorited: boolean
  onToggleFavorite: () => void
  className?: string
}

export function QuickActions({ 
  onCopy, 
  onMove, 
  onDelete, 
  onEdit, 
  onView,
  isFavorited,
  onToggleFavorite,
  className = ''
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const options: ContextMenuOption[] = [
    {
      id: 'view',
      label: 'Open in new tab',
      icon: ExternalLink,
      action: onView
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit,
      action: onEdit
    },
    {
      id: 'favorite',
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      icon: isFavorited ? Heart : Star,
      action: onToggleFavorite
    },
    {
      id: 'copy',
      label: 'Make a copy',
      icon: Copy,
      action: onCopy
    },
    {
      id: 'move',
      label: 'Move to folder',
      icon: Folder,
      action: onMove
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      action: onDelete,
      variant: 'danger' as const
    }
  ]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48">
            {options.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    option.action()
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    option.variant === 'danger' 
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}