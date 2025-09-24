import React from 'react'
import { ArrowLeft, Save, Eye, Users, ChevronDown, Package, Dumbbell, Calendar, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Block, PageData } from '@/types/pageBuilder'
import { BlockRenderer } from './BlockRenderer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'



interface CenterCanvasProps {
  wodData: PageData // Keep the prop name for compatibility
  currentPageId: string
  onPageChange: (pageId: string) => void
  selectedBlock: Block | null
  onBlockSelect: (block: Block) => void
  onBlockReorder: (blockId: string, direction: 'up' | 'down') => void
  onBlockDelete?: (blockId: string) => void
  onBackToRepository: () => void
  onSave: () => void
  saving: boolean
  targetRepository: 'wods' | 'blocks' | 'programs'
  onRepositoryChange?: (repo: 'wods' | 'blocks' | 'programs') => void
  error?: string | null
  onClearError?: () => void
  successMessage?: string | null
  onClearSuccess?: () => void
  onPreview?: () => void
}

export function CenterCanvas({
  wodData,
  currentPageId,
  onPageChange,
  selectedBlock,
  onBlockSelect,
  onBlockReorder,
  onBlockDelete,
  onBackToRepository,
  onSave,
  saving,
  targetRepository = 'wods',
  onRepositoryChange,
  error,
  onClearError,
  successMessage,
  onClearSuccess,
  onPreview
}: CenterCanvasProps) {
  const currentPage = wodData.pages.find(page => page.id === currentPageId) || wodData.pages[0]
  const blocks = currentPage?.blocks || []
  
  // Repository configuration
  const REPOSITORY_CONFIG = {
    wods: {
      name: 'WODs',
      color: 'orange',
      icon: Dumbbell
    },
    blocks: {
      name: 'BLOCKS',
      color: 'blue',
      icon: Package
    },
    programs: {
      name: 'PROGRAMS',
      color: 'purple',
      icon: Calendar
    }
  }
  
  const config = REPOSITORY_CONFIG[targetRepository]
  const RepositoryIcon = config.icon
  
  return (
    <div className="flex-1 flex flex-col bg-white h-full">
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
          <button 
            onClick={onPreview}
            disabled={!onPreview}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm">Preview</span>
          </button>
          
          {/* Repository Selection Dropdown */}
          {onRepositoryChange && (
            <div className="relative">
              <select
                value={targetRepository}
                onChange={(e) => onRepositoryChange(e.target.value as 'wods' | 'blocks' | 'programs')}
                className={`
                  flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium 
                  focus:ring-2 focus:ring-offset-2 transition-colors
                  ${
                    config.color === 'orange'
                      ? 'focus:ring-orange-500 focus:border-orange-500'
                      : config.color === 'blue'
                      ? 'focus:ring-blue-500 focus:border-blue-500'
                      : 'focus:ring-purple-500 focus:border-purple-500'
                  }
                `}
              >
                <option value="wods">Save to WODs</option>
                <option value="blocks">Save to BLOCKS</option>
                <option value="programs">Save to PROGRAMS</option>
              </select>
            </div>
          )}
          
          <button
            onClick={onSave}
            disabled={saving}
            className={`
              flex items-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors
              ${
                config.color === 'orange'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : config.color === 'blue'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }
            `}
          >
            {saving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <RepositoryIcon className="h-4 w-4" />
                <Save className="h-4 w-4" />
              </>
            )}
            <span className="text-sm">
              {saving ? 'Saving...' : `Save ${config.name.slice(0, -1)}`}
            </span>
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Save Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Success!</p>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
            {onClearSuccess && (
              <button
                onClick={onClearSuccess}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-white min-h-0">
        <div className="max-w-4xl mx-auto">
          {blocks.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl text-gray-400 mb-6">🚀</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Start building your {config.name.slice(0, -1)}
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Use the left sidebar to add blocks and create engaging content for your {config.name.toLowerCase().slice(0, -1)}.
              </p>
              <div className={`
                inline-flex items-center space-x-2 px-4 py-2 rounded-lg
                ${
                  config.color === 'orange'
                    ? 'bg-orange-50 text-orange-700'
                    : config.color === 'blue'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-purple-50 text-purple-700'
                }
              `}>
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
                  onDelete={onBlockDelete ? () => onBlockDelete(block.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}