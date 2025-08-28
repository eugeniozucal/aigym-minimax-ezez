import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Upload,
  Tag,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Category {
  id: number
  name: string
  color: string
}

interface Article {
  id?: number
  title: string
  content: string
  excerpt: string
  author: string
  category_id: number | null
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  featured_image_url: string
  slug: string
  seo_title: string
  seo_description: string
}

function ArticleEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [article, setArticle] = useState<Article>({
    title: '',
    content: '',
    excerpt: '',
    author: 'Admin User',
    category_id: null,
    status: 'draft',
    tags: [],
    featured_image_url: '',
    slug: '',
    seo_title: '',
    seo_description: ''
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchCategories()
    if (isEditing) {
      fetchArticle()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchArticle = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content_articles')
        .select('*')
        .eq('id', parseInt(id))
        .single()

      if (error) throw error
      if (data) {
        setArticle({
          ...data,
          tags: data.tags || []
        })
      }
    } catch (error) {
      console.error('Error fetching article:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setArticle(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      seo_title: prev.seo_title || title
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !article.tags.includes(newTag.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const handleSave = async (publishNow = false) => {
    try {
      setSaving(true)
      
      const articleData = {
        ...article,
        status: publishNow ? 'published' : article.status,
        published_at: publishNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      if (isEditing) {
        const { error } = await supabase
          .from('content_articles')
          .update(articleData)
          .eq('id', parseInt(id!))

        if (error) throw error
        
        showNotification(
          publishNow ? 'Article published successfully!' : 'Article saved successfully!',
          'success'
        )
        
        // Delay navigation to show notification
        setTimeout(() => {
          navigate('/content/articles')
        }, 1500)
      } else {
        const { data, error } = await supabase
          .from('content_articles')
          .insert([articleData])
          .select()
          .single()

        if (error) throw error
        
        showNotification(
          publishNow ? 'Article published successfully!' : 'Article created successfully!',
          'success'
        )
        
        // Delay navigation to show notification
        setTimeout(() => {
          if (data) {
            navigate(`/content/articles/${data.id}/edit`, { replace: true })
          } else {
            navigate('/content/articles')
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Error saving article:', error)
      showNotification('Failed to save article. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out transform translate-x-0 opacity-100">
          <div className={`max-w-sm w-full ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-transparent rounded-md inline-flex text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => setNotification(null)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/content/articles')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Article' : 'Create New Article'}
              </h1>
              <p className="text-gray-600">Write and publish your content</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'seo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              SEO
            </button>
          </nav>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={article.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter article title..."
                className="w-full text-2xl font-bold border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-2"
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
              </label>
              <textarea
                value={article.excerpt}
                onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the article..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={article.content}
                onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your article content here..."
                rows={20}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                You can use HTML tags for formatting.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={article.category_id || ''}
                onChange={(e) => setArticle(prev => ({ 
                  ...prev, 
                  category_id: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                value={article.author}
                onChange={(e) => setArticle(prev => ({ ...prev, author: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={article.status}
                onChange={(e) => setArticle(prev => ({ 
                  ...prev, 
                  status: e.target.value as 'draft' | 'published' | 'archived'
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                value={article.slug}
                onChange={(e) => setArticle(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="article-url-slug"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Featured Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                value={article.featured_image_url}
                onChange={(e) => setArticle(prev => ({ ...prev, featured_image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag..."
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 rounded-r-md hover:bg-gray-100"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={article.seo_title}
                onChange={(e) => setArticle(prev => ({ ...prev, seo_title: e.target.value }))}
                placeholder="SEO optimized title..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended: 50-60 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description
              </label>
              <textarea
                value={article.seo_description}
                onChange={(e) => setArticle(prev => ({ ...prev, seo_description: e.target.value }))}
                placeholder="Meta description for search engines..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended: 150-160 characters
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ArticleEditor
