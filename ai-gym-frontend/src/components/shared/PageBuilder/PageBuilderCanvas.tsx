/**
 * PageBuilder Canvas - Main editing area
 */

import React from 'react'
import { 
  usePageData, 
  useCurrentContent, 
  useContentStore 
} from '@/lib/stores/contentStore'
import { Block } from '@/types/pageBuilder'

export const PageBuilderCanvas: React.FC = () => {
  const pageData = usePageData()
  const currentContent = useCurrentContent()
  const { 
    currentPageId, 
    setSelectedBlock, 
    updatePageData 
  } = useContentStore()

  if (!pageData || !currentContent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <p>No content loaded</p>
        </div>
      </div>
    )
  }

  const currentPage = pageData.pages.find(p => p.id === currentPageId)
  
  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <p>Page not found</p>
        </div>
      </div>
    )
  }

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block)
  }

  const handleTitleChange = (newTitle: string) => {
    updatePageData({ title: newTitle })
  }

  const handleDescriptionChange = (newDescription: string) => {
    updatePageData({ description: newDescription })
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Page header */}
      <div className="p-6 border-b border-gray-200">
        <input
          type="text"
          value={pageData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-2xl font-bold w-full border-none outline-none bg-transparent"
          placeholder="Enter title..."
        />
        <textarea
          value={pageData.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="mt-2 w-full text-gray-600 border-none outline-none bg-transparent resize-none"
          placeholder="Enter description..."
          rows={2}
        />
      </div>

      {/* Page content */}
      <div className="p-6">
        {currentPage.blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg">No blocks added yet</p>
            <p className="text-sm">Use the sidebar to add content blocks</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentPage.blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => handleBlockClick(block)}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{block.title}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {block.type}
                  </span>
                </div>
                {block.description && (
                  <p className="text-sm text-gray-600 mb-2">{block.description}</p>
                )}
                {block.content && (
                  <div className="text-sm text-gray-800">
                    {typeof block.content === 'string' 
                      ? block.content 
                      : JSON.stringify(block.content, null, 2)
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
