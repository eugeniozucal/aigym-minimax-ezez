import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ContentEditor } from '@/components/content/ContentEditor'
import { supabase, Document } from '../../lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { FileText, Type, Eye, Code, Clock, BarChart3 } from 'lucide-react'

interface DocumentStats {
  wordCount: number
  characterCount: number
  readingTime: number
  paragraphs: number
}

export function DocumentEditor() {
  const { id } = useParams()
  const isEdit = !!id
  const quillRef = useRef<ReactQuill>(null)
  
  const [document, setDocument] = useState<Document | null>(null)
  const [contentHtml, setContentHtml] = useState('')
  const [contentJson, setContentJson] = useState<any>(null)
  const [loading, setLoading] = useState(isEdit)
  const [previewMode, setPreviewMode] = useState(false)
  const [stats, setStats] = useState<DocumentStats>({
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    paragraphs: 0
  })

  useEffect(() => {
    if (isEdit && id) {
      fetchDocument()
    }
  }, [isEdit, id])

  useEffect(() => {
    calculateStats(contentHtml)
  }, [contentHtml])

  const fetchDocument = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('content_item_id', id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setDocument(data)
        setContentHtml(data.content_html || '')
        setContentJson(data.content_json)
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (html: string) => {
    // Remove HTML tags and calculate stats
    const textContent = html.replace(/<[^>]*>/g, '').trim()
    const words = textContent ? textContent.split(/\s+/).length : 0
    const characters = textContent.length
    const readingTime = Math.ceil(words / 200) // Average 200 words per minute
    const paragraphs = html.split(/<\/p>/gi).length - 1 || (textContent ? 1 : 0)

    setStats({
      wordCount: words,
      characterCount: characters,
      readingTime: Math.max(1, readingTime),
      paragraphs
    })
  }

  const saveDocumentData = async (contentItemId: string) => {
    try {
      const documentData = {
        content_item_id: contentItemId,
        content_html: contentHtml,
        content_json: contentJson,
        word_count: stats.wordCount,
        reading_time_minutes: stats.readingTime
      }

      if (document) {
        const { error } = await supabase
          .from('documents')
          .update({ ...documentData, updated_at: new Date().toISOString() })
          .eq('id', document.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('documents')
          .insert([documentData])
        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving document data:', error)
      throw error
    }
  }

  const handleContentChange = (content: string, delta: any, source: any, editor: any) => {
    setContentHtml(content)
    setContentJson(editor.getContents())
  }

  // Custom toolbar configuration for professional editing
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }, { 'size': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false
    }
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <ContentEditor 
      contentType="document" 
      isEdit={isEdit}
      onSaveContent={saveDocumentData}
      title="Documents"
      description="Rich text documents and guides"
      color="#10B981"
      icon={FileText}
    >
      <div className="space-y-6">
        {/* Document Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
            Document Statistics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.wordCount.toLocaleString()}</div>
              <div className="text-xs text-blue-600 uppercase tracking-wide font-medium">Words</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.characterCount.toLocaleString()}</div>
              <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Characters</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.readingTime}</div>
              <div className="text-xs text-purple-600 uppercase tracking-wide font-medium">Min Read</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.paragraphs}</div>
              <div className="text-xs text-orange-600 uppercase tracking-wide font-medium">Paragraphs</div>
            </div>
          </div>
        </div>

        {/* Editor Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Type className="h-5 w-5 mr-2 text-green-500" />
              Document Content
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  !previewMode 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Code className="h-4 w-4 mr-1 inline" />
                Edit
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  previewMode 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eye className="h-4 w-4 mr-1 inline" />
                Preview
              </button>
            </div>
          </div>

          {previewMode ? (
            /* Preview Mode */
            <div className="prose max-w-none">
              <div className="min-h-96 p-6 border border-gray-200 rounded-lg bg-gray-50">
                {contentHtml ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No content to preview</p>
                    <p className="text-sm mt-1">Switch to Edit mode to start writing</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={contentHtml}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="Start writing your document content here...\n\nYou can use the toolbar above to format text, add images, create lists, and more. This editor supports rich text formatting similar to Google Docs or Microsoft Word."
                style={{
                  minHeight: '400px',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}
              />
            </div>
          )}
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Professional Document Editor</p>
                <p className="text-xs leading-relaxed">
                  This rich-text editor supports all standard formatting options including headers, lists, links, images, and code blocks. 
                  Content is automatically saved and can be exported or shared with clients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Metadata */}
        {document && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Metadata</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Word Count</label>
                <p className="text-gray-900">{stats.wordCount.toLocaleString()} words</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Reading Time</label>
                <p className="text-gray-900">{stats.readingTime} minute{stats.readingTime !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-900">{new Date(document.updated_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Document ID</label>
                <p className="text-gray-900 font-mono text-xs">{document.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ContentEditor>
  )
}

export default DocumentEditor