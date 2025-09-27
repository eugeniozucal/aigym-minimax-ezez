import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Block } from '@/types/pageBuilder'

interface ListEditorProps {
  block: Block
  onUpdate: (block: Block) => void
}

export function ListEditor({ block, onUpdate }: ListEditorProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        [field]: value
      }
    })
  }
  
  const addItem = () => {
    const items = block.data.items || []
    handleChange('items', [...items, 'New list item'])
  }
  
  const removeItem = (index: number) => {
    const items = block.data.items || []
    handleChange('items', items.filter((_: any, i: number) => i !== index))
  }
  
  const updateItem = (index: number, value: string) => {
    const items = [...(block.data.items || [])]
    items[index] = value
    handleChange('items', items)
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-medium text-gray-900 mb-4">List Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          List Type
        </label>
        <select
          value={block.data.type || 'bulleted'}
          onChange={(e) => handleChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="bulleted">Bulleted List</option>
          <option value="numbered">Numbered List</option>
          <option value="checklist">Checklist</option>
        </select>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            List Items
          </label>
          <button
            onClick={addItem}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <Plus className="h-3 w-3" />
            <span>Add Item</span>
          </button>
        </div>
        
        <div className="space-y-2">
          {(block.data.items || ['List item 1']).map((item: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="List item..."
              />
              <button
                onClick={() => removeItem(index)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={block.data.interactive || false}
            onChange={(e) => handleChange('interactive', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Make Interactive (for checklists)</span>
        </label>
      </div>
    </div>
  )
}