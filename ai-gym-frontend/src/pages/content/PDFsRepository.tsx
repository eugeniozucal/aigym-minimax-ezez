import React from 'react'
import { ContentRepository } from '@/components/content/ContentRepository'
import { FileText } from 'lucide-react'
import { CONTENT_TYPES } from '@/lib/constants'

export function PDFsRepository() {
  return (
    <ContentRepository
      contentType="pdf"
      title={CONTENT_TYPES.pdf.label}
      description={CONTENT_TYPES.pdf.description}
      icon={FileText}
      color={CONTENT_TYPES.pdf.color}
    />
  )
}

export default PDFsRepository