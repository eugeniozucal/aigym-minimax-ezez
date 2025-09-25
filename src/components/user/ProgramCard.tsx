import React from 'react'
import { Program } from '../../pages/user/TrainingZonePage'
import { Clock, Users, Star, DollarSign } from 'lucide-react'

interface ProgramCardProps {
  program: Program
}

export function ProgramCard({ program }: ProgramCardProps) {
  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Free'
    return `$${price.toFixed(2)}`
  }

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

  const handleEnroll = () => {
    // TODO: Implement enrollment functionality
    console.log('Enroll in program:', program.id)
  }

  const handleViewDetails = () => {
    // TODO: Implement view details functionality
    console.log('View program details:', program.id)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Thumbnail */}
      <div className="aspect-w-16 aspect-h-9">
        {program.thumbnail_url ? (
          <img
            src={program.thumbnail_url}
            alt={program.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvdXJzZSBJbWFnZTwvdGV4dD48L3N2Zz4='
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm text-gray-500">Course Image</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
              {program.title}
            </h3>
            <div className="flex items-center space-x-1 text-yellow-500 ml-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium text-gray-700">4.8</span>
            </div>
          </div>
          
          {program.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {program.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
          {program.estimated_duration_hours && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{program.estimated_duration_hours}h</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>150+ enrolled</span>
          </div>
          
          {program.difficulty_level && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(program.difficulty_level)}`}>
              {program.difficulty_level}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {formatPrice(program.price)}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleViewDetails}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Details
            </button>
            <button
              onClick={handleEnroll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Enroll
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}