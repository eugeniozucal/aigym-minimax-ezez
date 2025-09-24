import React from 'react'
import { ChevronUp, ChevronDown, Settings, Trash2 } from 'lucide-react'
import { Block } from '../WODBuilder'

interface BlockRendererProps {
  block: Block
  isSelected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function BlockRenderer({
  block,
  isSelected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onMoveUp,
  onMoveDown
}: BlockRendererProps) {
  
  const renderBlockContent = () => {
    switch (block.type) {
      case 'section-header':
        return (
          <div className="text-center">
            <h2 className={`font-bold ${
              block.data.level === 'h1' ? 'text-3xl' :
              block.data.level === 'h2' ? 'text-2xl' :
              block.data.level === 'h3' ? 'text-xl' :
              block.data.level === 'h4' ? 'text-lg' :
              block.data.level === 'h5' ? 'text-base' : 'text-sm'
            }`}>
              {block.data.text || 'Section Title'}
            </h2>
          </div>
        )
        
      case 'rich-text':
        return (
          <div className="prose max-w-none">
            <p>{block.data.content || 'Enter your text here...'}</p>
          </div>
        )
        
      case 'list':
        return (
          <div>
            <ul className="list-disc list-inside space-y-1">
              {(block.data.items || ['List item 1']).map((item: string, index: number) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        )
        
      case 'division':
        return (
          <div className="flex justify-center py-4">
            <div className="w-24 h-px bg-gray-300"></div>
          </div>
        )
        
      case 'quote':
        return (
          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
            <p>"{block.data.text || 'Quote text'}"</p>
            {block.data.author && (
              <cite className="block mt-2 text-sm text-gray-500">— {block.data.author}</cite>
            )}
          </blockquote>
        )
        
      case 'quiz':
        return (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{block.data.title || 'Quiz Title'}</h3>
            <p className="text-gray-600 text-sm">
              {block.data.questions?.length || 0} questions
            </p>
          </div>
        )
        
      case 'image-upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">📷</div>
            <p className="text-gray-600">Image upload block</p>
            {block.data.caption && (
              <p className="text-sm text-gray-500 mt-2">{block.data.caption}</p>
            )}
          </div>
        )
        
      case 'video':
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🎥</div>
            <p className="font-medium">
              {block.data.selectedContent?.title || 'Video Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select a video from repository'}
            </p>
          </div>
        )
        
      case 'ai-agent':
        return (
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🤖</div>
            <p className="font-medium">
              {block.data.selectedContent?.name || 'AI Agent Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select an AI agent from repository'}
            </p>
          </div>
        )
        
      case 'document':
        return (
          <div className="bg-green-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📚</div>
            <p className="font-medium">
              {block.data.selectedContent?.title || 'Document Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select a document from repository'}
            </p>
          </div>
        )
        
      case 'image':
        return (
          <div className="bg-purple-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="font-medium">
              {block.data.selectedContent?.title || 'Image Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select an image from repository'}
            </p>
          </div>
        )
        
      case 'pdf':
        return (
          <div className="bg-red-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium">
              {block.data.selectedContent?.title || 'PDF Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select a PDF from repository'}
            </p>
          </div>
        )
        
      case 'prompts':
        return (
          <div className="bg-yellow-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">💭</div>
            <p className="font-medium">
              {block.data.selectedContent?.title || 'Prompts Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select prompts from repository'}
            </p>
          </div>
        )
        
      case 'automation':
        return (
          <div className="bg-orange-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <p className="font-medium">
              {block.data.selectedContent?.title || 'Automation Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {block.data.selectedContent?.description || 'Select automation from repository'}
            </p>
          </div>
        )
        
      default:
        return (
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">🔧</div>
            <p>Unknown block type: {block.type}</p>
          </div>
        )
    }
  }

  return (
    <div
      className={`
        group relative border-2 rounded-lg transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
      onClick={onSelect}
    >
      {/* Block Type Badge */}
      <div className="absolute -top-3 left-4 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 capitalize">
        {block.type.replace('-', ' ')}
      </div>
      
      {/* Block Controls */}
      <div className="absolute -top-2 -right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveUp()
          }}
          disabled={!canMoveUp}
          className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Move up"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveDown()
          }}
          disabled={!canMoveDown}
          className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Move down"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      
      {/* Block Content */}
      <div className="p-6 min-h-[120px]">
        {renderBlockContent()}
      </div>
    </div>
  )
}