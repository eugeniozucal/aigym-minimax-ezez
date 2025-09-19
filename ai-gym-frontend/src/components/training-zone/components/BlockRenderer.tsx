import React from 'react'
import { ChevronUp, ChevronDown, Settings, Trash2 } from 'lucide-react'
import { Block } from '@/types/pageBuilder'

interface BlockRendererProps {
  block: Block
  isSelected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isPreview?: boolean
}

export function BlockRenderer({
  block,
  isSelected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onMoveUp,
  onMoveDown,
  isPreview = false
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
        const videoContent = block.data.selectedContent
        
        if (isPreview && videoContent?.video?.video_url) {
          // In preview mode, show embedded video if available
          const videoUrl = videoContent.video.video_url
          const platform = videoContent.video.video_platform?.toLowerCase()
          const videoId = videoContent.video.video_id
          
          // Enhanced video rendering with platform support
          const renderVideo = () => {
            // YouTube videos
            if (platform === 'youtube' && videoId) {
              return (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    className="w-full h-full rounded-lg border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={videoContent.title}
                    loading="lazy"
                  />
                </div>
              )
            }
            
            // Vimeo videos
            if (platform === 'vimeo' && videoId) {
              return (
                <div className="aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${videoId}?h=0&badge=0&autopause=0&player_id=0&app_id=58479`}
                    className="w-full h-full rounded-lg border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={videoContent.title}
                    loading="lazy"
                  />
                </div>
              )
            }
            
            // Direct video URLs (MP4, WebM, etc.)
            if (videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.ogg'))) {
              return (
                <div className="aspect-video">
                  <video 
                    controls 
                    className="w-full h-full rounded-lg object-cover"
                    src={videoUrl}
                    poster={videoContent.video.thumbnail_url}
                  >
                    <source src={videoUrl} type={`video/${videoUrl.split('.').pop()}`} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )
            }
            
            // Fallback for other video URLs
            return (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <p className="text-gray-600">Video format not supported for preview</p>
                  <a 
                    href={videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm mt-2 block"
                  >
                    Open video in new tab
                  </a>
                </div>
              </div>
            )
          }
          
          return (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{videoContent.title}</h3>
                {videoContent.description && (
                  <p className="text-gray-600 mt-2">{videoContent.description}</p>
                )}
                {videoContent.video.duration_seconds && (
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {Math.floor(videoContent.video.duration_seconds / 60)}:{(videoContent.video.duration_seconds % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>
              {renderVideo()}
            </div>
          )
        }
        
        // Editor mode or no video selected
        const getThumbnailUrl = () => {
          if (videoContent?.video?.thumbnail_url) {
            return videoContent.video.thumbnail_url
          }
          
          // Generate YouTube thumbnail if available
          if (videoContent?.video?.video_platform === 'youtube' && videoContent?.video?.video_id) {
            return `https://img.youtube.com/vi/${videoContent.video.video_id}/mqdefault.jpg`
          }
          
          // Generate Vimeo thumbnail (would need API call, so we'll skip for now)
          return null
        }
        
        const thumbnailUrl = getThumbnailUrl()
        
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🎥</div>
            <p className="font-medium">
              {videoContent?.title || 'Video Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {videoContent?.description || 'Select a video from repository'}
            </p>
            {videoContent?.video?.video_platform && (
              <p className="text-xs text-gray-500 mt-1 capitalize">
                Platform: {videoContent.video.video_platform}
              </p>
            )}
            {videoContent?.video?.duration_seconds && (
              <p className="text-xs text-gray-500">
                Duration: {Math.floor(videoContent.video.duration_seconds / 60)}:{(videoContent.video.duration_seconds % 60).toString().padStart(2, '0')}
              </p>
            )}
            {thumbnailUrl && (
              <div className="mt-4">
                <img 
                  src={thumbnailUrl} 
                  alt={videoContent.title}
                  className="w-40 h-24 object-cover rounded mx-auto shadow-sm"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
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

  if (isPreview) {
    // Preview mode - clean rendering without controls
    return (
      <div className="bg-white rounded-lg">
        {renderBlockContent()}
      </div>
    )
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