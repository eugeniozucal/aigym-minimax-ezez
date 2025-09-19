import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Block } from '@/types/pageBuilder'

interface ContentBlockEditorProps {
  block: Block
  onUpdate: (block: Block) => void
  onOpenRepository?: (contentType: string) => void
}

export function ContentBlockEditor({ block, onUpdate, onOpenRepository }: ContentBlockEditorProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        [field]: value
      }
    })
  }
  
  const getBlockTypeLabel = (type: string) => {
    switch (type) {
      case 'ai-agent': return 'AI Agent'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }
  
  const getBlockIcon = (type: string) => {
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

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-medium text-gray-900 mb-4">
        {getBlockTypeLabel(block.type)} Settings
      </h3>
      
      {/* Selected Content Display */}
      {block.data.selectedContent ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{getBlockIcon(block.type)}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {block.data.selectedContent.title || block.data.selectedContent.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {block.data.selectedContent.description}
              </p>
              <button 
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 mt-2 cursor-pointer transition-colors"
                onClick={() => onOpenRepository?.(block.type)}
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hover:underline">Change {getBlockTypeLabel(block.type)}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
          <div className="text-3xl mb-2">{getBlockIcon(block.type)}</div>
          <p>No {getBlockTypeLabel(block.type).toLowerCase()} selected</p>
          <button 
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm cursor-pointer transition-colors hover:underline"
            onClick={() => onOpenRepository?.(block.type)}
          >
            Select {getBlockTypeLabel(block.type)}
          </button>
        </div>
      )}
      
      {/* Display Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Display Options</h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.showTitle !== false}
              onChange={(e) => handleChange('showTitle', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Title</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.showDescription !== false}
              onChange={(e) => handleChange('showDescription', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Description</span>
          </label>
        </div>
        
        {/* Custom Title Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Title (optional)
          </label>
          <input
            type="text"
            value={block.data.customTitle || ''}
            onChange={(e) => handleChange('customTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Override default title..."
          />
        </div>
        
        {/* Custom Description Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Description (optional)
          </label>
          <textarea
            rows={3}
            value={block.data.customDescription || ''}
            onChange={(e) => handleChange('customDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Override default description..."
          />
        </div>
      </div>
      
      {/* Block-specific options */}
      {block.type === 'video' && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Video Playback</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={block.data.autoplay || false}
                onChange={(e) => handleChange('autoplay', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Autoplay</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={block.data.loop || false}
                onChange={(e) => handleChange('loop', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Loop</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={block.data.showControls !== false}
                onChange={(e) => handleChange('showControls', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Controls</span>
            </label>
          </div>
        </div>
      )}
      
      {block.type === 'ai-agent' && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Chat Options</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={block.data.chatEnabled !== false}
                onChange={(e) => handleChange('chatEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable Chat</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Message
              </label>
              <input
                type="text"
                value={block.data.initialMessage || ''}
                onChange={(e) => handleChange('initialMessage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hello! How can I help you today?"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}