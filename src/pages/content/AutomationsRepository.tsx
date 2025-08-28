import React from 'react'
import { ContentRepository } from '@/components/content/ContentRepository'
import { Zap } from 'lucide-react'
import { CONTENT_TYPES } from '@/lib/supabase'

export function AutomationsRepository() {
  return (
    <ContentRepository
      contentType="automation"
      title={CONTENT_TYPES.automation.label}
      description={CONTENT_TYPES.automation.description}
      icon={Zap}
      color={CONTENT_TYPES.automation.color}
    />
  )
}

export default AutomationsRepository