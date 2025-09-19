/**
 * PageBuilder Header - Save controls and status display
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  useCurrentContent, 
  usePageData, 
  useIsDirty, 
  useIsAutoSaving 
} from '@/lib/stores/contentStore'

interface PageBuilderHeaderProps {
  onSave: () => Promise<void>
  isAutoSaving: boolean
}

export const PageBuilderHeader: React.FC<PageBuilderHeaderProps> = ({
  onSave,
  isAutoSaving
}) => {
  const navigate = useNavigate()
  const currentContent = useCurrentContent()
  const pageData = usePageData()
  const isDirty = useIsDirty()
  const isStoreAutoSaving = useIsAutoSaving()

  const handleSave = async () => {
    try {
      await onSave()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handleExit = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) return
    }
    navigate('/training-zone')
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title and status */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {pageData?.title || 'Untitled'}
          </h1>
          
          {/* Status indicators */}
          <div className="flex items-center space-x-2">
            {(isAutoSaving || isStoreAutoSaving) && (
              <span className="flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                Auto-saving...
              </span>
            )}
            
            {isDirty && !isAutoSaving && !isStoreAutoSaving && (
              <span className="text-sm text-orange-600">
                • Unsaved changes
              </span>
            )}
            
            {!isDirty && !isAutoSaving && !isStoreAutoSaving && (
              <span className="text-sm text-green-600">
                ✓ Saved
              </span>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center space-x-3">
          {/* Manual save button */}
          <button
            onClick={handleSave}
            disabled={!isDirty || isAutoSaving || isStoreAutoSaving}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              isDirty && !isAutoSaving && !isStoreAutoSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>

          {/* Exit button */}
          <button
            onClick={handleExit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
