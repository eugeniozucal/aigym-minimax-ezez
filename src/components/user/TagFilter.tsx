import React from 'react'
import { Tag } from '../../pages/user/CommunityPage'
import { cn } from '../../lib/utils'

interface TagFilterProps {
  tags: Tag[]
  selectedTag: string
  onTagSelect: (tagId: string) => void
}

export function TagFilter({ tags, selectedTag, onTagSelect }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* All tag */}
      <button
        onClick={() => onTagSelect('all')}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
          selectedTag === 'all'
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        All
      </button>
      
      {/* Dynamic tags */}
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onTagSelect(tag.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
            selectedTag === tag.id
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
          style={{
            backgroundColor: selectedTag === tag.id ? tag.color : undefined
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}