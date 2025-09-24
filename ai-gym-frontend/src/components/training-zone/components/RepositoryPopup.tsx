import React, { useState, useEffect } from 'react'
import { X, Search, Grid, List, Filter, Play, Calendar } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'

interface RepositoryPopupProps {
  contentType: string
  onContentSelect: (content: any) => void
  onClose: () => void
}

interface ContentItem {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  content_type: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
  // Video-specific fields when joined
  video?: {
    id: string
    video_url: string
    video_platform?: string
    video_id?: string
    duration_seconds?: number
    transcription?: string
    auto_title?: string
    auto_description?: string
  }
  // Document-specific fields when joined
  document?: {
    id: string
    content_html: string
    content_json?: any
    word_count?: number
    reading_time_minutes?: number
  }
  // Prompt-specific fields when joined
  prompt?: {
    id: string
    prompt_text: string
    prompt_category?: string
    usage_count?: number
    last_copied_at?: string
  }
  // Automation-specific fields when joined
  automation?: {
    id: string
    automation_url: string
    required_tools?: string[]
    tool_description?: string
    setup_instructions?: string
  }
  // AI Agent-specific fields when joined
  ai_agent?: {
    id: string
    agent_name: string
    short_description?: string
    system_prompt?: string
  }
  // Image-specific fields when joined
  image?: {
    id: string
    image_url: string
    alt_text?: string
    width?: number
    height?: number
    file_size?: number
  }
  // PDF-specific fields when joined
  pdf?: {
    id: string
    pdf_url: string
    file_size?: number
    page_count?: number
    thumbnail_url?: string
  }
  // WOD-specific fields when joined
  wod?: {
    id: string
    duration_minutes?: number
    difficulty_level?: string
    target_muscle_groups?: string[]
    equipment_needed?: string[]
    instructions?: string
    notes?: string
  }
  // BLOCK-specific fields when joined
  block?: {
    id: string
    block_type?: string
    duration_minutes?: number
    intensity_level?: string
    target_area?: string
    instructions?: string
    rest_periods?: number
    repetitions?: number
  }
}

