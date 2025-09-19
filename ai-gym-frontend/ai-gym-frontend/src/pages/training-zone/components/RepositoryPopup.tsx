import React, { useState, useEffect } from 'react'
import { X, Search, Grid, List, Filter } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface RepositoryPopupProps {
  contentType: string
  onContentSelect: (content: any) => void
  onClose: () => void
}

interface ContentItem {
  id: string
  title: string
  description: string
  thumbnail_url?: string
  created_at: string
}

export function RepositoryPopup({ contentType, onContentSelect, onClose }: RepositoryPopupProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPublishedOnly, setShowPublishedOnly] = useState(true)
  
  useEffect(() => {
    loadContent()
  }, [contentType])
  
  const loadContent = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API calls
      const mockContent = generateMockContent(contentType)
      setContent(mockContent)
    } catch (error) {
      console.error('Failed to load content:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const generateMockContent = (type: string): ContentItem[] => {
    const baseItems = [
      { id: '1', title: `Sample ${type} 1`, description: `Description for ${type} 1`, created_at: '2024-01-01' },
      { id: '2', title: `Sample ${type} 2`, description: `Description for ${type} 2`, created_at: '2024-01-02' },
      { id: '3', title: `Sample ${type} 3`, description: `Description for ${type} 3`, created_at: '2024-01-03' },
      { id: '4', title: `Sample ${type} 4`, description: `Description for ${type} 4`, created_at: '2024-01-04' },
      { id: '5', title: `Sample ${type} 5`, description: `Description for ${type} 5`, created_at: '2024-01-05' }
    ]
    
    return baseItems
  }
  
  const filteredContent = content.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'ai-agent': return '🤖'
      case 'document': return '📚'
      case 'prompts': return '💭'
      case 'automation': return '⚡'
      case 'image': return '🖼️'
      case 'pdf': return '📄'
      default: return '📁'
    }
  }
  
  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'ai-agent': return 'AI Agents'
      default: return type.charAt(0).toUpperCase() + type.slice(1) + 's'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getContentIcon(contentType)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Select {getContentTypeLabel(contentType)}
              </h2>
              <p className="text-sm text-gray-600">
                Choose content from your repository to add to the WOD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filters and Search */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={`Search ${contentType}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPublishedOnly}
                  onChange={(e) => setShowPublishedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Published only</span>
              </label>
            </div>
          </div>
          
          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl text-gray-400 mb-4">{getContentIcon(contentType)}</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {contentType}s found
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : `No ${contentType}s have been added to your repository yet.`}
              </p>
            </div>
          ) : (
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-2'
              }
            `}>
              {filteredContent.map((item) => (
                <div
                  key={item.id}
                  className={`
                    border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer
                    ${viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center space-x-3'}
                  `}
                  onClick={() => onContentSelect(item)}
                >
                  {viewMode === 'grid' ? (
                    <div>
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <div className="text-2xl">{getContentIcon(contentType)}</div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-lg">{getContentIcon(contentType)}</div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                        <p className="text-sm text-gray-600 truncate">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {filteredContent.length} {contentType}s available
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Select Content
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}