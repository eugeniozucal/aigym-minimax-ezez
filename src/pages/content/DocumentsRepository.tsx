import React from 'react'
import { ContentRepository } from '@/components/content/ContentRepository'
import { FileText } from 'lucide-react'
import { CONTENT_TYPES } from '@/lib/supabase'

export function DocumentsRepository() {
  return (
    <ContentRepository
      contentType="document"
      title={CONTENT_TYPES.document.label}
      description={CONTENT_TYPES.document.description}
      icon={FileText}
      color={CONTENT_TYPES.document.color}
    />
  )
}

export default DocumentsRepository