import React from 'react'
import { ContentRepository } from '@/components/content/ContentRepository'
import { Image } from 'lucide-react'
import { CONTENT_TYPES } from '@/lib/supabase'

export function ImagesRepository() {
  return (
    <ContentRepository
      contentType="image"
      title={CONTENT_TYPES.image.label}
      description={CONTENT_TYPES.image.description}
      icon={Image}
      color={CONTENT_TYPES.image.color}
    />
  )
}

export default ImagesRepository