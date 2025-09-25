import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Post } from '../../pages/user/CommunityPage'
import { UserAvatar } from './UserAvatar'
import { Heart, MessageCircle, Share2 } from 'lucide-react'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const getDisplayName = () => {
    if (post.user?.first_name && post.user?.last_name) {
      return `${post.user.first_name} ${post.user.last_name}`
    }
    if (post.user?.first_name) {
      return post.user.first_name
    }
    return post.user?.email?.split('@')[0] || 'Unknown User'
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'unknown time'
    }
  }

  const handleLike = () => {
    // TODO: Implement like functionality
    console.log('Like post:', post.id)
  }

  const handleComment = () => {
    // TODO: Implement comment functionality
    console.log('Comment on post:', post.id)
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share post:', post.id)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <UserAvatar user={{ email: post.user?.email } as any} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {getDisplayName()}
            </h3>
            {/* Badge for new users could go here */}
          </div>
          <p className="text-sm text-gray-500 flex items-center space-x-1">
            <span>{formatTime(post.created_at)}</span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span>in</span>
                <span className="font-medium">
                  {post.tags.map(tag => tag.name).join(', ')}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors duration-200"
          >
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Like</span>
          </button>
          
          <button
            onClick={handleComment}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors duration-200"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors duration-200"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
        
        {/* Post time indicator */}
        <div className="text-xs text-gray-400">
          {formatTime(post.created_at)}
        </div>
      </div>
    </div>
  )
}