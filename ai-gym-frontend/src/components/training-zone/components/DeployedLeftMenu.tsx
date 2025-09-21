import React from 'react'
import { X, Type, FileText, List, Quote, Minus, Upload, Video, Bot, File, Image, FileImage } from 'lucide-react'
import { WODSettingsPanel } from './WODSettingsPanel'
import { PageData } from '@/types/pageBuilder'

interface DeployedLeftMenuProps {
  menuType: string
  onBlockAdd: (blockType: string) => void
  onClose: () => void
  wodData: PageData // Keep the prop name for compatibility
  onWodDataUpdate: (data: PageData) => void
}

export function DeployedLeftMenu({ 
  menuType, 
  onBlockAdd, 
  onClose, 
  wodData, 
  onWodDataUpdate 
}: DeployedLeftMenuProps) {
  
  const elementsBlocks = [
    { type: 'section-header', label: 'Section Header', icon: Type },
    { type: 'rich-text', label: 'Rich Text', icon: FileText },
    { type: 'list', label: 'List', icon: List },
    { type: 'division', label: 'Division', icon: Minus },
    { type: 'quiz', label: 'Quiz', icon: FileText },
    { type: 'quote', label: 'Quote', icon: Quote },
    { type: 'image-upload', label: 'Image Upload', icon: Upload }
  ]
  
  const contentBlocks = [
    { type: 'video', label: 'Video', icon: Video },
    { type: 'ai-agent', label: 'AI Agent', icon: Bot },
    { type: 'document', label: 'Document', icon: File },
    { type: 'prompt', label: 'Prompts', icon: FileText },
    { type: 'automation', label: 'Automation', icon: FileText },
    { type: 'image', label: 'Image', icon: Image },
    { type: 'pdf', label: 'PDF', icon: FileImage }
  ]

  const renderContent = () => {
    switch (menuType) {
      case 'settings':
        return (
          <WODSettingsPanel
            wodData={wodData}
            onUpdate={onWodDataUpdate}
          />
        )
        
      case 'elements':
        return (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Elements</h2>
            <p className="text-sm text-gray-600 mb-6">
              Basic building blocks for your content
            </p>
            
            <div className="space-y-2">
              {elementsBlocks.map((block) => {
                const Icon = block.icon
                return (
                  <button
                    key={block.type}
                    onClick={() => onBlockAdd(block.type)}
                    className="
                      w-full flex items-center space-x-3 p-3 text-left
                      border border-gray-200 rounded-lg
                      hover:bg-gray-50 hover:border-gray-300
                      transition-all duration-200
                    "
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{block.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
        
      case 'content':
        return (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
            <p className="text-sm text-gray-600 mb-6">
              Select content from your repository
            </p>
            
            <div className="space-y-2">
              {contentBlocks.map((block) => {
                const Icon = block.icon
                return (
                  <button
                    key={block.type}
                    onClick={() => onBlockAdd(block.type)}
                    className="
                      w-full flex items-center space-x-3 p-3 text-left
                      border border-gray-200 rounded-lg
                      hover:bg-gray-50 hover:border-gray-300
                      transition-all duration-200
                    "
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Icon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">{block.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
        
      case 'pages':
        return (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pages</h2>
            <p className="text-sm text-gray-600 mb-6">
              Manage your content pages
            </p>
            
            <div className="space-y-4">
              <button className="
                w-full p-3 text-left border border-gray-200 rounded-lg
                hover:bg-gray-50 hover:border-gray-300
                transition-all duration-200
              ">
                <div className="font-medium text-gray-900">Create New Page</div>
                <div className="text-sm text-gray-600">Add a new page to this content</div>
              </button>
              
              <button className="
                w-full p-3 text-left border border-gray-200 rounded-lg
                hover:bg-gray-50 hover:border-gray-300
                transition-all duration-200
              ">
                <div className="font-medium text-gray-900">Rename Pages</div>
                <div className="text-sm text-gray-600">Edit page titles</div>
              </button>
              
              <button className="
                w-full p-3 text-left border border-gray-200 rounded-lg
                hover:bg-gray-50 hover:border-gray-300
                transition-all duration-200
              ">
                <div className="font-medium text-gray-900">Reorganize Pages</div>
                <div className="text-sm text-gray-600">Change page order</div>
              </button>
            </div>
          </div>
        )
        
      default:
        return <div className="p-6">Menu content not implemented</div>
    }
  }

  return (
    <div className="w-80 bg-gray-100 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 capitalize">{menuType}</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}