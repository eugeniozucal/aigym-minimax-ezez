import React from 'react'
import { ChevronRight, Home, Folder } from 'lucide-react'

interface BreadcrumbItem {
  id: string | null
  name: string
  path?: string
}

interface BreadcrumbNavigationProps {
  currentPath: BreadcrumbItem[]
  onNavigate: (folderId: string | null) => void
  repositoryType: 'wods' | 'blocks'
  themeColor: 'orange' | 'blue'
  className?: string
}

export function BreadcrumbNavigation({
  currentPath,
  onNavigate,
  repositoryType,
  themeColor,
  className = ''
}: BreadcrumbNavigationProps) {
  const themeClasses = {
    orange: {
      text: 'text-orange-600',
      hover: 'hover:text-orange-700'
    },
    blue: {
      text: 'text-blue-600',
      hover: 'hover:text-blue-700'
    }
  }[themeColor]

  // Build the complete breadcrumb path starting with root
  const fullPath = [
    {
      id: null,
      name: `All ${repositoryType.toUpperCase()}`,
      path: 'root'
    },
    ...currentPath
  ]

  return (
    <nav className={`${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {fullPath.map((item, index) => {
          const isLast = index === fullPath.length - 1
          const isRoot = item.id === null
          
          return (
            <li key={item.id || 'root'} className="flex items-center">
              {/* Breadcrumb Item */}
              <button
                onClick={() => onNavigate(item.id)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                  isLast 
                    ? `${themeClasses.text} font-medium` 
                    : `text-gray-500 hover:text-gray-700 ${themeClasses.hover}`
                }`}
                disabled={isLast}
              >
                {isRoot ? (
                  <Home className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
                <span className="truncate max-w-32">{item.name}</span>
              </button>
              
              {/* Separator */}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1 flex-shrink-0" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Compact breadcrumb for smaller spaces
interface CompactBreadcrumbProps {
  currentFolderName: string | null
  onNavigateUp: () => void
  repositoryType: 'wods' | 'blocks'
  themeColor: 'orange' | 'blue'
  className?: string
}

export function CompactBreadcrumb({
  currentFolderName,
  onNavigateUp,
  repositoryType,
  themeColor,
  className = ''
}: CompactBreadcrumbProps) {
  const themeClasses = {
    orange: {
      text: 'text-orange-600',
      hover: 'hover:text-orange-700'
    },
    blue: {
      text: 'text-blue-600',
      hover: 'hover:text-blue-700'
    }
  }[themeColor]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={onNavigateUp}
        className={`flex items-center space-x-1 text-sm ${themeClasses.text} ${themeClasses.hover} transition-colors`}
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        <span>Back</span>
      </button>
      
      <span className="text-sm text-gray-500">•</span>
      
      <div className="flex items-center space-x-1">
        {currentFolderName ? (
          <>
            <Folder className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 truncate max-w-32">
              {currentFolderName}
            </span>
          </>
        ) : (
          <>
            <Home className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              All {repositoryType.toUpperCase()}
            </span>
          </>
        )}
      </div>
    </div>
  )
}