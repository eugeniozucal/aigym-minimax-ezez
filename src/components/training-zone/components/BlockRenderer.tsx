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
  onDelete?: () => void
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
  onDelete,
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
        const agentContent = block.data.selectedContent
        
        if (isPreview && agentContent?.ai_agent?.system_prompt) {
          // In preview mode, show agent interface
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{agentContent.ai_agent.agent_name || agentContent.title}</h3>
                {agentContent.ai_agent.short_description && (
                  <p className="text-gray-600 mt-2">{agentContent.ai_agent.short_description}</p>
                )}
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    AI
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">AI Agent Ready</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      This AI agent is configured and ready to assist. In a real training environment, 
                      you would be able to interact with it directly.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">System Prompt Preview:</p>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {agentContent.ai_agent.system_prompt.substring(0, 200)}
                        {agentContent.ai_agent.system_prompt.length > 200 ? '...' : ''}
                      </p>
                    </div>
                    {agentContent.ai_agent.test_conversations && agentContent.ai_agent.test_conversations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">
                          {agentContent.ai_agent.test_conversations.length} test conversation(s) available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        // Editor mode or no agent selected
        return (
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🤖</div>
            <p className="font-medium">
              {agentContent?.ai_agent?.agent_name || agentContent?.title || 'AI Agent Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {agentContent?.ai_agent?.short_description || agentContent?.description || 'Select an AI agent from repository'}
            </p>
            {agentContent?.ai_agent?.test_conversations && (
              <p className="text-xs text-gray-500 mt-1">
                {agentContent.ai_agent.test_conversations.length} test conversation(s)
              </p>
            )}
          </div>
        )
        
      case 'document':
        const documentContent = block.data.selectedContent
        
        // Check multiple possible data structure paths for document content
        const getDocumentContent = () => {
          if (!documentContent) return null
          
          // Try different possible paths for document content
          return (
            documentContent.document?.content_html ||  // Original expected path
            documentContent.content_html ||            // Direct content_html
            documentContent.content ||                 // Plain content field
            documentContent.text ||                    // Plain text field
            documentContent.description ||             // Description as content
            documentContent.document?.content ||       // Nested content
            documentContent.document?.text ||          // Nested text
            null
          )
        }
        
        const documentHtmlContent = getDocumentContent()
        
        if (isPreview && documentHtmlContent) {
          // In preview mode, show actual document content
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{documentContent?.title || 'Document'}</h3>
                {documentContent?.description && (
                  <p className="text-gray-600 mt-2">{documentContent.description}</p>
                )}
                {documentContent?.document?.word_count && (
                  <p className="text-sm text-gray-500 mt-1">
                    {documentContent.document.word_count} words • {documentContent.document.reading_time_minutes} min read
                  </p>
                )}
              </div>
              <div className="prose max-w-none">
                {/* Handle both HTML content and plain text */}
                {documentHtmlContent.includes('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: documentHtmlContent }} />
                ) : (
                  <div className="whitespace-pre-wrap">{documentHtmlContent}</div>
                )}
              </div>
            </div>
          )
        }
        
        // Editor mode or no document selected
        return (
          <div className="bg-green-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📚</div>
            <p className="font-medium">
              {documentContent?.title || 'Document Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {documentContent?.description || 'Select a document from repository'}
            </p>
            {documentContent?.document?.word_count && (
              <p className="text-xs text-gray-500 mt-1">
                {documentContent.document.word_count} words • {documentContent.document.reading_time_minutes} min read
              </p>
            )}
          </div>
        )
        
        // Editor mode or no document selected
        return (
          <div className="bg-green-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📚</div>
            <p className="font-medium">
              {documentContent?.title || 'Document Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {documentContent?.description || 'Select a document from repository'}
            </p>
            {documentContent?.document?.word_count && (
              <p className="text-xs text-gray-500 mt-1">
                {documentContent.document.word_count} words • {documentContent.document.reading_time_minutes} min read
              </p>
            )}
          </div>
        )
        
      case 'image':
        const imageContent = block.data.selectedContent
        
        if (isPreview && imageContent?.image?.image_url) {
          // In preview mode, show actual image
          return (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{imageContent.title}</h3>
                {imageContent.description && (
                  <p className="text-gray-600 mt-2">{imageContent.description}</p>
                )}
              </div>
              <div className="flex justify-center">
                <img 
                  src={imageContent.image.image_url}
                  alt={imageContent.image.alt_text || imageContent.title}
                  className="max-w-full h-auto rounded-lg shadow-md"
                  style={{
                    maxHeight: imageContent.image.height && imageContent.image.height > 600 ? '600px' : 'auto'
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
                <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ display: 'none' }}>
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-gray-600">Failed to load image</p>
                </div>
              </div>
              {imageContent.image.alt_text && (
                <p className="text-sm text-gray-500 text-center italic">{imageContent.image.alt_text}</p>
              )}
              {(imageContent.image.width || imageContent.image.height || imageContent.image.file_size) && (
                <div className="text-xs text-gray-400 text-center space-x-4">
                  {imageContent.image.width && imageContent.image.height && (
                    <span>{imageContent.image.width} × {imageContent.image.height}px</span>
                  )}
                  {imageContent.image.file_size && (
                    <span>{Math.round(imageContent.image.file_size / 1024)} KB</span>
                  )}
                </div>
              )}
            </div>
          )
        }
        
        // Editor mode or no image selected
        return (
          <div className="bg-purple-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="font-medium">
              {imageContent?.title || 'Image Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {imageContent?.description || 'Select an image from repository'}
            </p>
            {imageContent?.image && (
              <div className="text-xs text-gray-500 mt-1 space-x-4">
                {imageContent.image.width && imageContent.image.height && (
                  <span>{imageContent.image.width} × {imageContent.image.height}px</span>
                )}
                {imageContent.image.file_size && (
                  <span>{Math.round(imageContent.image.file_size / 1024)} KB</span>
                )}
              </div>
            )}
          </div>
        )
        
      case 'pdf':
        const pdfContent = block.data.selectedContent
        
        if (isPreview && pdfContent?.pdf?.pdf_url) {
          // In preview mode, show embedded PDF viewer
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{pdfContent.title}</h3>
                {pdfContent.description && (
                  <p className="text-gray-600 mt-2">{pdfContent.description}</p>
                )}
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mt-2">
                  {pdfContent.pdf.page_count && (
                    <span>{pdfContent.pdf.page_count} pages</span>
                  )}
                  {pdfContent.pdf.file_size && (
                    <span>{Math.round(pdfContent.pdf.file_size / (1024 * 1024))} MB</span>
                  )}
                  <a 
                    href={pdfContent.pdf.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
              <div className="w-full">
                <iframe
                  src={`${pdfContent.pdf.pdf_url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-96 border border-gray-300 rounded-lg"
                  title={pdfContent.title}
                  onError={() => {
                    // If iframe fails, show fallback
                    console.log('PDF iframe failed to load')
                  }}
                />
              </div>
            </div>
          )
        }
        
        // Editor mode or no PDF selected
        return (
          <div className="bg-red-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium">
              {pdfContent?.title || 'PDF Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {pdfContent?.description || 'Select a PDF from repository'}
            </p>
            {pdfContent?.pdf && (
              <div className="text-xs text-gray-500 mt-1 space-x-4">
                {pdfContent.pdf.page_count && (
                  <span>{pdfContent.pdf.page_count} pages</span>
                )}
                {pdfContent.pdf.file_size && (
                  <span>{Math.round(pdfContent.pdf.file_size / (1024 * 1024))} MB</span>
                )}
              </div>
            )}
          </div>
        )
        
      case 'prompts':
        const promptContent = block.data.selectedContent
        
        if (isPreview && promptContent?.prompt?.prompt_text) {
          // In preview mode, show actual prompt content
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{promptContent.title}</h3>
                {promptContent.description && (
                  <p className="text-gray-600 mt-2">{promptContent.description}</p>
                )}
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mt-2">
                  {promptContent.prompt.prompt_category && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      {promptContent.prompt.prompt_category}
                    </span>
                  )}
                  {promptContent.prompt.usage_count > 0 && (
                    <span>Used {promptContent.prompt.usage_count} times</span>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl">
                    💭
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-3">Prompt Template</h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                        {promptContent.prompt.prompt_text}
                      </pre>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {promptContent.prompt.prompt_text.length} characters
                      </p>
                      <button className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors">
                        Copy Prompt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        // Editor mode or no prompt selected
        return (
          <div className="bg-yellow-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">💭</div>
            <p className="font-medium">
              {promptContent?.title || 'Prompts Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {promptContent?.description || 'Select prompts from repository'}
            </p>
            {promptContent?.prompt && (
              <div className="text-xs text-gray-500 mt-1 space-x-4">
                {promptContent.prompt.prompt_category && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {promptContent.prompt.prompt_category}
                  </span>
                )}
                {promptContent.prompt.usage_count > 0 && (
                  <span>Used {promptContent.prompt.usage_count} times</span>
                )}
              </div>
            )}
          </div>
        )
        
      case 'automation':
        const automationContent = block.data.selectedContent
        
        if (isPreview && automationContent?.automation?.automation_url) {
          // In preview mode, show automation details and interface
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{automationContent.title}</h3>
                {automationContent.description && (
                  <p className="text-gray-600 mt-2">{automationContent.description}</p>
                )}
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                    ⚡
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-3">Automation Workflow</h4>
                    
                    {automationContent.automation.tool_description && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Description</h5>
                        <p className="text-sm text-gray-600">{automationContent.automation.tool_description}</p>
                      </div>
                    )}
                    
                    {automationContent.automation.required_tools && automationContent.automation.required_tools.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Required Tools</h5>
                        <div className="flex flex-wrap gap-2">
                          {automationContent.automation.required_tools.map((tool: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {automationContent.automation.setup_instructions && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Setup Instructions</h5>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap">
                          {automationContent.automation.setup_instructions}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        Automation ready to deploy
                      </p>
                      <a 
                        href={automationContent.automation.automation_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                      >
                        Open Automation
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        // Editor mode or no automation selected
        return (
          <div className="bg-orange-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <p className="font-medium">
              {automationContent?.title || 'Automation Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {automationContent?.description || 'Select automation from repository'}
            </p>
            {automationContent?.automation?.required_tools && automationContent.automation.required_tools.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                <p>Required tools:</p>
                <div className="flex justify-center flex-wrap gap-1 mt-1">
                  {automationContent.automation.required_tools.map((tool: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
        
      case 'wods':
        const wodContent = block.data.selectedContent
        
        if (isPreview && wodContent?.wod) {
          // In preview mode, show actual WOD content
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{wodContent.title}</h3>
                {wodContent.description && (
                  <p className="text-gray-600 mt-2">{wodContent.description}</p>
                )}
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mt-2">
                  {wodContent.wod.duration_minutes && (
                    <span>{wodContent.wod.duration_minutes} min</span>
                  )}
                  {wodContent.wod.difficulty_level && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      {wodContent.wod.difficulty_level} difficulty
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                    💪
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-3">Workout of the Day</h4>
                    
                    {wodContent.wod.instructions && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Instructions</h5>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap">
                          {wodContent.wod.instructions}
                        </div>
                      </div>
                    )}
                    
                    {wodContent.wod.target_muscle_groups && wodContent.wod.target_muscle_groups.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Target Muscle Groups</h5>
                        <div className="flex flex-wrap gap-2">
                          {wodContent.wod.target_muscle_groups.map((group: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {wodContent.wod.equipment_needed && wodContent.wod.equipment_needed.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Equipment Needed</h5>
                        <div className="flex flex-wrap gap-2">
                          {wodContent.wod.equipment_needed.map((equipment: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              {equipment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {wodContent.wod.notes && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Notes</h5>
                        <p className="text-sm text-gray-600">{wodContent.wod.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        // Editor mode or no WOD selected
        return (
          <div className="bg-orange-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">💪</div>
            <p className="font-medium">
              {wodContent?.title || 'WOD Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {wodContent?.description || 'Select a WOD from repository'}
            </p>
            {wodContent?.wod && (
              <div className="text-xs text-gray-500 mt-2 space-x-4">
                {wodContent.wod.duration_minutes && (
                  <span>{wodContent.wod.duration_minutes} min</span>
                )}
                {wodContent.wod.difficulty_level && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    {wodContent.wod.difficulty_level} difficulty
                  </span>
                )}
              </div>
            )}
          </div>
        )
        
      case 'blocks':
        const blockContent = block.data.selectedContent
        
        if (isPreview && blockContent?.block) {
          // In preview mode, show actual BLOCK content
          return (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold">{blockContent.title}</h3>
                {blockContent.description && (
                  <p className="text-gray-600 mt-2">{blockContent.description}</p>
                )}
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 mt-2">
                  {blockContent.block.duration_minutes && (
                    <span>{blockContent.block.duration_minutes} min</span>
                  )}
                  {blockContent.block.intensity_level && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {blockContent.block.intensity_level} intensity
                    </span>
                  )}
                  {blockContent.block.block_type && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {blockContent.block.block_type}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                    🏗️
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-3">Training Block</h4>
                    
                    {blockContent.block.instructions && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Instructions</h5>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap">
                          {blockContent.block.instructions}
                        </div>
                      </div>
                    )}
                    
                    {blockContent.block.target_area && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Target Area</h5>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {blockContent.block.target_area}
                        </span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {blockContent.block.repetitions > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h5 className="font-medium text-sm text-gray-900 mb-1">Repetitions</h5>
                          <p className="text-lg font-bold text-blue-600">{blockContent.block.repetitions}</p>
                        </div>
                      )}
                      
                      {blockContent.block.rest_periods > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h5 className="font-medium text-sm text-gray-900 mb-1">Rest Period</h5>
                          <p className="text-lg font-bold text-blue-600">{blockContent.block.rest_periods}s</p>
                        </div>
                      )}
                      
                      {blockContent.block.intensity_level && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h5 className="font-medium text-sm text-gray-900 mb-1">Intensity</h5>
                          <p className="text-lg font-bold text-blue-600">{blockContent.block.intensity_level}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        // Editor mode or no BLOCK selected
        return (
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🏗️</div>
            <p className="font-medium">
              {blockContent?.title || 'Training Block'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {blockContent?.description || 'Select a training block from repository'}
            </p>
            {blockContent?.block && (
              <div className="text-xs text-gray-500 mt-2 space-x-4">
                {blockContent.block.duration_minutes && (
                  <span>{blockContent.block.duration_minutes} min</span>
                )}
                {blockContent.block.intensity_level && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {blockContent.block.intensity_level} intensity
                  </span>
                )}
              </div>
            )}
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
        
        {/* Individual Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Are you sure you want to delete this ${block.type.replace('-', ' ')} block?`)) {
                onDelete()
              }
            }}
            className="w-6 h-6 bg-white border border-red-300 rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-400 text-red-600 hover:text-red-700 transition-colors"
            title="Delete block"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {/* Block Content */}
      <div className="p-6 min-h-[120px]">
        {renderBlockContent()}
      </div>
    </div>
  )
}