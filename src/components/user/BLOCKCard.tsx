import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Package, Star, Wrench } from 'lucide-react'

interface WorkoutBlock {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  tags: string[]
  block_category: 'warm-up' | 'cardio' | 'strength' | 'flexibility' | 'cool-down' | 'general' | null
  equipment_needed: string[]
  instructions: string | null
  created_at: string
  updated_at: string
}

interface BLOCKCardProps {
  block: WorkoutBlock
}

export function BLOCKCard({ block }: BLOCKCardProps) {
  const navigate = useNavigate()

  const getDifficultyColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'warm-up':
        return 'bg-yellow-100 text-yellow-800'
      case 'cardio':
        return 'bg-red-100 text-red-800'
      case 'strength':
        return 'bg-blue-100 text-blue-800'
      case 'flexibility':
        return 'bg-green-100 text-green-800'
      case 'cool-down':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'TBD'
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  const handleClick = () => {
    navigate(`/user/training-zone/block/${block.id}`)
  }

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="aspect-w-16 aspect-h-9">
        {block.thumbnail_url ? (
          <img
            src={block.thumbnail_url}
            alt={block.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJMT0NLIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Package className="h-12 w-12 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {block.title}
            </h3>
            <div className="flex items-center space-x-1 text-yellow-500 ml-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium text-gray-700">4.8</span>
            </div>
          </div>
          
          {block.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {block.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(block.estimated_duration_minutes)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span>Workout Block</span>
          </div>

          {block.equipment_needed && block.equipment_needed.length > 0 && (
            <div className="flex items-center space-x-1">
              <Wrench className="h-4 w-4" />
              <span>{block.equipment_needed.length} item{block.equipment_needed.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {block.difficulty_level && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(block.difficulty_level)}`}>
              {block.difficulty_level}
            </span>
          )}
          
          {block.block_category && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(block.block_category)}`}>
              {block.block_category.replace('-', ' ')}
            </span>
          )}
        </div>

        {/* Tags */}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {block.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {block.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                +{block.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Updated {new Date(block.updated_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Use Block
          </button>
        </div>
      </div>
    </div>
  )
}
