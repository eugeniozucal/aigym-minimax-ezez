import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Bot, Play, FileText, MessageSquare, Zap, Plus, Search, Filter, Image, FileType } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface ContentType {
  type: string
  label: string
  icon: any
  color: string
  description: string
  count: number
}

const CONTENT_TYPES_BASE = [
  {
    type: 'articles',
    label: 'Articles',
    icon: FileText,
    color: '#10B981',
    description: 'Blog posts, tutorials, and written content',
    count: 0
  },
  {
    type: 'ai-agents',
    label: 'AI Agents',
    icon: Bot,
    color: '#3B82F6',
    description: 'Intelligent AI agents with custom prompts',
    count: 0
  },
  {
    type: 'videos',
    label: 'Videos',
    icon: Play,
    color: '#EF4444',
    description: 'Educational videos with transcriptions',
    count: 0
  },
  {
    type: 'documents',
    label: 'Documents',
    icon: FileText,
    color: '#10B981',
    description: 'Rich text documents and guides',
    count: 0
  },
  {
    type: 'images',
    label: 'Images',
    icon: Image,
    color: '#06B6D4',
    description: 'Image assets and visual content',
    count: 0
  },
  {
    type: 'pdfs',
    label: 'PDFs',
    icon: FileType,
    color: '#DC2626',
    description: 'PDF documents and resources',
    count: 0
  },
  {
    type: 'prompts',
    label: 'Prompts',
    icon: MessageSquare,
    color: '#8B5CF6',
    description: 'Reusable prompt templates',
    count: 0
  },
  {
    type: 'automations',
    label: 'Automations',
    icon: Zap,
    color: '#F59E0B',
    description: 'Process automations and workflows',
    count: 0
  }
]

function ContentManagement() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>(CONTENT_TYPES_BASE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContentCounts()
  }, [])

  const fetchContentCounts = async () => {
    try {
      setLoading(true)
      
      // Fetch articles count
      const { count: articlesCount } = await supabase
        .from('content_articles')
        .select('*', { count: 'exact', head: true })
      
      // Update content types with actual counts
      const updatedTypes = CONTENT_TYPES_BASE.map(type => {
        switch (type.type) {
          case 'articles':
            return { ...type, count: articlesCount || 0 }
          // Add other content type counts here when their tables exist
          // case 'ai-agents':
          //   return { ...type, count: aiAgentsCount || 0 }
          default:
            return type
        }
      })
      
      setContentTypes(updatedTypes)
    } catch (error) {
      console.error('Error fetching content counts:', error)
      setContentTypes(CONTENT_TYPES_BASE) // Fallback to base types
    } finally {
      setLoading(false)
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="mt-2 text-gray-600">
              Create and manage content for your AI platform
            </p>
          </div>
        </div>

        {/* Content Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentTypes.map((contentType) => {
            const Icon = contentType.icon
            return (
              <Link
                key={contentType.type}
                to={`/content/${contentType.type}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: contentType.color + '20' }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: contentType.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {contentType.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {contentType.description}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {contentType.count} items
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/content/${contentType.type}/create`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create
                    </Link>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Search className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Search Content</p>
                <p className="text-sm text-gray-500">Find existing content</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Filter by Tags</p>
                <p className="text-sm text-gray-500">Organize content</p>
              </div>
            </button>
            
            <Link
              to="/content/ai-agents/create"
              className="flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bot className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Quick Agent</p>
                <p className="text-sm text-gray-500">Create new AI agent</p>
              </div>
            </Link>
            
            <Link
              to="/content/articles/create"
              className="flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">New Article</p>
                <p className="text-sm text-gray-500">Write blog posts and tutorials</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Content creation and editing activity will appear here
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ContentManagement