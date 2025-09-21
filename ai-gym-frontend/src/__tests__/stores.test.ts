/**
 * Store Tests - Testing the new state management system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useContentStore } from '@/lib/stores/contentStore'

// Simple test for store functionality
describe('Content Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useContentStore.getState().resetEditor()
  })

  it('should initialize with default state', () => {
    const store = useContentStore.getState()
    
    expect(store.currentContent).toBeNull()
    expect(store.isEditing).toBe(false)
    expect(store.isDirty).toBe(false)
    expect(store.pageData).toBeNull()
    expect(store.autoSaveEnabled).toBe(true)
    expect(store.autoSaveInterval).toBe(2000)
  })

  it('should set current content and update editing state', () => {
    const store = useContentStore.getState()
    
    const mockContent = {
      id: 'test-id',
      workspace_id: 'workspace-1',
      repository_type: 'wods' as const,
      title: 'Test Content',
      description: 'Test description',
      content: { pages: [] },
      metadata: {},
      status: 'draft' as const,
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      version: 1,
      tags: []
    }

    store.setCurrentContent(mockContent)

    expect(store.currentContent).toEqual(mockContent)
    expect(store.isEditing).toBe(true)
    expect(store.pageData).toBeTruthy()
    expect(store.pageData?.title).toBe('Test Content')
  })

  it('should mark content as dirty when updated', () => {
    const store = useContentStore.getState()
    
    // Set initial content
    store.setCurrentContent({
      id: 'test-id',
      workspace_id: 'workspace-1',
      repository_type: 'wods' as const,
      title: 'Test',
      description: '',
      content: {},
      metadata: {},
      status: 'draft' as const,
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      version: 1,
      tags: []
    })

    // Update content
    store.updateContent({ title: 'Updated Test' })

    expect(store.isDirty).toBe(true)
    expect(store.currentContent?.title).toBe('Updated Test')
  })

  it('should add blocks to pages correctly', () => {
    const store = useContentStore.getState()
    
    const mockPageData = {
      title: 'Test Page',
      description: 'Test description',
      status: 'draft' as const,
      targetRepository: 'wods' as const,
      pages: [{ id: 'page-1', title: 'Page 1', blocks: [], order: 0 }],
      settings: {
        communities: [],
        tags: [],
        people: [],
        difficulty: 1 as 1 | 2 | 3 | 4 | 5,
        estimatedDuration: 30,
        autoSaveEnabled: true
      }
    }

    const mockBlock = {
      id: 'block-1',
      type: 'text',
      title: 'Test Block',
      description: 'Test description',
      content: 'Test content',
      order: 0,
      pageId: 'page-1',
      data: { content: 'Test content' }
    }

    store.setPageData(mockPageData)
    store.addBlock('page-1', mockBlock)

    expect(store.pageData?.pages[0].blocks).toHaveLength(1)
    expect(store.pageData?.pages[0].blocks[0]).toEqual(mockBlock)
    expect(store.isDirty).toBe(true)
  })

  it('should update blocks correctly', () => {
    const store = useContentStore.getState()
    
    const mockPageData = {
      title: 'Test Page',
      description: 'Test description',
      status: 'draft' as const,
      targetRepository: 'wods' as const,
      pages: [{ 
        id: 'page-1', 
        title: 'Page 1', 
        blocks: [{
          id: 'block-1',
          type: 'text',
          title: 'Original Title',
          description: 'Original description',
          content: 'Original content',
          order: 0,
          pageId: 'page-1',
          data: { content: 'Original content' }
        }], 
        order: 0 
      }],
      settings: {
        communities: [],
        tags: [],
        people: [],
        difficulty: 1 as 1 | 2 | 3 | 4 | 5,
        estimatedDuration: 30,
        autoSaveEnabled: true
      }
    }

    store.setPageData(mockPageData)
    store.updateBlock('page-1', 'block-1', { title: 'Updated Title' })

    const updatedBlock = store.pageData?.pages[0].blocks[0]
    expect(updatedBlock?.title).toBe('Updated Title')
    expect(store.isDirty).toBe(true)
  })

  it('should remove blocks correctly', () => {
    const store = useContentStore.getState()
    
    const mockPageData = {
      title: 'Test Page',
      description: 'Test description',
      status: 'draft' as const,
      targetRepository: 'wods' as const,
      pages: [{ 
        id: 'page-1', 
        title: 'Page 1', 
        blocks: [
          { id: 'block-1', type: 'text', title: 'Block 1', content: '', order: 0, pageId: 'page-1', data: {} },
          { id: 'block-2', type: 'text', title: 'Block 2', content: '', order: 1, pageId: 'page-1', data: {} }
        ], 
        order: 0 
      }],
      settings: {
        communities: [],
        tags: [],
        people: [],
        difficulty: 1 as 1 | 2 | 3 | 4 | 5,
        estimatedDuration: 30,
        autoSaveEnabled: true
      }
    }

    store.setPageData(mockPageData)
    store.removeBlock('page-1', 'block-1')

    expect(store.pageData?.pages[0].blocks).toHaveLength(1)
    expect(store.pageData?.pages[0].blocks[0].id).toBe('block-2')
    expect(store.isDirty).toBe(true)
  })

  it('should reorder blocks correctly', () => {
    const store = useContentStore.getState()
    
    const mockPageData = {
      title: 'Test Page',
      description: 'Test description',
      status: 'draft' as const,
      targetRepository: 'wods' as const,
      pages: [{ 
        id: 'page-1', 
        title: 'Page 1', 
        blocks: [
          { id: 'block-1', type: 'text', title: 'Block 1', content: '', order: 0, pageId: 'page-1', data: {} },
          { id: 'block-2', type: 'text', title: 'Block 2', content: '', order: 1, pageId: 'page-1', data: {} },
          { id: 'block-3', type: 'text', title: 'Block 3', content: '', order: 2, pageId: 'page-1', data: {} }
        ], 
        order: 0 
      }],
      settings: {
        communities: [],
        tags: [],
        people: [],
        difficulty: 1 as 1 | 2 | 3 | 4 | 5,
        estimatedDuration: 30,
        autoSaveEnabled: true
      }
    }

    store.setPageData(mockPageData)
    store.reorderBlocks('page-1', ['block-3', 'block-1', 'block-2'])

    const blocks = store.pageData?.pages[0].blocks
    expect(blocks?.[0].id).toBe('block-3')
    expect(blocks?.[1].id).toBe('block-1')
    expect(blocks?.[2].id).toBe('block-2')
    expect(store.isDirty).toBe(true)
  })

  it('should handle block selection', () => {
    const store = useContentStore.getState()
    
    const testBlock = {
      id: 'block-1',
      type: 'exercise',
      title: 'Test Exercise',
      description: 'Test description',
      content: { reps: 10 },
      order: 0,
      pageId: 'page-1',
      data: { reps: 10 }
    }

    // Select block
    store.setSelectedBlock(testBlock)
    expect(store.selectedBlock).toEqual(testBlock)
    expect(store.showRightPanel).toBe(true)

    // Deselect block
    store.setSelectedBlock(null)
    expect(store.selectedBlock).toBeNull()
    expect(store.showRightPanel).toBe(false)
  })

  it('should manage UI state correctly', () => {
    const store = useContentStore.getState()
    
    // Test left menu state
    store.setActiveLeftMenu('blocks')
    expect(store.activeLeftMenu).toBe('blocks')
    
    // Test repository popup
    store.setRepositoryPopup({ type: 'wods', isOpen: true })
    expect(store.repositoryPopup.type).toBe('wods')
    expect(store.repositoryPopup.isOpen).toBe(true)
    
    // Test preview mode
    store.setShowPreview(true)
    expect(store.showPreview).toBe(true)
    
    // Reset UI state
    store.resetUIState()
    expect(store.activeLeftMenu).toBeNull()
    expect(store.repositoryPopup.isOpen).toBe(false)
    expect(store.showPreview).toBe(false)
  })

  it('should handle error and success messages', () => {
    const store = useContentStore.getState()
    
    // Set error message
    store.setError('Test error message')
    expect(store.error).toBe('Test error message')
    
    // Set success message
    store.setSuccessMessage('Test success message')
    expect(store.successMessage).toBe('Test success message')
    
    // Clear messages
    store.clearMessages()
    expect(store.error).toBeNull()
    expect(store.successMessage).toBeNull()
  })

  it('should track dirty state correctly', () => {
    const store = useContentStore.getState()
    
    // Start clean
    expect(store.isDirty).toBe(false)
    
    // Set content
    store.setCurrentContent({
      id: 'test-id',
      workspace_id: 'workspace-1',
      repository_type: 'wods' as const,
      title: 'Test',
      description: '',
      content: {},
      metadata: {},
      status: 'draft' as const,
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      version: 1,
      tags: []
    })
    
    // Update should mark as dirty
    store.updateContent({ title: 'Updated Test' })
    expect(store.isDirty).toBe(true)
    
    // Simulate save
    store.setLastSaved(new Date())
    expect(store.isDirty).toBe(false)
    expect(store.lastSaved).toBeTruthy()
  })

  it('should handle session management', () => {
    const store = useContentStore.getState()
    
    const initialSessionId = store.sessionId
    expect(initialSessionId).toBeTruthy()
    
    // Generate new session
    store.generateSessionId()
    expect(store.sessionId).not.toBe(initialSessionId)
    expect(store.sessionId).toBeTruthy()
  })
})
