import React, { useState, useEffect } from 'react'
import { supabase, UserTag, Client } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { X, Tag, Building2 } from 'lucide-react'

interface TagModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tag?: UserTag | null
  clients: Client[]
}

const tagColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Yellow
  '#84CC16', // Lime
  '#10B981', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#A855F7', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#6B7280'  // Gray
]

export function TagModal({ isOpen, onClose, onSuccess, tag, clients }: TagModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    client_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        color: tag.color,
        client_id: tag.client_id
      })
    } else {
      setFormData({
        name: '',
        color: '#6B7280',
        client_id: clients.length > 0 ? clients[0].id : ''
      })
    }
    setError('')
  }, [tag, clients, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.client_id) {
      setError('Please select a client')
      setLoading(false)
      return
    }

    try {
      const tagData = {
        name: formData.name.trim(),
        color: formData.color,
        client_id: formData.client_id
      }

      if (tag) {
        // Update existing tag
        const { error } = await supabase
          .from('user_tags')
          .update(tagData)
          .eq('id', tag.id)
        
        if (error) throw error
      } else {
        // Create new tag
        const { error } = await supabase
          .from('user_tags')
          .insert([tagData])
        
        if (error) throw error
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving tag:', error)
      setError(error.message || 'An error occurred while saving the tag')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectedClient = clients.find(c => c.id === formData.client_id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color }}
            >
              <Tag className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {tag ? 'Edit Tag' : 'Create Tag'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
              Client Organization
            </label>
            <select
              id="client_id"
              name="client_id"
              required
              value={formData.client_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || !!tag}
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {selectedClient && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" style={{ color: selectedClient.brand_color }} />
                <span>{selectedClient.project_name}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Beginner, Advanced, VIP"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tag Color
            </label>
            <div className="grid grid-cols-7 gap-3">
              {tagColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`h-10 w-10 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-400 scale-110 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                />
              ))}
            </div>
            <div className="mt-3">
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="#6B7280"
                pattern="^#[0-9A-Fa-f]{6}$"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {tag ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                tag ? 'Update Tag' : 'Create Tag'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}