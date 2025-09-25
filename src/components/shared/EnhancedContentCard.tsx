import React, { useState } from 'react'
import { Star, StarOff } from 'lucide-react'
import { QuickActions } from './ContextMenu'

interface ContentItem {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  status: 'draft' | 'published' | 'archived'
  difficulty_level?: string
  estimated_duration_minutes?: number
  is_favorited?: boolean
  updated_at: string
  folder_id?: string | null
}

interface EnhancedContentCardProps {
  item: ContentItem
  isSelected: boolean
  onSelect: (itemId: string, selected: boolean) => void
  onClick: (itemId: string) => void
  onCopy: (itemId: string) => void
  onMove: (itemId: string) => void
  onDelete: (itemId: string) => void
  onToggleFavorite: (itemId: string) => void
  viewMode: 'cards' | 'list'
  themeColor: 'orange' | 'blue'
  repositoryType: 'wods' | 'blocks'
  getStatusBadge: (status: string) => React.ReactNode
  getDifficultyBadge?: (difficulty: string) => React.ReactNode
  formatDate: (date: string) => string
  formatDuration: (minutes: number) => string
}

export function EnhancedContentCard({
  item,
  isSelected,
  onSelect,
  onClick,
  onCopy,
  onMove,
  onDelete,
  onToggleFavorite,
  viewMode,
  themeColor,
  repositoryType,
  getStatusBadge,
  getDifficultyBadge,
  formatDate,
  formatDuration
}: EnhancedContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const themeClasses = {
    orange: {
      hover: 'hover:text-orange-600',
      checkbox: 'text-orange-600 focus:ring-orange-500',
      star: 'text-orange-500',
      gradient: 'from-orange-400 to-orange-600'
    },
    blue: {
      hover: 'hover:text-blue-600',
      checkbox: 'text-blue-600 focus:ring-blue-500',
      star: 'text-blue-500',
      gradient: 'from-blue-400 to-blue-600'
    }
  }[themeColor]

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect(item.id, e.target.checked)
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(item.id)
  }

  const handleCardClick = () => {
    onClick(item.id)
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`cursor-pointer group transition-all relative ${
        viewMode === 'cards'
          ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-md bg-white'
          : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white'
      } ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
    >
      {/* Selection Checkbox */}
      <div className={`absolute ${viewMode === 'cards' ? 'top-2 left-2' : 'left-2 top-1/2 transform -translate-y-1/2'} z-10`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className={`h-4 w-4 rounded border-gray-300 ${themeClasses.checkbox} focus:ring-2 focus:ring-offset-2`}
        />
      </div>

      {/* Favorite Star */}
      <button
        onClick={handleStarClick}
        className={`absolute ${viewMode === 'cards' ? 'top-2 right-10' : 'right-10 top-1/2 transform -translate-y-1/2'} z-10 p-1 rounded-full hover:bg-white/80 transition-colors`}
      >
        {item.is_favorited ? (
          <Star className={`h-4 w-4 ${themeClasses.star} fill-current`} />
        ) : (
          <StarOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        )}
      </button>

      {/* Quick Actions Menu */}
      <div className={`absolute ${viewMode === 'cards' ? 'top-2 right-2' : 'right-2 top-1/2 transform -translate-y-1/2'} z-10`}>
        <QuickActions
          onCopy={() => onCopy(item.id)}
          onMove={() => onMove(item.id)}
          onDelete={() => onDelete(item.id)}
          onEdit={() => onClick(item.id)}
          onView={() => window.open(`/page-builder?repo=${repositoryType}&id=${item.id}`, '_blank')}
          isFavorited={item.is_favorited || false}
          onToggleFavorite={() => onToggleFavorite(item.id)}
        />
      </div>

      {/* Card Content */}
      {viewMode === 'cards' ? (
        <>
          <div className="aspect-video bg-gray-200 relative overflow-hidden">
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${themeClasses.gradient} flex items-center justify-center`}>
                <div className="text-white text-lg font-bold">
                  {repositoryType === 'wods' ? 'WOD' : 'BLOCK'}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex space-x-1">
              {getStatusBadge(item.status)}
            </div>
          </div>
          <div className="p-4 pt-8"> {/* Extra padding top for absolute positioned elements */}
            <h3 className={`font-semibold text-gray-900 group-hover:${themeClasses.hover} transition-colors line-clamp-2`}>
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.description || 'No description provided'}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                {item.difficulty_level && getDifficultyBadge && getDifficultyBadge(item.difficulty_level)}
                {item.estimated_duration_minutes && (
                  <span className="inline-flex items-center text-xs text-gray-500">
                    {formatDuration(item.estimated_duration_minutes)}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(item.updated_at)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 ml-6"> {/* margin for checkbox */}
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${themeClasses.gradient} rounded-lg flex items-center justify-center`}>
                <div className="text-white text-xs font-bold">
                  {repositoryType.toUpperCase()}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-16"> {/* padding right for absolute positioned elements */}
            <h3 className={`font-semibold text-gray-900 truncate group-hover:${themeClasses.hover} transition-colors`}>
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {item.description || 'No description provided'}
            </p>
            <div className="flex items-center space-x-3 mt-2">
              {getStatusBadge(item.status)}
              {item.difficulty_level && getDifficultyBadge && getDifficultyBadge(item.difficulty_level)}
              {item.estimated_duration_minutes && (
                <span className="inline-flex items-center text-xs text-gray-500">
                  {formatDuration(item.estimated_duration_minutes)}
                </span>
              )}
              <span className="text-xs text-gray-500">
                Updated {formatDate(item.updated_at)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}