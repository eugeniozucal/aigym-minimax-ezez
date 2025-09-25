import React from 'react'
import { X, Settings as SettingsIcon } from 'lucide-react'
import { Block } from '@/types/pageBuilder'
import { SectionHeaderEditor } from './block-editors/SectionHeaderEditor'
import { RichTextEditor } from './block-editors/RichTextEditor'
import { ListEditor } from './block-editors/ListEditor'
import { QuoteEditor } from './block-editors/QuoteEditor'
import { QuizEditor } from './block-editors/QuizEditor'
import { ContentBlockEditor } from './block-editors/ContentBlockEditor'

interface RightBlockEditorProps {
  block: Block
  onBlockUpdate: (block: Block) => void
  onClose: () => void
  onOpenRepository?: (contentType: string) => void
}

export function RightBlockEditor({ block, onBlockUpdate, onClose, onOpenRepository }: RightBlockEditorProps) {
  
  const renderEditor = () => {
    switch (block.type) {
      case 'section-header':
        return (
          <SectionHeaderEditor
            block={block}
            onUpdate={onBlockUpdate}
          />
        )
        
      case 'rich-text':
        return (
          <RichTextEditor
            block={block}
            onUpdate={onBlockUpdate}
          />
        )
        
      case 'list':
        return (
          <ListEditor
            block={block}
            onUpdate={onBlockUpdate}
          />
        )
        
      case 'quote':
        return (
          <QuoteEditor
            block={block}
            onUpdate={onBlockUpdate}
          />
        )
        
      case 'quiz':
        return (
          <QuizEditor
            block={block}
            onUpdate={onBlockUpdate}
          />
        )
        
      case 'video':
      case 'ai-agent':
      case 'document':
      case 'prompts':
      case 'automation':
      case 'image':
      case 'pdf':
        return (
          <ContentBlockEditor
            block={block}
            onUpdate={onBlockUpdate}
            onOpenRepository={onOpenRepository}
          />
        )
        
      case 'division':
        return (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Division Settings</h3>
            <p className="text-sm text-gray-600">
              Division blocks create visual separators in your content.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select 
                value={block.data.style || 'line'}
                onChange={(e) => onBlockUpdate({
                  ...block,
                  data: { ...block.data, style: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="line">Line</option>
                <option value="dots">Dots</option>
                <option value="space">Space</option>
              </select>
            </div>
          </div>
        )
        
      case 'image-upload':
        return (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Image Upload Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={block.data.alt || ''}
                  onChange={(e) => onBlockUpdate({
                    ...block,
                    data: { ...block.data, alt: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the image..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <input
                  type="text"
                  value={block.data.caption || ''}
                  onChange={(e) => onBlockUpdate({
                    ...block,
                    data: { ...block.data, caption: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Image caption..."
                />
              </div>
            </div>
          </div>
        )
        
      default:
        return (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">
              {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block
            </h3>
            <p className="text-sm text-gray-600">
              Editor for this block type is not yet implemented.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="w-80 bg-gray-100 border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="h-4 w-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Block Editor</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        {renderEditor()}
      </div>
    </div>
  )
}