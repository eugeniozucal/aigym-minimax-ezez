import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ContentEditor } from '@/components/content/ContentEditor'
import { supabase, Prompt } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MessageSquare, Copy, Hash, BarChart3, Clock, CheckCircle, Tag } from 'lucide-react'

interface PromptStats {
  characterCount: number
  wordCount: number
  lineCount: number
  variables: string[]
}

const PROMPT_CATEGORIES = [
  'General',
  'Creative Writing',
  'Business',
  'Technical',
  'Educational',
  'Marketing',
  'Customer Support',
  'Data Analysis',
  'Programming',
  'Research',
  'Social Media',
  'Email',
  'Other'
]

export function PromptEditor() {
  const { id } = useParams()
  const isEdit = !!id
  
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [promptText, setPromptText] = useState('')
  const [promptCategory, setPromptCategory] = useState('General')
  const [loading, setLoading] = useState(isEdit)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<PromptStats>({
    characterCount: 0,
    wordCount: 0,
    lineCount: 0,
    variables: []
  })

  useEffect(() => {
    if (isEdit && id) {
      fetchPrompt()
    }
  }, [isEdit, id])

  useEffect(() => {
    calculateStats(promptText)
  }, [promptText])

  const fetchPrompt = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('content_item_id', id)
        .maybeSingle()
      
      if (error) throw error
      if (data) {
        setPrompt(data)
        setPromptText(data.prompt_text || '')
        setPromptCategory(data.prompt_category || 'General')
      }
    } catch (error) {
      console.error('Error fetching prompt:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (text: string) => {
    const characterCount = text.length
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
    const lineCount = text.split('\n').length
    
    // Extract variables (text within curly braces or square brackets)
    const variableMatches = text.match(/\{([^}]+)\}|\[([^\]]+)\]/g) || []
    const variables = [...new Set(variableMatches.map(match => match.replace(/[{}\[\]]/g, '')))]

    setStats({
      characterCount,
      wordCount,
      lineCount,
      variables
    })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      // Update usage count
      if (prompt) {
        await supabase
          .from('prompts')
          .update({ 
            usage_count: (prompt.usage_count || 0) + 1,
            last_copied_at: new Date().toISOString()
          })
          .eq('id', prompt.id)
        
        setPrompt(prev => prev ? {
          ...prev,
          usage_count: (prev.usage_count || 0) + 1,
          last_copied_at: new Date().toISOString()
        } : null)
      }
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('promptText') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = promptText.substring(0, start) + `{${variable}}` + promptText.substring(end)
      setPromptText(newText)
      
      // Move cursor after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2)
      }, 0)
    }
  }

  const savePromptData = async (contentItemId: string) => {
    try {
      const promptData = {
        content_item_id: contentItemId,
        prompt_text: promptText,
        prompt_category: promptCategory,
        usage_count: prompt?.usage_count || 0,
        last_copied_at: prompt?.last_copied_at || null
      }

      if (prompt) {
        const { error } = await supabase
          .from('prompts')
          .update({ ...promptData, updated_at: new Date().toISOString() })
          .eq('id', prompt.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('prompts')
          .insert([promptData])
        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving prompt data:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading prompt...</p>
        </div>
      </div>
    )
  }

  return (
    <ContentEditor 
      contentType="prompt" 
      isEdit={isEdit}
      onSaveContent={savePromptData}
      title="Prompts"
      description="Reusable prompt templates"
      color="#8B5CF6"
      icon={MessageSquare}
    >
      <div className="space-y-6">
        {/* Prompt Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
            Prompt Statistics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.characterCount.toLocaleString()}</div>
              <div className="text-xs text-blue-600 uppercase tracking-wide font-medium">Characters</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.wordCount.toLocaleString()}</div>
              <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Words</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.lineCount}</div>
              <div className="text-xs text-purple-600 uppercase tracking-wide font-medium">Lines</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.variables.length}</div>
              <div className="text-xs text-orange-600 uppercase tracking-wide font-medium">Variables</div>
            </div>
          </div>
        </div>

        {/* Prompt Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-purple-500" />
            Category & Classification
          </h2>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Category
            </label>
            <select
              id="category"
              value={promptCategory}
              onChange={(e) => setPromptCategory(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {PROMPT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Categorize your prompt to make it easier to find and organize
            </p>
          </div>
        </div>

        {/* Prompt Text Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
              Prompt Content
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyToClipboard}
                disabled={!promptText.trim()}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                } disabled:opacity-50`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
              <div className="text-sm text-gray-500">
                {stats.characterCount} / {stats.wordCount} words
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea
              id="promptText"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm leading-relaxed"
              placeholder="Enter your prompt template here...\n\nYou can use variables like {name}, {topic}, or [variable] to make your prompts reusable.\n\nExample:\nYou are a helpful AI assistant specialized in {field}. Please help me with {task} by providing {output_format} that is {tone} and {length}."
            />
            
            {/* Variable Helper */}
            {stats.variables.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
                  <Hash className="h-4 w-4 mr-1" />
                  Detected Variables ({stats.variables.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {stats.variables.map((variable, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md font-mono"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {variable}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  These variables can be replaced when using the prompt
                </p>
              </div>
            )}
            
            {/* Quick Variables */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Variables</h4>
              <div className="flex flex-wrap gap-2">
                {['name', 'topic', 'context', 'tone', 'format', 'length', 'audience', 'goal'].map((variable) => (
                  <button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-100 transition-colors"
                  >
                    + {variable}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click to insert common variables into your prompt
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="text-sm text-purple-700">
                  <p className="font-medium mb-1">Prompt Template Tips</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>Use {'{variable}'} or [variable] syntax for replaceable parts</li>
                    <li>Be specific about the desired output format and style</li>
                    <li>Include context and constraints to guide the AI response</li>
                    <li>Test your prompts with different variables to ensure consistency</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        {prompt && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Usage Statistics
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{prompt.usage_count || 0}</div>
                <div className="text-sm text-blue-600">Times Copied</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-600">
                  {prompt.last_copied_at 
                    ? new Date(prompt.last_copied_at).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <div className="text-sm text-green-600">Last Copied</div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {promptText.trim() && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prompt Preview</h2>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {promptText}
              </pre>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>This is how your prompt will appear when copied</span>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </ContentEditor>
  )
}

export default PromptEditor