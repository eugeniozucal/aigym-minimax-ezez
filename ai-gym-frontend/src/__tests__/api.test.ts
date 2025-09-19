/**
 * API Client Tests - Comprehensive testing for the unified API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { contentApi, __testing__, APIError, ValidationError, TimeoutError } from '@/lib/api/contentApi'

// Mock Supabase
const mockInvoke = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    }
  }
}))

describe('Content API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __testing__.clearCache()
  })

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const mockResponse = {
        data: { id: 'test-id', title: 'Test WOD' },
        error: null
      }
      
      mockInvoke.mockResolvedValue(mockResponse)

      // Make two identical requests simultaneously
      const [result1, result2] = await Promise.all([
        contentApi.getById('test-id', 'wods'),
        contentApi.getById('test-id', 'wods')
      ])

      // Should only make one API call
      expect(mockInvoke).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('should not deduplicate different requests', async () => {
      const mockResponse1 = {
        data: { id: 'test-id-1', title: 'Test WOD 1' },
        error: null
      }
      const mockResponse2 = {
        data: { id: 'test-id-2', title: 'Test WOD 2' },
        error: null
      }
      
      mockInvoke.mockResolvedValueOnce(mockResponse1)
                .mockResolvedValueOnce(mockResponse2)

      // Make two different requests
      const [result1, result2] = await Promise.all([
        contentApi.getById('test-id-1', 'wods'),
        contentApi.getById('test-id-2', 'wods')
      ])

      // Should make two API calls
      expect(mockInvoke).toHaveBeenCalledTimes(2)
      expect(result1.id).toBe('test-id-1')
      expect(result2.id).toBe('test-id-2')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      const apiError = {
        message: 'Not found',
        code: 'NOT_FOUND'
      }
      
      mockInvoke.mockResolvedValue({
        error: apiError,
        data: null
      })

      await expect(contentApi.getById('nonexistent-id', 'wods'))
        .rejects.toThrow(APIError)
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      networkError.name = 'TypeError'
      
      mockInvoke.mockRejectedValue(networkError)

      await expect(contentApi.getById('test-id', 'wods'))
        .rejects.toThrow(APIError)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        id: 'invalid-uuid', // Invalid UUID format
        title: '',  // Empty title
        repository_type: 'invalid-type'
      }
      
      mockInvoke.mockResolvedValue({
        data: invalidData,
        error: null
      })

      await expect(contentApi.getById('test-id', 'ai_agents'))
        .rejects.toThrow()
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      const networkError = new Error('Network error')
      const successResponse = {
        data: { id: 'test-id', title: 'Test WOD' },
        error: null
      }
      
      mockInvoke.mockRejectedValueOnce(networkError)
                .mockResolvedValueOnce(successResponse)

      const result = await contentApi.getById('test-id', 'wods')
      
      expect(mockInvoke).toHaveBeenCalledTimes(2)
      expect(result.id).toBe('test-id')
    })

    it('should not retry validation errors', async () => {
      const validationError = new ValidationError('Invalid data', [])
      
      mockInvoke.mockRejectedValue(validationError)

      await expect(contentApi.getById('test-id', 'wods'))
        .rejects.toThrow(ValidationError)
      
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cache Management', () => {
    it('should track cache size correctly', () => {
      const initialSize = __testing__.getCacheSize()
      expect(initialSize).toBe(0)

      // Cache size should be managed internally
      expect(typeof __testing__.getCacheSize()).toBe('number')
    })

    it('should clear cache', () => {
      __testing__.clearCache()
      expect(__testing__.getCacheSize()).toBe(0)
    })
  })

  describe('Legacy API Transformation', () => {
    it('should transform WOD responses correctly', async () => {
      const legacyResponse = {
        data: {
          id: 'wod-1',
          title: 'Morning WOD',
          description: 'Great workout',
          status: 'published',
          created_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          tags: ['strength', 'cardio']
        },
        error: null
      }
      
      mockInvoke.mockResolvedValue(legacyResponse)

      const result = await contentApi.getById('wod-1', 'wods')
      
      expect(result.repository_type).toBe('wods')
      expect(result.title).toBe('Morning WOD')
      expect(result.content).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('should transform Block responses correctly', async () => {
      const legacyResponse = {
        data: {
          id: 'block-1',
          title: 'Push-up Block',
          instructions: '3 sets of 10 reps',
          equipment_needed: ['mat'],
          block_category: 'strength',
          status: 'published',
          created_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        error: null
      }
      
      mockInvoke.mockResolvedValue(legacyResponse)

      const result = await contentApi.getById('block-1', 'blocks')
      
      expect(result.repository_type).toBe('blocks')
      expect(result.content.instructions).toBe('3 sets of 10 reps')
      expect(result.content.equipment_needed).toEqual(['mat'])
      expect(result.content.block_category).toBe('strength')
    })
  })

  describe('CRUD Operations', () => {
    it('should create content correctly', async () => {
      const newContent = {
        workspace_id: 'workspace-1',
        repository_type: 'wods' as const,
        title: 'New WOD',
        description: 'Test description',
        content: { pages: [] },
        metadata: {},
        status: 'draft' as const,
        created_by: 'user-1',
        updated_by: 'user-1',
        tags: []
      }

      const createResponse = {
        data: {
          ...newContent,
          id: 'new-wod-id',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          version: 1
        },
        error: null
      }
      
      mockInvoke.mockResolvedValue(createResponse)

      const result = await contentApi.create(newContent)
      
      expect(result.id).toBe('new-wod-id')
      expect(result.title).toBe('New WOD')
      expect(mockInvoke).toHaveBeenCalledWith('wods-api', {
        body: expect.objectContaining({
          action: 'create',
          title: 'New WOD'
        })
      })
    })

    it('should update content correctly', async () => {
      const updates = {
        title: 'Updated WOD',
        description: 'Updated description'
      }

      const updateResponse = {
        data: {
          id: 'wod-1',
          ...updates,
          repository_type: 'wods',
          content: {},
          metadata: {},
          status: 'draft',
          created_by: 'user-1',
          updated_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          version: 2,
          tags: []
        },
        error: null
      }
      
      mockInvoke.mockResolvedValue(updateResponse)

      const result = await contentApi.update('wod-1', 'wods', updates)
      
      expect(result.title).toBe('Updated WOD')
      expect(result.version).toBe(2)
    })

    it('should delete content correctly', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null
      })

      await expect(contentApi.delete('wod-1', 'wods')).resolves.not.toThrow()
      
      expect(mockInvoke).toHaveBeenCalledWith('wods-api', {
        body: expect.objectContaining({
          action: 'delete',
          id: 'wod-1'
        })
      })
    })

    it('should list content correctly', async () => {
      const listResponse = {
        data: [
          {
            id: 'wod-1',
            title: 'WOD 1',
            repository_type: 'wods',
            status: 'published'
          },
          {
            id: 'wod-2', 
            title: 'WOD 2',
            repository_type: 'wods',
            status: 'draft'
          }
        ],
        error: null
      }
      
      mockInvoke.mockResolvedValue(listResponse)

      const result = await contentApi.list('wods', { status: 'published' })
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('WOD 1')
    })
  })

  describe('Auto-save Functionality', () => {
    it('should perform auto-save correctly', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null
      })

      await expect(
        contentApi.autoSave(
          'content-1',
          'session-123',
          { pages: [] },
          { lastSaved: new Date().toISOString() }
        )
      ).resolves.not.toThrow()
      
      expect(mockInvoke).toHaveBeenCalledWith('content-management-api', {
        body: expect.objectContaining({
          action: 'auto_save',
          content_id: 'content-1',
          session_id: 'session-123'
        })
      })
    })

    it('should get auto-save snapshots correctly', async () => {
      const snapshots = [
        { id: 'snap-1', content: { pages: [] }, created_at: '2023-01-01T00:00:00Z' },
        { id: 'snap-2', content: { pages: [] }, created_at: '2023-01-01T00:01:00Z' }
      ]
      
      mockInvoke.mockResolvedValue({
        data: snapshots,
        error: null
      })

      const result = await contentApi.getAutoSaveSnapshots('content-1', 'session-123')
      
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
    })
  })

  describe('Batch Operations', () => {
    it('should handle batch updates correctly', async () => {
      const updates = [
        { id: 'wod-1', repositoryType: 'wods' as const, updates: { title: 'Updated WOD 1' } },
        { id: 'wod-2', repositoryType: 'wods' as const, updates: { title: 'Updated WOD 2' } }
      ]

      // Mock successful responses for both updates
      mockInvoke.mockResolvedValueOnce({
        data: { id: 'wod-1', title: 'Updated WOD 1', repository_type: 'wods' },
        error: null
      }).mockResolvedValueOnce({
        data: { id: 'wod-2', title: 'Updated WOD 2', repository_type: 'wods' },
        error: null
      })

      const results = await contentApi.batchUpdate(updates)
      
      expect(results).toHaveLength(2)
      expect(results[0].title).toBe('Updated WOD 1')
      expect(results[1].title).toBe('Updated WOD 2')
    })

    it('should handle partial failures in batch operations', async () => {
      const updates = [
        { id: 'wod-1', repositoryType: 'wods' as const, updates: { title: 'Updated WOD 1' } },
        { id: 'invalid-id', repositoryType: 'wods' as const, updates: { title: 'Invalid Update' } }
      ]

      // Mock one success and one failure
      mockInvoke.mockResolvedValueOnce({
        data: { id: 'wod-1', title: 'Updated WOD 1', repository_type: 'wods' },
        error: null
      })
      .mockRejectedValueOnce(new Error('Not found'))

      const results = await contentApi.batchUpdate(updates)
      
      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })
})
