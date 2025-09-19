import React from 'react'
import { Block } from '../../WODBuilder'

interface SectionHeaderEditorProps {
  block: Block
  onUpdate: (block: Block) => void
}

export function SectionHeaderEditor({ block, onUpdate }: SectionHeaderEditorProps) {
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
      <h3 className="font-medium text-gray-900 mb-4">Section Header Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Header Text
        </label>
        <input
          type="text"
          value={block.data.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter section title..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Heading Level
        </label>
        <select
          value={block.data.level || 'h2'}
          onChange={(e) => handleChange('level', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="h1">H1 - Main Title</option>
          <option value="h2">H2 - Section Title</option>
          <option value="h3">H3 - Subsection</option>
          <option value="h4">H4 - Small Header</option>
          <option value="h5">H5 - Minor Header</option>
          <option value="h6">H6 - Tiny Header</option>
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
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <select
          value={block.data.color || 'default'}
          onChange={(e) => handleChange('color', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="default">Default</option>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
        </select>
      </div>
    </div>
  )
}