import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ContentEditor } from '@/components/content/ContentEditor'
import { supabase, Image as ImageType } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Image, Upload, Eye, FileImage, Info, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ImageMetadata {
  fileSize: number
  mimeType: string
  width: number
  height: number
  fileName: string
}

export function ImageEditor() {
  const { id } = useParams()
  const isEdit = !!id
  const { admin } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [image, setImage] = useState<ImageType | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [uploading, setUploading] = useState(false)
  const [altText, setAltText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) {
      fetchImage()
    }
  }, [isEdit, id])

  const fetchImage = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('content_item_id', id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setImage(data)
        setImageUrl(data.image_url || '')
        setAltText(data.alt_text || '')
        
        if (data.file_size && data.mime_type && data.width && data.height) {
          setMetadata({
            fileSize: data.file_size,
            mimeType: data.mime_type,
            width: data.width,
            height: data.height,
            fileName: data.image_url?.split('/').pop() || 'unknown'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching image:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleImageUpload = async (file: File) => {
    if (!admin) {
      setUploadError('Admin authentication required')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Unsupported file type: ${file.type}. Allowed types: JPEG, PNG, WebP, GIF, SVG`)
      return
    }

    // Validate file size (10MB)
    if (file.size > 10485760) {
      setUploadError('File size exceeds 10MB limit')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('image-upload', {
        body: {
          imageData: base64Data,
          fileName: file.name,
          altText: altText
        }
      })

      if (error) throw error
      
      if (data?.data) {
        const uploadData = data.data
        setImageUrl(uploadData.imageUrl)
        setMetadata({
          fileSize: uploadData.fileSize,
          mimeType: uploadData.mimeType,
          width: uploadData.width,
          height: uploadData.height,
          fileName: uploadData.fileName
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const saveImageData = async (contentItemId: string) => {
    try {
      if (!imageUrl) {
        throw new Error('No image uploaded')
      }

      const imageData = {
        content_item_id: contentItemId,
        image_url: imageUrl,
        alt_text: altText,
        file_size: metadata?.fileSize,
        mime_type: metadata?.mimeType,
        width: metadata?.width,
        height: metadata?.height
      }

      if (image) {
        const { error } = await supabase
          .from('images')
          .update({ ...imageData, updated_at: new Date().toISOString() })
          .eq('id', image.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('images')
          .insert([imageData])
        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving image data:', error)
      throw error
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading image...</p>
        </div>
      </div>
    )
  }

  return (
    <ContentEditor 
      contentType="image" 
      isEdit={isEdit}
      onSaveContent={saveImageData}
      title="Images"
      description="Image assets and visual content"
      color="#06B6D4"
      icon={Image}
    >
      <div className="space-y-6">
        {/* Alt Text Field */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileImage className="h-5 w-5 mr-2 text-cyan-500" />
            Image Accessibility
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Text (for accessibility)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe this image for screen readers..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide a brief description of the image content for accessibility
              </p>
            </div>
          </div>
        </div>

        {/* Image Upload/Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-cyan-500" />
              Image Upload
            </h2>
            {imageUrl && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    !previewMode 
                      ? 'bg-cyan-100 text-cyan-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="h-4 w-4 mr-1 inline" />
                  Upload
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    previewMode 
                      ? 'bg-cyan-100 text-cyan-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-1 inline" />
                  Preview
                </button>
              </div>
            )}
          </div>

          {previewMode && imageUrl ? (
            /* Preview Mode */
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">Image Preview</p>
              </div>
              <div className="p-6 text-center">
                <img 
                  src={imageUrl} 
                  alt={altText || 'Uploaded image'}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
                  onError={() => setUploadError('Failed to load image')}
                />
                {altText && (
                  <p className="text-sm text-gray-500 mt-3 italic">
                    Alt text: {altText}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Upload Mode */
            <div className="space-y-4">
              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">Upload Error</p>
                      <p>{uploadError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  uploading ? 'border-cyan-300 bg-cyan-50' : 'border-gray-300 hover:border-cyan-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {uploading ? (
                  <div className="space-y-3">
                    <LoadingSpinner size="md" className="mx-auto" />
                    <p className="text-sm text-gray-600">Uploading image...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {imageUrl ? 'Change image' : 'Upload an image'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Drag and drop or click to select
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      Supports: JPEG, PNG, WebP, GIF, SVG • Max size: 10MB
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                      Select File
                    </button>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Image Metadata */}
        {metadata && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-cyan-500" />
              Image Information
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metadata.width}×{metadata.height}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wide font-medium">Dimensions</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatFileSize(metadata.fileSize)}</div>
                <div className="text-xs text-green-600 uppercase tracking-wide font-medium">File Size</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{metadata.mimeType.split('/')[1].toUpperCase()}</div>
                <div className="text-xs text-purple-600 uppercase tracking-wide font-medium">Format</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{metadata.fileName.length > 8 ? '...' + metadata.fileName.slice(-8) : metadata.fileName}</div>
                <div className="text-xs text-orange-600 uppercase tracking-wide font-medium">Filename</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-cyan-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Image className="h-4 w-4 text-cyan-600 mt-0.5" />
                <div className="text-sm text-cyan-700">
                  <p className="font-medium mb-1">Image Successfully Uploaded</p>
                  <p className="text-xs leading-relaxed">
                    Your image has been uploaded to secure storage and is ready to be used. 
                    The image URL will be automatically set when you save this content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ContentEditor>
  )
}

export default ImageEditor