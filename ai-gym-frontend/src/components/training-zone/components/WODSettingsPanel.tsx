import React from 'react'
import { PageData } from '@/types/pageBuilder'

interface WODSettingsPanelProps {
  wodData: PageData
  onUpdate: (data: PageData) => void
}

export function WODSettingsPanel({ wodData, onUpdate }: WODSettingsPanelProps) {
  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingsField = field.replace('settings.', '')
      onUpdate({
        ...wodData,
        settings: {
          ...wodData.settings,
          [settingsField]: value
        }
      })
    } else {
      onUpdate({
        ...wodData,
        [field]: value
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Settings</h2>
        <p className="text-sm text-gray-600 mb-6">
          Configure your content metadata and targeting
        </p>
      </div>
      
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={wodData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter content title..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={wodData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter content description..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={wodData.status}
            onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      
      {/* Community Targeting */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h3 className="font-medium text-gray-900">Community Targeting</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Communities
          </label>
          <div className="space-y-2">
            <button className="w-full p-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-600">+ Select Communities</span>
            </button>
            {wodData.settings.communities.map((communityId, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-900">Community {index + 1}</span>
                <button 
                  onClick={() => {
                    const newCommunities = wodData.settings.communities.filter((_, i) => i !== index)
                    handleInputChange('settings.communities', newCommunities)
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* WOD Configuration */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h3 className="font-medium text-gray-900">Content Configuration</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty Level
          </label>
          <select
            value={wodData.settings.difficulty}
            onChange={(e) => handleInputChange('settings.difficulty', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 - Beginner</option>
            <option value={2}>2 - Easy</option>
            <option value={3}>3 - Intermediate</option>
            <option value={4}>4 - Advanced</option>
            <option value={5}>5 - Expert</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="300"
            value={wodData.settings.estimatedDuration}
            onChange={(e) => handleInputChange('settings.estimatedDuration', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoSave"
            checked={wodData.settings.autoSaveEnabled}
            onChange={(e) => handleInputChange('settings.autoSaveEnabled', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoSave" className="text-sm font-medium text-gray-700">
            Enable Auto-save
          </label>
        </div>
      </div>
    </div>
  )
}