export function RepositoryPopup({ contentType, onContentSelect, onClose }: RepositoryPopupProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPublishedOnly, setShowPublishedOnly] = useState(false)
  
  useEffect(() => {
    loadContent()
  }, [contentType, showPublishedOnly])
  
  // Add video thumbnail generation utility
  const generateVideoThumbnail = (video: ContentItem['video']) => {
    if (!video) return null
    
    // Generate thumbnail URL based on video platform
    if (video.video_platform === 'youtube' && video.video_id) {
      return `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`
    }
    
    if (video.video_platform === 'vimeo' && video.video_id) {
      // For Vimeo, we'll use a placeholder since getting thumbnails requires API call
      return `https://vumbnail.com/${video.video_id}.jpg`
    }
    
    // Default video placeholder
    return null
  }
  
  // Format duration in seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const loadContent = async () => {
    setLoading(true)
    setError(null)
    try {
      let transformedContent: ContentItem[] = []
      
      if (contentType === 'video') {
        // Fetch videos with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            videos (
              id,
              video_url,
              video_platform,
              video_id,
              duration_seconds,
              transcription,
              auto_title,
              auto_description
            )
          `)
          .eq('content_type', 'video')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching videos:', error)
          throw new Error('Failed to load videos from database')
        }
        
        // Transform the data and generate thumbnails
        transformedContent = (data || []).map(item => {
          const videoData = Array.isArray(item.videos) ? item.videos[0] : item.videos
          const thumbnailUrl = item.thumbnail_url || generateVideoThumbnail(videoData)
          
          return {
            ...item,
            video: videoData,
            thumbnail_url: thumbnailUrl,
            description: item.description || videoData?.auto_description || 'No description available'
          }
        })
      
      } else if (contentType === 'document') {
        // Fetch documents with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            documents (
              id,
              content_html,
              content_json,
              word_count,
              reading_time_minutes
            )
          `)
          .eq('content_type', 'document')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching documents:', error)
          throw new Error('Failed to load documents from database')
        }
        
        // Transform the data
        transformedContent = (data || []).map(item => {
          const documentData = Array.isArray(item.documents) ? item.documents[0] : item.documents
          
          return {
            ...item,
            document: documentData,
            description: item.description || `${documentData?.word_count || 0} words, ${documentData?.reading_time_minutes || 0} min read` || 'No description available'
          }
        })
      
      } else if (contentType === 'prompt') {
        // Fetch prompts with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            prompts (
              id,
              prompt_text,
              prompt_category,
              usage_count,
              last_copied_at
            )
          `)
          .eq('content_type', 'prompt')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching prompts:', error)
          throw new Error('Failed to load prompts from database')
        }
        
        // Transform the data
        transformedContent = (data || []).map(item => {
          const promptData = Array.isArray(item.prompts) ? item.prompts[0] : item.prompts
          
          return {
            ...item,
            prompt: promptData,
            description: item.description || `${promptData?.prompt_category || 'General'} prompt (used ${promptData?.usage_count || 0} times)` || 'No description available'
          }
        })
      
      } else if (contentType === 'automation') {
        // Fetch automations with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            automations (
              id,
              automation_url,
              required_tools,
              tool_description,
              setup_instructions
            )
          `)
          .eq('content_type', 'automation')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching automations:', error)
          throw new Error('Failed to load automations from database')
        }
        
        // Transform the data
        transformedContent = (data || []).map(item => {
          const automationData = Array.isArray(item.automations) ? item.automations[0] : item.automations
          
          return {
            ...item,
            automation: automationData,
            description: item.description || automationData?.tool_description || 'No description available'
          }
        })
      
      } else if (contentType === 'ai-agent') {
        // Fetch AI agents with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            ai_agents (
              id,
              agent_name,
              short_description,
              system_prompt
            )
          `)
          .eq('content_type', 'ai_agent')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching AI agents:', error)
          throw new Error('Failed to load AI agents from database')
        }
        
        // Transform the data
        transformedContent = (data || []).map(item => {
          const agentData = Array.isArray(item.ai_agents) ? item.ai_agents[0] : item.ai_agents
          
          return {
            ...item,
            ai_agent: agentData,
            description: item.description || agentData?.short_description || 'No description available'
          }
        })
      
      } else if (contentType === 'image') {
        // Fetch images with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            images (
              id,
              image_url,
              alt_text,
              width,
              height,
              file_size
            )
          `)
          .eq('content_type', 'image')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching images:', error)
          throw new Error('Failed to load images from database')
        }
        
        // Transform the data
        transformedContent = (data || []).map(item => {
          const imageData = Array.isArray(item.images) ? item.images[0] : item.images
          
          return {
            ...item,
            image: imageData,
            thumbnail_url: item.thumbnail_url || imageData?.image_url,
            description: item.description || `Image - ${imageData?.width && imageData?.height ? `${imageData.width}x${imageData.height}` : 'Unknown size'}` || 'No description available'
          }
        })
      
      } else if (contentType === 'pdf') {
        // Fetch PDFs with content_items data
        let query = supabase
          .from('content_items')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            pdfs (
              id,
              pdf_url,
              file_size,
              page_count,
              thumbnail_url
            )
          `)
          .eq('content_type', 'pdf')
          .order('updated_at', { ascending: false })
          .limit(50)
        
        // Conditionally add published filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching PDFs:', error)
          throw new Error('Failed to load PDFs from database')
        }
        
        // Transform the data
        transformedContent = (data || []).map(item => {
          const pdfData = Array.isArray(item.pdfs) ? item.pdfs[0] : item.pdfs
          
          return {
            ...item,
            pdf: pdfData,
            thumbnail_url: item.thumbnail_url || pdfData?.thumbnail_url,
            description: item.description || `PDF - ${pdfData?.page_count ? `${pdfData.page_count} pages` : 'Unknown pages'}${pdfData?.file_size ? `, ${Math.round(pdfData.file_size / 1024)} KB` : ''}` || 'No description available'
          }
        })
      
      } else if (contentType === 'WODs' || contentType === 'wods') {
        // WORKING PATTERN: Copy from EnhancedWodsRepository.tsx - direct wods table query
        let query = supabase
          .from('wods')
          .select('*')

        // Apply status filter (matching working pattern)
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }

        // Apply ordering (matching working pattern)
        query = query.order('updated_at', { ascending: false })
        query = query.limit(50)

        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching WODs (working pattern):', error)
          throw new Error('Failed to load WODs from database')
        }
        
        // Transform the data to match RepositoryPopup interface
        transformedContent = (data || []).map(wod => ({
          id: wod.id,
          title: wod.title,
          description: wod.description || `${wod.estimated_duration_minutes || 0} min • ${wod.difficulty_level || 'Unknown'} difficulty`,
          thumbnail_url: wod.thumbnail_url,
          content_type: 'wod',
          status: wod.status,
          created_by: wod.created_by,
          created_at: wod.created_at,
          updated_at: wod.updated_at,
          wod: {
            id: wod.id,
            duration_minutes: wod.estimated_duration_minutes,
            difficulty_level: wod.difficulty_level,
            target_muscle_groups: wod.tags || [],
            equipment_needed: [],
            instructions: wod.description,
            notes: ''
          }
        }))
      
      } else if (contentType === 'BLOCKS' || contentType === 'blocks') {
        // FIXED: Query workout_blocks table where real blocks are stored
        let query = supabase
          .from('workout_blocks')
          .select('*')

        // Apply status filter
        if (showPublishedOnly) {
          query = query.eq('status', 'published')
        }

        // Apply ordering
        query = query.order('updated_at', { ascending: false })
        query = query.limit(50)

        const { data, error } = await query
        
        if (error) {
          console.error('Error fetching BLOCKS from workout_blocks table:', error)
          throw new Error('Failed to load BLOCKS from database')
        }
        
        // Transform the data to match RepositoryPopup interface
        transformedContent = (data || []).map(block => ({
          id: block.id,
          title: block.title,
          description: block.description || `${block.estimated_duration_minutes || 0} min • ${block.difficulty_level || 'Unknown'} difficulty`,
          thumbnail_url: block.thumbnail_url,
          content_type: 'block',
          status: block.status,
          created_by: block.created_by,
          created_at: block.created_at,
          updated_at: block.updated_at,
          block: {
            id: block.id,
            block_type: 'Training',
            duration_minutes: block.estimated_duration_minutes,
            intensity_level: block.difficulty_level,
            target_area: '',
            instructions: block.description,
            rest_periods: 0,
            repetitions: 0
          }
        }))
      
      } else {
        // For other content types, fall back to the edge function
        const { data, error } = await supabase.functions.invoke('content-repository-manager', {
          body: {
            action: 'list',
            contentType: contentType + 's', // pluralize for API
            searchQuery: '',
            filters: showPublishedOnly ? { status: 'published' } : {},
            sortBy: 'updated_at',
            sortOrder: 'desc',
            limit: 50,
            offset: 0
          }
        })
        
        if (error) {
          console.error('Error fetching content:', error)
          throw new Error('Failed to load content from repository')
        }
        
        transformedContent = data?.data?.items || []
      }
      
      setContent(transformedContent)
    } catch (error) {
      console.error('Failed to load content:', error)
      setError(error instanceof Error ? error.message : 'Failed to load content')
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  
  const filteredContent = content.filter(item => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search in title and description
    const matchesBasic = item.title.toLowerCase().includes(searchLower) ||
                        item.description?.toLowerCase().includes(searchLower)
    
    // For videos, also search in video-specific fields
    if (contentType === 'video' && item.video) {
      const matchesVideo = item.video.auto_title?.toLowerCase().includes(searchLower) ||
                          item.video.auto_description?.toLowerCase().includes(searchLower) ||
                          item.video.transcription?.toLowerCase().includes(searchLower)
      return matchesBasic || matchesVideo
    }
    
    // For documents, also search in document-specific fields
    if (contentType === 'document' && item.document) {
      const matchesDocument = item.document.content_html?.toLowerCase().includes(searchLower)
      return matchesBasic || matchesDocument
    }
    
    // For prompts, also search in prompt-specific fields
    if (contentType === 'prompt' && item.prompt) {
      const matchesPrompt = item.prompt.prompt_text?.toLowerCase().includes(searchLower) ||
                           item.prompt.prompt_category?.toLowerCase().includes(searchLower)
      return matchesBasic || matchesPrompt
    }
    
    // For automations, also search in automation-specific fields
    if (contentType === 'automation' && item.automation) {
      const matchesAutomation = item.automation.tool_description?.toLowerCase().includes(searchLower) ||
                               item.automation.setup_instructions?.toLowerCase().includes(searchLower) ||
                               item.automation.required_tools?.some(tool => tool.toLowerCase().includes(searchLower))
      return matchesBasic || matchesAutomation
    }
    
    // For AI agents, also search in agent-specific fields
    if (contentType === 'ai-agent' && item.ai_agent) {
      const matchesAgent = item.ai_agent.agent_name?.toLowerCase().includes(searchLower) ||
                          item.ai_agent.short_description?.toLowerCase().includes(searchLower) ||
                          item.ai_agent.system_prompt?.toLowerCase().includes(searchLower)
      return matchesBasic || matchesAgent
    }
    
    // For images, also search in image-specific fields
    if (contentType === 'image' && item.image) {
      const dimensions = item.image.width && item.image.height ? `${item.image.width}x${item.image.height}` : ''
      const matchesImage = item.image.alt_text?.toLowerCase().includes(searchLower) ||
                          dimensions.toLowerCase().includes(searchLower)
      return matchesBasic || matchesImage
    }
    
    // For PDFs, also search in PDF-specific fields
    if (contentType === 'pdf' && item.pdf) {
      const pageInfo = item.pdf.page_count ? `${item.pdf.page_count} pages` : ''
      const sizeInfo = item.pdf.file_size ? `${Math.round(item.pdf.file_size / 1024)} KB` : ''
      const matchesPdf = pageInfo.toLowerCase().includes(searchLower) ||
                        sizeInfo.toLowerCase().includes(searchLower)
      return matchesBasic || matchesPdf
    }
    
    // For WODs, also search in WOD-specific fields
    if ((contentType === 'WODs' || contentType === 'wods') && item.wod) {
      const matchesWod = item.wod.difficulty_level?.toLowerCase().includes(searchLower) ||
                        item.wod.target_muscle_groups?.some(group => group.toLowerCase().includes(searchLower)) ||
                        item.wod.equipment_needed?.some(equipment => equipment.toLowerCase().includes(searchLower)) ||
                        item.wod.instructions?.toLowerCase().includes(searchLower) ||
                        item.wod.notes?.toLowerCase().includes(searchLower)
      return matchesBasic || matchesWod
    }
    
    // For BLOCKS, also search in BLOCK-specific fields
    if ((contentType === 'BLOCKS' || contentType === 'blocks') && item.block) {
      const matchesBlock = item.block.block_type?.toLowerCase().includes(searchLower) ||
                          item.block.intensity_level?.toLowerCase().includes(searchLower) ||
                          item.block.target_area?.toLowerCase().includes(searchLower) ||
                          item.block.instructions?.toLowerCase().includes(searchLower)
      return matchesBasic || matchesBlock
    }
    
    return matchesBasic
  })
  
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥'
      case 'ai-agent': return '🤖'
      case 'document': return '📚'
      case 'prompt': return '💭'
      case 'prompts': return '💭'
      case 'automation': return '⚡'
      case 'image': return '🖼️'
      case 'pdf': return '📄'
      case 'WODs':
      case 'wods': return '💪'
      case 'BLOCKS':
      case 'blocks': return '🏗️'
      default: return '📁'
    }
  }
  
  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'ai-agent': return 'AI Agents'
      case 'prompt': return 'Prompts'
      case 'WODs':
      case 'wods': return 'WODs'
      case 'BLOCKS':
      case 'blocks': return 'BLOCKS'
      default: return type.charAt(0).toUpperCase() + type.slice(1) + 's'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getContentIcon(contentType)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Select {getContentTypeLabel(contentType)}
              </h2>
              <p className="text-sm text-gray-600">
                Choose content from your repository to add to the WOD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filters and Search */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={`Search ${contentType}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPublishedOnly}
                  onChange={(e) => setShowPublishedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Published only</span>
              </label>
            </div>
          </div>
          
          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-4xl text-red-400 mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load content
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl text-gray-400 mb-4">{getContentIcon(contentType)}</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? `No ${contentType}s found` : `No ${contentType}s available`}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.' 
                  : `No ${contentType}s have been added to your repository yet.`
                }
              </p>
            </div>
          ) : (
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-2'
              }
            `}>
                {filteredContent.map((item) => (
                <div
                  key={item.id}
                  className={`
                    border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer
                    ${viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center space-x-3'}
                  `}
                  onClick={() => onContentSelect(item)}
                >
                  {viewMode === 'grid' ? (
                    <div>
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {item.thumbnail_url ? (
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if thumbnail fails to load
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="text-2xl" style={{ display: item.thumbnail_url ? 'none' : 'flex' }}>
                          {getContentIcon(contentType)}
                        </div>
                        {contentType === 'video' && item.video?.duration_seconds && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(item.video.duration_seconds)}
                          </div>
                        )}
                        {contentType === 'document' && item.document?.reading_time_minutes && (
                          <div className="absolute bottom-2 right-2 bg-blue-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {item.document.reading_time_minutes} min read
                          </div>
                        )}
                        {contentType === 'prompt' && item.prompt?.usage_count !== undefined && (
                          <div className="absolute bottom-2 right-2 bg-green-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            Used {item.prompt.usage_count}x
                          </div>
                        )}
                        {contentType === 'automation' && item.automation?.required_tools && item.automation.required_tools.length > 0 && (
                          <div className="absolute bottom-2 right-2 bg-purple-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {item.automation.required_tools.length} tools
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                        </p>
                        {item.status && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-shrink-0 relative">
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.thumbnail_url ? (
                            <img 
                              src={item.thumbnail_url} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                                if (nextElement) {
                                  nextElement.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div className="text-lg" style={{ display: item.thumbnail_url ? 'none' : 'flex' }}>
                            {getContentIcon(contentType)}
                          </div>
                        </div>
                        {contentType === 'video' && item.video?.duration_seconds && (
                          <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                            {formatDuration(item.video.duration_seconds)}
                          </div>
                        )}
                        {contentType === 'document' && item.document?.reading_time_minutes && (
                          <div className="absolute bottom-0 right-0 bg-blue-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                            {item.document.reading_time_minutes}m
                          </div>
                        )}
                        {contentType === 'prompt' && item.prompt?.usage_count !== undefined && (
                          <div className="absolute bottom-0 right-0 bg-green-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                            {item.prompt.usage_count}x
                          </div>
                        )}
                        {contentType === 'automation' && item.automation?.required_tools && item.automation.required_tools.length > 0 && (
                          <div className="absolute bottom-0 right-0 bg-purple-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                            {item.automation.required_tools.length}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                          {item.status && (
                            <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                              item.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}"
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">
              {loading ? 'Loading...' : error ? 'Error loading content' : `${filteredContent.length} ${contentType}${filteredContent.length !== 1 ? 's' : ''} ${searchTerm ? 'found' : 'available'}`}
            </p>
            {showPublishedOnly && !error && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Published only
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={filteredContent.length === 0 || loading || !!error}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filteredContent.length === 0 || loading || !!error
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Select Content
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}