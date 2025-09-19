import React from 'react'
import { ArrowLeft, Save, Eye, Users } from 'lucide-react'
import { WODData, Block } from '../WODBuilder'
import { BlockRenderer } from './BlockRenderer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface CenterCanvasProps {
  wodData: WODData
  currentPageId: string
  onPageChange: (pageId: string) => void
  selectedBlock: Block | null
  onBlockSelect: (block: Block) => void
  onBlockReorder: (blockId: string, direction: 'up' | 'down') => void
  onBackToRepository: () => void
  onSave: () => void
  saving: boolean
}

export function CenterCanvas({
  wodData,
  currentPageId,
  onPageChange,
  selectedBlock,
  onBlockSelect,
  onBlockReorder,
  onBackToRepository,
  onSave,
  saving
}: CenterCanvasProps) {
  const currentPage = wodData.pages.find(page => page.id === currentPageId) || wodData.pages[0]
  const blocks = currentPage?.blocks || []
  
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToRepository}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Training Zone</span>
          </button>
          
          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-lg font-semibold text-gray-900">{wodData.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{wodData.pages.length} pages</span>
              <span>•</span>
              <span>Page: {currentPage?.title || 'Untitled'}</span>
              <span>•</span>
              <span className={`inline-flex items-center space-x-1 ${
                wodData.status === 'published' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                <Eye className="h-3 w-3" />
                <span className="capitalize">{wodData.status}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Preview</span>
          </button>
          
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="text-sm">{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
      
      {/* Page Navigation */}
      {wodData.pages.length > 1 && (
        <div className="flex items-center space-x-1 px-6 py-3 border-b border-gray-200 bg-gray-50">
          {wodData.pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  currentPageId === page.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <span>{page.title}</span>
              <span className="ml-2 text-xs text-gray-500">({page.blocks.length} blocks)</span>
            </button>
          ))}
          
          <button className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-sm">+ New Page</span>
          </button>
        </div>
      )}
      
      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 bg-white">
        <div className="max-w-4xl mx-auto">
          {blocks.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl text-gray-400 mb-6">🚀</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Start building your WOD
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Use the left sidebar to add blocks and create engaging content for your workout.
              </p>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  Click any icon in the left navigation to add your first block
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {blocks.map((block, index) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  isSelected={selectedBlock?.id === block.id}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                  onSelect={() => onBlockSelect(block)}
                  onMoveUp={() => onBlockReorder(block.id, 'up')}
                  onMoveDown={() => onBlockReorder(block.id, 'down')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}