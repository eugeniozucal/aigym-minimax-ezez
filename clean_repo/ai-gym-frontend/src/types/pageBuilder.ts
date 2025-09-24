export interface Block {
  id: string
  type: string
  data: any
  order: number
  pageId: string
  // Content properties
  title?: string
  description?: string
  content?: any
  // Exercise-specific properties
  duration?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export interface Page {
  id: string
  title: string
  blocks: Block[]
  order: number
}

export interface PageData {
  id?: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  pages: Page[]
  targetRepository: 'wods' | 'blocks' | 'programs'
  settings: {
    communities: string[]
    tags: string[]
    people: string[]
    difficulty: 1 | 2 | 3 | 4 | 5
    estimatedDuration: number
    autoSaveEnabled: boolean
  }
}