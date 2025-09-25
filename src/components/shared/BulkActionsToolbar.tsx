import React, { useState } from 'react'
import { X, Folder, Plus, Trash2, FolderPlus, Move } from 'lucide-react'

interface Folder {
  id: string
  name: string
  parent_folder_id?: string | null
  repository_type: 'wods' | 'blocks'
  color?: string
  path?: string
  depth?: number
}

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkMove: (folderId: string | null) => void
  onBulkDelete: () => void
  onBulkFavorite: (isFavorited: boolean) => void
  folders: Folder[]
  repositoryType: 'wods' | 'blocks'
  themeColor: 'orange' | 'blue'
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkMove,
  onBulkDelete,
  onBulkFavorite,
  folders,
  repositoryType,
  themeColor
}: BulkActionsToolbarProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const handleBulkMove = () => {
    onBulkMove(selectedFolderId)
    setShowMoveDialog(false)
    setSelectedFolderId(null)
  }

  const themeClasses = {
    orange: {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      ring: 'focus:ring-orange-500',
      text: 'text-orange-600'
    },
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      ring: 'focus:ring-blue-500',
      text: 'text-blue-600'
    }
  }[themeColor]

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${themeClasses.bg} text-white shadow-lg transition-transform duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClearSelection}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="font-medium">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onBulkFavorite(true)}
                className="inline-flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Favorites
              </button>
              
              <button
                onClick={() => setShowMoveDialog(true)}
                className="inline-flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Move className="h-4 w-4 mr-2" />
                Move to Folder
              </button>
              
              <button
                onClick={onBulkDelete}
                className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Move Dialog */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowMoveDialog(false)} />
            
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${themeClasses.bg}/10 sm:mx-0 sm:h-10 sm:w-10`}>
                    <Folder className={`h-6 w-6 ${themeClasses.text}`} />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Move {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
                    </h3>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select destination folder:
                      </label>
                      <select
                        value={selectedFolderId || ''}
                        onChange={(e) => setSelectedFolderId(e.target.value || null)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${themeClasses.ring} focus:border-transparent`}
                      >
                        <option value="">Root folder (no folder)</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {'  '.repeat(folder.depth || 0)}{folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleBulkMove}
                  className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 ${themeClasses.bg} text-base font-medium text-white ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.ring} sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  Move Items
                </button>
                <button
                  type="button"
                  onClick={() => setShowMoveDialog(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}