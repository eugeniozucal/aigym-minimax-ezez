import React from 'react'
import { X, Eye, Dumbbell, Package, Calendar } from 'lucide-react'
import { PageData, Block } from '@/types/pageBuilder'
import { BlockRenderer } from './BlockRenderer'

interface PreviewModalProps {
  pageData: PageData
  currentPageId: string
  isOpen: boolean
  onClose: () => void
}

export function PreviewModal({ pageData, currentPageId, isOpen, onClose }: PreviewModalProps) {
  if (!isOpen) return null

  const currentPage = pageData.pages.find(page => page.id === currentPageId) || pageData.pages[0]
  const blocks = currentPage?.blocks || []
  
  // Repository configuration for icon
  const getRepositoryIcon = (repo: string) => {
    switch (repo) {
      case 'wods': return Dumbbell
      case 'blocks': return Package
      case 'programs': return Calendar
      default: return Eye
    }
  }
  
  const RepositoryIcon = getRepositoryIcon(pageData.targetRepository)
  
  const getRepositoryColor = (repo: string) => {
    switch (repo) {
      case 'wods': return 'orange'
      case 'blocks': return 'blue'
      case 'programs': return 'purple'
      default: return 'gray'
    }
  }
  
  const color = getRepositoryColor(pageData.targetRepository)
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              color === 'orange' ? 'bg-orange-600' :
              color === 'blue' ? 'bg-blue-600' :
              color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'
            }`}>
              <RepositoryIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Preview: {pageData.title}
              </h2>
              <p className="text-sm text-gray-600">
                {pageData.targetRepository.toUpperCase()} • {pageData.status} • {blocks.length} blocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
            {/* Page Title and Description */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-4 ${
                color === 'orange' ? 'text-orange-900' :
                color === 'blue' ? 'text-blue-900' :
                color === 'purple' ? 'text-purple-900' : 'text-gray-900'
              }`}>
                {pageData.title}
              </h1>
              {pageData.description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {pageData.description}
                </p>
              )}
              
              {/* Metadata */}
              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                {pageData.settings.estimatedDuration && (
                  <span>
                    Duration: {pageData.settings.estimatedDuration} minutes
                  </span>
                )}
                {pageData.settings.difficulty && (
                  <span>
                    Difficulty: {pageData.settings.difficulty}/5
                  </span>
                )}
                {pageData.settings.tags && pageData.settings.tags.length > 0 && (
                  <span>
                    Tags: {pageData.settings.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Page Content Blocks */}
            {blocks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl text-gray-400 mb-4">📄</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No content yet
                </h3>
                <p className="text-gray-600">
                  Add some blocks to see the preview content.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {blocks.map((block) => (
                  <div key={block.id} className="preview-block">
                    <BlockRenderer
                      block={block}
                      isSelected={false}
                      canMoveUp={false}
                      canMoveDown={false}
                      onSelect={() => {}}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                      isPreview={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Preview Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Preview mode • Changes are not saved automatically
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
              color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
              color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
