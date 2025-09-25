import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ContentEditor } from '@/components/content/ContentEditor'
import { supabase, PDF as PDFType } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FileText, Upload, Eye, File, Info, AlertTriangle, FileType } from 'lucide-react'
import { useAuth } from '@/contexts/SimpleAuthContext'

interface PDFMetadata {
  fileSize: number
  pageCount: number
  fileName: string
  thumbnailUrl?: string
}

export function PDFEditor() {
  const { id } = useParams()
  const isEdit = !!id
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [pdf, setPdf] = useState<PDFType | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [uploading, setUploading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) {
      fetchPDF()
    }
  }, [isEdit, id])

  const fetchPDF = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('pdfs')
        .select('*')
        .eq('content_item_id', id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setPdf(data)
        setPdfUrl(data.pdf_url || '')
        
        if (data.file_size && data.page_count) {
          setMetadata({
            fileSize: data.file_size,
            pageCount: data.page_count,
            fileName: data.pdf_url?.split('/').pop() || 'unknown.pdf',
            thumbnailUrl: data.thumbnail_url
          })
        }
      }
    } catch (error) {
      console.error('Error fetching PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handlePDFUpload(file)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') {
      handlePDFUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handlePDFUpload = async (file: File) => {
    if (!user) {
      setUploadError('Authentication required')
      return
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError(`Only PDF files are supported. Received: ${file.type}`)
      return
    }

    // Validate file size (50MB)
    if (file.size > 52428800) {
      setUploadError('File size exceeds 50MB limit')
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
      const { data, error } = await supabase.functions.invoke('pdf-upload', {
        body: {
          fileData: base64Data,
          fileName: file.name
        }
      })

      if (error) throw error
      
      if (data?.data) {
        const uploadData = data.data
        setPdfUrl(uploadData.pdfUrl)
        setMetadata({
          fileSize: uploadData.fileSize,
          pageCount: uploadData.pageCount,
          fileName: uploadData.fileName,
          thumbnailUrl: uploadData.thumbnailUrl
        })
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  const savePDFData = async (contentItemId: string) => {
    try {
      if (!pdfUrl) {
        throw new Error('No PDF uploaded')
      }

      const pdfData = {
        content_item_id: contentItemId,
        pdf_url: pdfUrl,
        file_size: metadata?.fileSize,
        page_count: metadata?.pageCount,
        thumbnail_url: metadata?.thumbnailUrl
      }

      if (pdf) {
        const { error } = await supabase
          .from('pdfs')
          .update({ ...pdfData, updated_at: new Date().toISOString() })
          .eq('id', pdf.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pdfs')
          .insert([pdfData])
        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving PDF data:', error)
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
          <p className="text-sm text-gray-500 mt-3">Loading PDF...</p>
        </div>
      </div>
    )
  }

  return (
    <ContentEditor 
      contentType="pdf" 
      isEdit={isEdit}
      onSaveContent={savePDFData}
      title="PDFs"
      description="PDF documents and resources"
      color="#DC2626"
      icon={FileText}
    >
      <div className="space-y-6">
        {/* PDF Upload/Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-red-500" />
              PDF Upload
            </h2>
            {pdfUrl && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    !previewMode 
                      ? 'bg-red-100 text-red-700' 
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
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-1 inline" />
                  Preview
                </button>
              </div>
            )}
          </div>

          {previewMode && pdfUrl ? (
            /* Preview Mode */
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">PDF Preview</p>
              </div>
              <div className="p-6">
                <div className="bg-white border border-gray-300 rounded-lg p-6 text-center">
                  <div className="mx-auto h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {metadata?.fileName || 'PDF Document'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {metadata?.pageCount} page{metadata?.pageCount !== 1 ? 's' : ''} • {metadata ? formatFileSize(metadata.fileSize) : ''}
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </a>
                    <a
                      href={pdfUrl}
                      download
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </div>
                </div>
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
                  uploading ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-red-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {uploading ? (
                  <div className="space-y-3">
                    <LoadingSpinner size="md" className="mx-auto" />
                    <p className="text-sm text-gray-600">Uploading PDF...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pdfUrl ? 'Change PDF' : 'Upload a PDF'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Drag and drop or click to select
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      Supports: PDF files only • Max size: 50MB
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Select File
                    </button>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* PDF Metadata */}
        {metadata && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-red-500" />
              Document Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metadata.pageCount}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wide font-medium">
                  Page{metadata.pageCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatFileSize(metadata.fileSize)}</div>
                <div className="text-xs text-green-600 uppercase tracking-wide font-medium">File Size</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">PDF</div>
                <div className="text-xs text-purple-600 uppercase tracking-wide font-medium">Format</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <File className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Filename</p>
                  <p className="text-sm text-gray-500">{metadata.fileName}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <FileType className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">PDF Successfully Uploaded</p>
                  <p className="text-xs leading-relaxed">
                    Your PDF has been uploaded to secure storage and is ready to be accessed. 
                    Users will be able to view and download this document when you publish the content.
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

export default PDFEditor