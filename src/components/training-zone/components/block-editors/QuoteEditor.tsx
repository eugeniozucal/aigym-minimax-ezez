import React from 'react'
import { Block } from '@/types/pageBuilder'

interface QuoteEditorProps {
  block: Block
  onUpdate: (block: Block) => void
}

export function QuoteEditor({ block, onUpdate }: QuoteEditorProps) {
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
      <h3 className="font-medium text-gray-900 mb-4">Quote Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quote Text
        </label>
        <textarea
          rows={4}
          value={block.data.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter quote text..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Author
        </label>
        <input
          type="text"
          value={block.data.author || ''}
          onChange={(e) => handleChange('author', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Quote author..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Style
        </label>
        <select
          value={block.data.style || 'default'}
          onChange={(e) => handleChange('style', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="default">Default</option>
          <option value="emphasized">Emphasized</option>
          <option value="minimal">Minimal</option>
        </select>
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
        </select>
      </div>
    </div>
  )
}