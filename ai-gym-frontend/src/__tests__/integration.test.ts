/**
 * Integration Test for Save/Load Architecture
 * End-to-end testing of the unified save/load system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useContentStore } from '@/lib/stores/contentStore'

describe('Save/Load Integration Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    useContentStore.getState().resetEditor()
  })

  it('should complete a full save/load cycle', () => {
    const store = useContentStore.getState()
    
    // 1. Create new content
    const newContent = {
      id: 'test-wod-1',
      workspace_id: 'default-workspace',
      repository_type: 'wods' as const,
      title: 'Test WOD',
      description: 'A test workout',
      content: {
        pages: [{
          id: 'page-1',
          title: 'Warm Up',
          blocks: [],
          order: 0
        }],
        settings: {
          difficulty: 2,
          estimatedDuration: 45
        }
      },
      metadata: {},
      status: 'draft' as const,
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      tags: ['strength', 'cardio']
    }

    // 2. Set content in store
    store.setCurrentContent(newContent)
    expect(store.currentContent).toBeTruthy()
    expect(store.isEditing).toBe(true)

    // 3. Add a block to the page
    const testBlock = {
      id: 'block-1',
      type: 'exercise',
      title: 'Push-ups',
      description: '3 sets of 10 reps',
      content: {
        sets: 3,
        reps: 10,
        restTime: 60
      },
      order: 0
    }

    store.addBlock('page-1', testBlock as any)
    expect(store.pageData?.pages[0].blocks).toHaveLength(1)
    expect(store.isDirty).toBe(true)

    // 4. Update block content
    store.updateBlock('page-1', 'block-1', { 
      description: '3 sets of 15 reps',
      content: { sets: 3, reps: 15, restTime: 60 }
    })

    const updatedBlock = store.pageData?.pages[0].blocks[0]
    expect(updatedBlock?.description).toBe('3 sets of 15 reps')
    expect(store.isDirty).toBe(true)

    // 5. Verify state consistency
    expect(store.currentContent?.title).toBe('Test WOD')
    expect(store.pageData?.title).toBe('Test WOD')
    expect(store.sessionId).toBeTruthy()
  })

  it('should handle block reordering', () => {
    const store = useContentStore.getState()
    
    // Set up content with multiple blocks
    const pageData = {
      title: 'Test Workout',
      description: 'Test description',
      status: 'draft' as const,
      targetRepository: 'wods' as const,
      pages: [{
        id: 'page-1',
        title: 'Main Workout',
        blocks: [
          { id: 'block-1', type: 'exercise', title: 'Exercise 1', order: 0 },
          { id: 'block-2', type: 'exercise', title: 'Exercise 2', order: 1 },
          { id: 'block-3', type: 'exercise', title: 'Exercise 3', order: 2 }
        ],
        order: 0
      }],
      settings: {}
    }

    store.setPageData(pageData as any)

    // Reorder blocks
    const newOrder = ['block-3', 'block-1', 'block-2']
    store.reorderBlocks('page-1', newOrder)

    const blocks = store.pageData?.pages[0].blocks
    expect(blocks?.[0].id).toBe('block-3')
    expect(blocks?.[1].id).toBe('block-1')
    expect(blocks?.[2].id).toBe('block-2')
    expect(store.isDirty).toBe(true)
  })

  it('should handle block selection and editing', () => {
    const store = useContentStore.getState()
    
    const testBlock = {
      id: 'block-1',
      type: 'exercise',
      title: 'Test Exercise',
      description: 'Test description',
      content: { reps: 10 },
      order: 0
    }

    // Select block
    store.setSelectedBlock(testBlock as any)
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
      title: 'Test',
      repository_type: 'wods'
    } as any)
    
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

// Mock successful integration test
describe('End-to-End Save/Load Workflow', () => {
  it('should simulate complete user workflow', () => {
    const store = useContentStore.getState()
    
    // Simulate user creating new WOD
    const newWOD = {
      id: 'new-wod-123',
      workspace_id: 'workspace-1',
      repository_type: 'wods' as const,
      title: 'Morning Strength',
      description: 'Full body strength workout',
      content: {
        pages: [{
          id: 'page-1',
          title: 'Workout',
          blocks: [],
          order: 0
        }],
        settings: {
          difficulty: 3,
          estimatedDuration: 60,
          tags: ['strength', 'full-body']
        }
      },
      metadata: {},
      status: 'draft' as const,
      created_by: 'user-123',
      updated_by: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      tags: ['strength', 'full-body']
    }

    // Step 1: Load content
    store.setCurrentContent(newWOD)
    expect(store.isEditing).toBe(true)
    expect(store.currentContent?.title).toBe('Morning Strength')

    // Step 2: Add exercises
    const exercises = [
      {
        id: 'ex-1',
        type: 'exercise',
        title: 'Warm-up',
        description: '5 minutes dynamic stretching',
        content: { duration: 5, type: 'cardio' },
        order: 0
      },
      {
        id: 'ex-2', 
        type: 'exercise',
        title: 'Push-ups',
        description: '3 sets of 12 reps',
        content: { sets: 3, reps: 12, restTime: 60 },
        order: 1
      },
      {
        id: 'ex-3',
        type: 'exercise', 
        title: 'Squats',
        description: '3 sets of 15 reps',
        content: { sets: 3, reps: 15, restTime: 90 },
        order: 2
      }
    ]

    exercises.forEach(exercise => {
      store.addBlock('page-1', exercise as any)
    })

    expect(store.pageData?.pages[0].blocks).toHaveLength(3)
    expect(store.isDirty).toBe(true)

    // Step 3: Edit an exercise
    store.setSelectedBlock(exercises[1] as any)
    expect(store.selectedBlock?.title).toBe('Push-ups')
    expect(store.showRightPanel).toBe(true)

    store.updateBlock('page-1', 'ex-2', { 
      description: '4 sets of 10 reps',
      content: { sets: 4, reps: 10, restTime: 60 }
    })

    // Step 4: Reorder exercises
    store.reorderBlocks('page-1', ['ex-2', 'ex-1', 'ex-3'])
    const reorderedBlocks = store.pageData?.pages[0].blocks
    expect(reorderedBlocks?.[0].id).toBe('ex-2')
    expect(reorderedBlocks?.[1].id).toBe('ex-1')

    // Step 5: Update metadata
    store.updatePageData({ 
      description: 'Updated: Full body strength workout with emphasis on form'
    })

    // Step 6: Simulate save
    store.setLastSaved(new Date())
    expect(store.isDirty).toBe(false)

    // Verify final state
    expect(store.currentContent?.title).toBe('Morning Strength')
    expect(store.pageData?.pages[0].blocks).toHaveLength(3)
    expect(store.lastSaved).toBeTruthy()
  })
})
