import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ContentEditor } from '@/components/content/ContentEditor'
import { supabase, Video } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Play, Globe, Clock, FileText, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react'

interface VideoMetadata {
  title?: string
  description?: string
  duration?: number
  thumbnail?: string
  platform: 'youtube' | 'vimeo' | 'other'
  videoId?: string
}

export function VideoEditor() {
  const { id } = useParams()
  const isEdit = !!id
  
  const [video, setVideo] = useState<Video | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [transcription, setTranscription] = useState('')
  const [autoTitle, setAutoTitle] = useState('')
  const [autoDescription, setAutoDescription] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [urlProcessing, setUrlProcessing] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)

  useEffect(() => {
    if (isEdit && id) {
      fetchVideo()
    }
  }, [isEdit, id])

  useEffect(() => {
    if (videoUrl.trim()) {
      processVideoUrl(videoUrl.trim())
    }
  }, [videoUrl])

  const fetchVideo = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('content_item_id', id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setVideo(data)
        setVideoUrl(data.video_url)
        setTranscription(data.transcription || '')
        setAutoTitle(data.auto_title || '')
        setAutoDescription(data.auto_description || '')
        
        if (data.video_platform && data.video_id) {
          setMetadata({
            platform: data.video_platform as 'youtube' | 'vimeo' | 'other',
            videoId: data.video_id,
            duration: data.duration_seconds || undefined
          })
        }
      }
    } catch (error) {
      console.error('Error fetching video:', error)
    } finally {
      setLoading(false)
    }
  }

  const processVideoUrl = async (url: string) => {
    setUrlProcessing(true)
    setUrlError(null)
    
    try {
      const videoMetadata = parseVideoUrl(url)
      setMetadata(videoMetadata)
      
      // Auto-populate title if available
      if (videoMetadata.title) {
        setAutoTitle(videoMetadata.title)
      }
      
      if (videoMetadata.description) {
        setAutoDescription(videoMetadata.description)
      }
      
    } catch (error) {
      setUrlError(error.message || 'Failed to process video URL')
      setMetadata(null)
    } finally {
      setUrlProcessing(false)
    }
  }

  const parseVideoUrl = (url: string): VideoMetadata => {
    // YouTube URL patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
      /youtube\.com\/embed\/([\w-]+)/,
      /youtube\.com\/v\/([\w-]+)/
    ]
    
    // Vimeo URL patterns
    const vimeoPatterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/
    ]
    
    // Check YouTube
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          platform: 'youtube',
          videoId: match[1],
          title: `YouTube Video ${match[1]}`,
          description: 'Video imported from YouTube'
        }
      }
    }
    
    // Check Vimeo
    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          platform: 'vimeo',
          videoId: match[1],
          title: `Vimeo Video ${match[1]}`,
          description: 'Video imported from Vimeo'
        }
      }
    }
    
    // Generic video URL
    if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
      return {
        platform: 'other',
        title: url.split('/').pop()?.split('.')[0] || 'Video File',
        description: 'Direct video file'
      }
    }
    
    throw new Error('Unsupported video URL format. Please use YouTube, Vimeo, or direct video file URLs.')
  }

  const getEmbedUrl = (metadata: VideoMetadata) => {
    if (metadata.platform === 'youtube' && metadata.videoId) {
      return `https://www.youtube.com/embed/${metadata.videoId}?rel=0&modestbranding=1`
    }
    if (metadata.platform === 'vimeo' && metadata.videoId) {
      return `https://player.vimeo.com/video/${metadata.videoId}?title=0&byline=0&portrait=0`
    }
    return videoUrl
  }

  const calculateReadingTime = (text: string): number => {
    // Average reading speed: 200 words per minute
    const wordCount = text.trim().split(/\s+/).length
    return Math.ceil(wordCount / 200)
  }

  const saveVideoData = async (contentItemId: string) => {
    try {
      const videoData = {
        content_item_id: contentItemId,
        video_url: videoUrl.trim(),
        video_platform: metadata?.platform || null,
        video_id: metadata?.videoId || null,
        duration_seconds: metadata?.duration || null,
        transcription: transcription.trim() || null,
        auto_title: autoTitle.trim() || null,
        auto_description: autoDescription.trim() || null
      }

      if (video) {
        const { error } = await supabase
          .from('videos')
          .update({ ...videoData, updated_at: new Date().toISOString() })
          .eq('id', video.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('videos')
          .insert([videoData])
        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving video data:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading video...</p>
        </div>
      </div>
    )
  }

  return (
    <ContentEditor 
      contentType="video" 
      isEdit={isEdit}
      onSaveContent={saveVideoData}
      title="Videos"
      description="Educational videos with transcriptions"
      color="#EF4444"
      icon={Play}
    >
      <div className="space-y-6">
        {/* Video URL Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-red-500" />
            Video Source
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL *
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  required
                />
                {urlProcessing && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              
              {urlError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">{urlError}</p>
                  </div>
                </div>
              )}
              
              {metadata && !urlError && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">
                      {metadata.platform.charAt(0).toUpperCase() + metadata.platform.slice(1)} video detected
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Platform: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{metadata.platform}</span></p>
                    {metadata.videoId && (
                      <p>Video ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{metadata.videoId}</span></p>
                    )}
                    {metadata.duration && (
                      <p>Duration: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}</span></p>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Supported: YouTube, Vimeo, and direct video file URLs (.mp4, .webm, .ogg, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Video Preview */}
        {metadata && videoUrl && !urlError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Play className="h-5 w-5 mr-2 text-red-500" />
              Video Preview
            </h2>
            
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {metadata.platform === 'youtube' || metadata.platform === 'vimeo' ? (
                <iframe
                  src={getEmbedUrl(metadata)}
                  title="Video Preview"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                {metadata.platform && (
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span className="capitalize">{metadata.platform}</span>
                  </div>
                )}
                {metadata.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-red-600 hover:text-red-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Original</span>
              </a>
            </div>
          </div>
        )}

        {/* Auto-populated Metadata */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            Video Metadata
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="autoTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Auto-detected Title
              </label>
              <input
                type="text"
                id="autoTitle"
                value={autoTitle}
                onChange={(e) => setAutoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Title will be auto-detected from video platform"
              />
              <p className="text-xs text-gray-500 mt-1">
                This can be used as a fallback title if main title is empty
              </p>
            </div>
            
            <div>
              <label htmlFor="autoDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Auto-detected Description
              </label>
              <textarea
                id="autoDescription"
                rows={3}
                value={autoDescription}
                onChange={(e) => setAutoDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description will be auto-detected from video platform"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-populated from the video platform's metadata
              </p>
            </div>
          </div>
        </div>

        {/* Transcription */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-500" />
              Video Transcription
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {transcription.trim() && (
                <>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{transcription.trim().split(/\s+/).length} words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{calculateReadingTime(transcription)} min read</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter the video transcription here...\n\nThis text will be searchable and can be used for generating subtitles or providing accessible content for users."
            />
            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-700">
                <strong>Accessibility Tip:</strong> Adding transcriptions makes your video content accessible to hearing-impaired users 
                and improves SEO by making video content searchable.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        {metadata && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Platform</label>
                <p className="text-gray-900 capitalize">{metadata.platform}</p>
              </div>
              {metadata.videoId && (
                <div>
                  <label className="font-medium text-gray-700">Video ID</label>
                  <p className="text-gray-900 font-mono text-xs">{metadata.videoId}</p>
                </div>
              )}
              {metadata.duration && (
                <div>
                  <label className="font-medium text-gray-700">Duration</label>
                  <p className="text-gray-900">
                    {Math.floor(metadata.duration / 3600)}h {Math.floor((metadata.duration % 3600) / 60)}m {metadata.duration % 60}s
                  </p>
                </div>
              )}
              <div>
                <label className="font-medium text-gray-700">URL</label>
                <p className="text-gray-900 truncate" title={videoUrl}>{videoUrl}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ContentEditor>
  )
}

export default VideoEditor