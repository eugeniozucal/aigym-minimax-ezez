import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { UserAvatar } from './UserAvatar'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { toast } from 'sonner'
import { Tag } from '../../pages/user/CommunityPage'

interface WriteBoxProps {
  onPostCreated: (post: any) => void
  clientId: string | null
  tags: Tag[]
}

export function WriteBox({ onPostCreated, clientId, tags }: WriteBoxProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isPosting, setIsPosting] = useState(false)

  const handleFocus = () => {
    setIsExpanded(true)
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setContent('')
    setSelectedTags([])
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handlePost = async () => {
    if (!content.trim() || !user || !clientId) {
      return
    }

    setIsPosting(true)
    try {
      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          client_id: clientId,
          content: content.trim()
        })
        .select()
        .maybeSingle()

      if (postError) {
        console.error('Error creating post:', postError)
        toast.error('Failed to create post')
        return
      }

      // Add tags if selected
      if (selectedTags.length > 0 && postData) {
        const tagAssignments = selectedTags.map(tagId => ({
          post_id: postData.id,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('post_tag_assignments')
          .insert(tagAssignments)

        if (tagError) {
          console.error('Error assigning tags:', tagError)
        }
      }

      // Get user info for the new post
      const { data: userData } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', user.id)
        .maybeSingle()

      // Add the post to the list
      const newPost = {
        ...postData,
        user: userData,
        tags: selectedTags.length > 0 ? tags.filter(tag => selectedTags.includes(tag.id)) : []
      }

      onPostCreated(newPost)
      toast.success('Post created successfully!')
      
      // Reset form
      setContent('')
      setSelectedTags([])
      setIsExpanded(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex space-x-3">
        <UserAvatar user={user} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleFocus}
            placeholder="Write something..."
            className="w-full resize-none border-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-sm"
            rows={isExpanded ? 3 : 1}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pl-11">
          {/* Tag Selection */}
          {tags.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add tags (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                      selectedTags.includes(tag.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                      borderColor: tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!content.trim() || isPosting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isPosting && <LoadingSpinner size="sm" />}
              <span>{isPosting ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}