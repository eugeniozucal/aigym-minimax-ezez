/**
 * PageBuilder Right Panel - Block editing panel
 */

import React from 'react'
import { 
  useSelectedBlock, 
  useUIState, 
  useContentStore 
} from '@/lib/stores/contentStore'

export const PageBuilderRightPanel: React.FC = () => {
  const selectedBlock = useSelectedBlock()
  const { showRightPanel } = useUIState()
  const { 
    currentPageId, 
    updateBlock, 
    removeBlock, 
    setSelectedBlock 
  } = useContentStore()

  if (!showRightPanel || !selectedBlock) {
    return null
  }

  const handleBlockUpdate = (field: string, value: any) => {
    if (selectedBlock && currentPageId) {
      updateBlock(currentPageId, selectedBlock.id, { [field]: value })
      // Update selected block in store
      setSelectedBlock({ ...selectedBlock, [field]: value })
    }
  }

  const handleRemoveBlock = () => {
    if (selectedBlock && currentPageId) {
      const confirmed = window.confirm('Are you sure you want to remove this block?')
      if (confirmed) {
        removeBlock(currentPageId, selectedBlock.id)
      }
    }
  }

  const handleClose = () => {
    setSelectedBlock(null)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Edit Block</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Block Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block Type
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded text-sm text-gray-600">
            {selectedBlock.type}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={selectedBlock.title || ''}
            onChange={(e) => handleBlockUpdate('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={selectedBlock.description || ''}
            onChange={(e) => handleBlockUpdate('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={
              typeof selectedBlock.content === 'string' 
                ? selectedBlock.content 
                : JSON.stringify(selectedBlock.content, null, 2)
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleBlockUpdate('content', parsed)
              } catch {
                handleBlockUpdate('content', e.target.value)
              }
            }}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Block-specific fields based on type */}
        {selectedBlock.type === 'exercise' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={selectedBlock.duration || ''}
                onChange={(e) => handleBlockUpdate('duration', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={selectedBlock.difficulty || 'beginner'}
                onChange={(e) => handleBlockUpdate('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleRemoveBlock}
          className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
        >
          Remove Block
        </button>
      </div>
    </div>
  )
}
