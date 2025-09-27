import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { supabase } from '../../lib/supabase'
import { WriteBox } from '../../components/user/WriteBox'
import { TagFilter } from '../../components/user/TagFilter'
import { PostList } from '../../components/user/PostList'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { toast } from 'sonner'

export interface Post {
  id: string
  user_id: string
  client_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    first_name: string | null
    last_name: string | null
    email: string
  }
  tags?: Tag[]
}

export interface Tag {
  id: string
  name: string
  color: string
  client_id: string
}

export function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTags()
      loadPosts()
    }
  }, [user])

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('post_tags')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error loading tags:', error)
        return
      }
      
      setTags(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (postsError) {
        console.error('Error loading posts:', postsError)
        return
      }
      
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(post => post.user_id))]
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds)
        
        const postsWithUsers = postsData.map(post => ({
          ...post,
          user: usersData?.find(u => u.id === post.user_id)
        }))
        
        setPosts(postsWithUsers)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const filteredPosts = selectedTag === 'all' 
    ? posts 
    : posts.filter(post => 
        post.tags && post.tags.some(tag => tag.id === selectedTag)
      )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading posts...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Write Box */}
      <div className="mb-8">
        <WriteBox 
          onPostCreated={handlePostCreated} 
          clientId="default"
          tags={tags}
        />
      </div>
      
      {/* Tag Filter */}
      <div className="mb-6">
        <TagFilter 
          tags={tags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
        />
      </div>
      
      {/* Posts List */}
      <PostList posts={filteredPosts} />
    </div>
  )
}
