import React from 'react'
import { Block } from '@/types/pageBuilder'

interface RichTextEditorProps {
  block: Block
  onUpdate: (block: Block) => void
}

export function RichTextEditor({ block, onUpdate }: RichTextEditorProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        [field]: value
      }
    })
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-medium text-gray-900 mb-4">Rich Text Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          rows={6}
          value={block.data.content || ''}
          onChange={(e) => handleChange('content', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your text content..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alignment
        </label>
        <select
          value={block.data.alignment || 'left'}
          onChange={(e) => handleChange('alignment', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Formatting Options</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.allowBold || false}
              onChange={(e) => handleChange('allowBold', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow Bold Text</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.allowItalic || false}
              onChange={(e) => handleChange('allowItalic', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow Italic Text</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.allowLinks || false}
              onChange={(e) => handleChange('allowLinks', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow Links</span>
          </label>
        </div>
      </div>
    </div>
  )
}