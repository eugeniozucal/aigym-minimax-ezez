export const CONTENT_TYPES = {
  article: {
    label: 'Articles',
    icon: '📄',
    plural: 'articles'
  },
  ai_agent: {
    label: 'AI Agents',
    icon: '🤖',
    plural: 'ai_agents'
  },
  video: {
    label: 'Videos',
    icon: '🎥',
    plural: 'videos'
  },
  document: {
    label: 'Documents',
    icon: '📋',
    plural: 'documents'
  },
  image: {
    label: 'Images',
    icon: '🖼️',
    plural: 'images'
  },
  pdf: {
    label: 'PDFs',
    icon: '📕',
    plural: 'pdfs'
  },
  prompt: {
    label: 'Prompts',
    icon: '💭',
    plural: 'prompts'
  },
  automation: {
    label: 'Automations',
    icon: '⚡',
    plural: 'automations'
  }
} as const

export type ContentType = keyof typeof CONTENT_TYPES



