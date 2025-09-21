/**
 * PageBuilder Modals - Repository popup and other modals
 */

import React from 'react'
import { 
  useUIState, 
  useContentStore 
} from '@/lib/stores/contentStore'
import { useContentList } from '@/lib/hooks/useContent'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export const PageBuilderModals: React.FC = () => {
  const { repositoryPopup } = useUIState()
  const { 
    setRepositoryPopup, 
    addBlock, 
    currentPageId 
  } = useContentStore()

  if (!repositoryPopup.isOpen) {
    return null
  }

  return (
    <RepositoryPopup 
      type={repositoryPopup.type}
      onClose={() => setRepositoryPopup({ type: '', isOpen: false })}
      onSelect={(item) => {
        // Add selected item as a block
        if (currentPageId) {
          const block = {
            id: `block-${Date.now()}`,
            type: repositoryPopup.type,
            title: item.title,
            description: item.description,
            content: item.content || item,
            order: 0,
            pageId: currentPageId,
            data: item.content || item
          }
          addBlock(currentPageId, block)
        }
        setRepositoryPopup({ type: '', isOpen: false })
      }}
    />
  )
}

interface RepositoryPopupProps {
  type: string
  onClose: () => void
  onSelect: (item: any) => void
}

const RepositoryPopup: React.FC<RepositoryPopupProps> = ({
  type,
  onClose,
  onSelect
}) => {
  const repositoryType = type as any
  const { data: items, isLoading, error } = useContentList(repositoryType)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Select {type.charAt(0).toUpperCase() + type.slice(1)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Loading {type}...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              Failed to load {type}: {error.message}
            </div>
          )}

          {items && items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No {type} found
            </div>
          )}

          {items && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  {item.thumbnail_url && (
                    <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="max-w-full max-h-full object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  
                  <h3 className="font-medium text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.status}</span>
                    {item.difficulty_level && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {item.difficulty_level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
