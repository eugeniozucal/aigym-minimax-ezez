import React from 'react'
import { ContentRepository } from '@/components/content/ContentRepository'
import { MessageSquare } from 'lucide-react'
import { CONTENT_TYPES } from '@/lib/constants'

export function PromptsRepository() {
  return (
    <ContentRepository
      contentType="prompt"
      title={CONTENT_TYPES.prompt.label}
      description={CONTENT_TYPES.prompt.description}
      icon={MessageSquare}
      color={CONTENT_TYPES.prompt.color}
    />
  )
}

export default PromptsRepository