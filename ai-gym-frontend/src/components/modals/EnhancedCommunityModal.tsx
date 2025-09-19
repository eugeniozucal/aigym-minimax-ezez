import React, { useState, useEffect, useRef } from 'react'
import { supabase, Community, ApiKey, createCommunityFromTemplate } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { X, Upload, Palette, Key, Copy, Building, Image, AlertCircle, Plus } from 'lucide-react'

interface CommunityModalProps {
  community?: Community | null
  apiKeys: ApiKey[]
  communities: Community[]
  onClose: () => void
  onSave: () => void
}

export function CommunityModal({ community, apiKeys, communities, onClose, onSave }: CommunityModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    project_name: '',
    logo_url: '',
    brand_color: '#3B82F6',
    forum_enabled: false,
    api_key_id: ''
  })
  
  // Template creation state
  const [useTemplate, setUseTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [includeContent, setIncludeContent] = useState(false)
  
  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Validation state
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name,
        project_name: community.project_name,
        logo_url: community.logo_url || '',
        brand_color: community.brand_color,
        forum_enabled: community.forum_enabled,
        api_key_id: community.api_key_id || ''
      })
      setLogoPreview(community.logo_url || '')
    } else {
      setFormData({
        name: '',
        project_name: '',
        logo_url: '',
        brand_color: '#3B82F6',
        forum_enabled: false,
        api_key_id: ''
      })
      setLogoPreview('')
    }
  }, [community])

  const validateName = async (name: string) => {
    if (!name.trim()) {
      setNameError('Community name is required')
      return false
    }

    // Check for unique name (excluding current community if editing)
    const { data, error } = await supabase
      .from('communities')
      .select('id')
      .eq('name', name.trim())
      .neq('id', community?.id || '')
    
    if (error) {
      console.error('Error validating name:', error)
      return false
    }
    
    if (data && data.length > 0) {
      setNameError('A community with this name already exists')
      return false
    }
    
    setNameError('')
    return true
  }

  const handleLogoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Logo file must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    try {
      setLogoUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // For now, we'll use a placeholder URL since we don't have storage setup
      // In production, this would upload to Supabase Storage
      const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Community')}&size=256&background=${formData.brand_color.substring(1)}&color=ffffff`
      
      setFormData(prev => ({ ...prev, logo_url: placeholderUrl }))
      setLogoPreview(placeholderUrl)
      
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = await validateName(formData.name)
    if (!isValid) return
    
    setLoading(true)
    
    try {
      if (useTemplate && selectedTemplate && !community) {
        // Create from template
        await createCommunityFromTemplate({
          sourceCommunityId: selectedTemplate,
          newCommunityName: formData.name,
          newProjectName: formData.project_name || undefined,
          includeContent,
          logoUrl: formData.logo_url || undefined,
          colorHex: formData.brand_color,
          hasForumToggle: formData.forum_enabled,
          apiKeyId: formData.api_key_id || undefined
        })
      } else {
        // Regular create/update
        const communityData = {
          name: formData.name.trim(),
          project_name: formData.project_name.trim() || formData.name.trim(),
          logo_url: formData.logo_url || null,
          brand_color: formData.brand_color,
          forum_enabled: formData.forum_enabled,
          api_key_id: formData.api_key_id || null,
          status: 'active'
        }

        if (community) {
          // Update existing community
          const { error } = await supabase
            .from('communities')
            .update({ ...communityData, updated_at: new Date().toISOString() })
            .eq('id', community.id)
          
          if (error) throw error
        } else {
          // Create new community
          const { error } = await supabase
            .from('communities')
            .insert([communityData])
          
          if (error) throw error
        }
      }
      
      onSave()
    } catch (error) {
      console.error('Error saving community:', error)
      alert('Failed to save community. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getTemplateOptions = () => {
    return communities.filter(c => c.status === 'active' && c.id !== community?.id)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {community ? 'Edit Community' : 'Create New Community'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection (only for new communities) */}
          {!community && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Copy className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">Start from Template</h3>
              </div>
              
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => {
                    setUseTemplate(e.target.checked)
                    if (!e.target.checked) {
                      setSelectedTemplate('')
                      setIncludeContent(false)
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Create this community from an existing template</span>
              </label>
              
              {useTemplate && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Template Community
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={useTemplate}
                    >
                      <option value="">Choose a community to use as template...</option>
                      {getTemplateOptions().map((templateCommunity) => (
                        <option key={templateCommunity.id} value={templateCommunity.id}>
                          {templateCommunity.name} - {templateCommunity.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeContent}
                      onChange={(e) => setIncludeContent(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include all content from template</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Community Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  setNameError('')
                }}
                onBlur={(e) => validateName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  nameError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Enter community name"
                required
              />
              {nameError && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {nameError}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-lg object-cover border border-gray-300"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Image className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoUpload(file)
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {logoUploading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Brand Color and API Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand_color" className="block text-sm font-medium text-gray-700 mb-2">
                Brand Color *
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: formData.brand_color }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'color'
                    input.value = formData.brand_color
                    input.onchange = (e) => {
                      setFormData(prev => ({ ...prev, brand_color: (e.target as HTMLInputElement).value }))
                    }
                    input.click()
                  }}
                >
                  <Palette className="h-4 w-4 text-white m-3" />
                </div>
                <input
                  type="text"
                  id="brand_color"
                  value={formData.brand_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="api_key_id" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="api_key_id"
                  value={formData.api_key_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key_id: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an API key...</option>
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name} ({key.provider})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Forum Enable Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.forum_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, forum_enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable Forum</span>
                <p className="text-sm text-gray-500">Allow users to participate in community discussions</p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {community ? 'Update Community' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}