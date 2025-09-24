import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { FixedLeftRail } from '@/components/training-zone/components/FixedLeftRail'
import { DeployedLeftMenu } from '@/components/training-zone/components/DeployedLeftMenu'
import { CenterCanvas } from '@/components/training-zone/components/CenterCanvas'
import { RightBlockEditor } from '@/components/training-zone/components/RightBlockEditor'
import { RepositoryPopup } from '@/components/training-zone/components/RepositoryPopup'
import { PreviewModal } from '@/components/training-zone/components/PreviewModal'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { Block, Page, PageData } from '@/types/pageBuilder'

type RepositoryType = 'wods' | 'blocks' | 'programs'

const REPOSITORY_CONFIG = {
  wods: {
    name: 'WOD',
    color: 'orange',
    api: 'wods-api'
  },
  blocks: {
    name: 'BLOCK',
    color: 'blue',
    api: 'workout-blocks-api'
  },
  programs: {
    name: 'PROGRAM',
    color: 'purple',
    api: 'programs-api' // TODO: Implement when backend ready
  }
}

export function PageBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const isEditing = Boolean(id)
  
  // Get target repository from URL params or default to wods
  const targetRepository = (searchParams.get('repo') as RepositoryType) || 'wods'
  const config = REPOSITORY_CONFIG[targetRepository]
  
  // Core state
  const [pageData, setPageData] = useState<PageData>({
    title: `New ${config.name}`,
    description: '',
    status: 'draft',
    targetRepository,
    pages: [{
      id: 'page-1',
      title: 'Page 1',
      blocks: [],
      order: 0
    }],
    settings: {
      communities: [],
      tags: [],
      people: [],
      difficulty: 1,
      estimatedDuration: 30,
      autoSaveEnabled: true
    }
  })
  
  const [currentPageId, setCurrentPageId] = useState('page-1')
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  
  // UI state
  const [activeLeftMenu, setActiveLeftMenu] = useState<string | null>(null)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [repositoryPopup, setRepositoryPopup] = useState<{
    type: string
    isOpen: boolean
  }>({ type: '', isOpen: false })
  const [showPreview, setShowPreview] = useState(false)
  
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    console.log('PageBuilder Effect - ID:', id, 'isEditing:', isEditing, 'targetRepository:', targetRepository)
    if (isEditing && id) {
      console.log('Loading page data for ID:', id)
      loadPageData(id)
    }
  }, [isEditing, id, targetRepository])

  const loadPageData = async (pageId: string) => {
    try {
      setLoading(true)
      
      // Load data based on target repository
      if (targetRepository === 'wods' || targetRepository === 'blocks') {
        // Make API call with specific ID to get individual item
        const functionName = targetRepository === 'wods' ? 'wods-api' : 'workout-blocks-api'
        
        // For edge functions with GET requests and query params, we need to use the direct URL
        const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
        const apiUrl = `${supabaseUrl}/functions/v1/${functionName}?id=${pageId}`
        
        console.log('Loading page data for ID:', pageId)
        console.log('API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          throw new Error(`API call failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        const error = data.error || null

        if (error) {
          throw new Error(error.message || 'Failed to fetch data')
        }

        console.log('API Response:', data)
        console.log('Raw API Response structure:', JSON.stringify(data, null, 2))
        console.log('Response keys:', Object.keys(data || {}))
        
        // Handle both wrapped and direct response structures
        const rawData = data?.data || data
        console.log('Raw data after extraction:', rawData)
        
        if (!rawData) {
          throw new Error('No data returned from API')
        }

        // Get the specific item (should be a single item when ID is provided)
        const itemData = Array.isArray(rawData) 
          ? rawData[0]  // Take first item if array
          : rawData      // Use directly if single object

        console.log('Item Data:', itemData)
        
        if (!itemData) {
          throw new Error('Item not found')
        }

        console.log('Loaded pages:', itemData.pages)
        console.log('Loaded settings:', itemData.settings)
        
        const loadedPageData = {
          id: itemData.id,
          title: itemData.title || `Sample ${config.name}`,
          description: itemData.description || `A sample ${config.name} for testing`,
          status: itemData.status || 'draft',
          targetRepository,
          pages: itemData.pages || [{
            id: 'page-1',
            title: 'Page 1',
            blocks: [],
            order: 0
          }],
          settings: itemData.settings || {
            communities: [],
            tags: itemData.tags || [],
            people: [],
            difficulty: 1,
            estimatedDuration: itemData.estimated_duration_minutes || 30,
            autoSaveEnabled: true
          }
        }
        
        console.log('Final PageData:', loadedPageData)
        setPageData(loadedPageData)
      } else {
        // For programs, use placeholder data for now
        setPageData({
          id: pageId,
          title: `Sample ${config.name}`,
          description: `A sample ${config.name} for testing`,
          status: 'draft',
          targetRepository,
          pages: [{
            id: 'page-1',
            title: 'Page 1',
            blocks: [],
            order: 0
          }],
          settings: {
            communities: [],
            tags: [],
            people: [],
            difficulty: 1,
            estimatedDuration: 30,
            autoSaveEnabled: true
          }
        })
      }
    } catch (err) {
      setError(`Failed to load ${config.name}`)
    } finally {
      setLoading(false)
    }
  }

  const savePageData = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      // Get current user for created_by field
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      
      if (!userId) {
        throw new Error('User not authenticated. Please log in and try again.')
      }
      
      if (targetRepository === 'wods') {
        // Save to WODs API
        const functionName = 'wods-api'
        const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
        const method = isEditing ? 'PUT' : 'POST'
        const apiUrl = isEditing 
          ? `${supabaseUrl}/functions/v1/${functionName}?id=${id}`
          : `${supabaseUrl}/functions/v1/${functionName}`
        
        // Map difficulty number to string
        const difficultyMap = {
          1: 'beginner',
          2: 'beginner', 
          3: 'intermediate',
          4: 'advanced',
          5: 'advanced'
        }
        
        const requestBody = {
          title: pageData.title,
          description: pageData.description,
          status: pageData.status,
          estimated_duration_minutes: pageData.settings.estimatedDuration,
          difficulty_level: difficultyMap[pageData.settings.difficulty] || 'beginner',
          tags: pageData.settings.tags,
          pages: pageData.pages, // Include full page and block structure
          settings: pageData.settings, // Include all settings
          created_by: userId
        }
        
        const response = await fetch(apiUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Save API Error Response:', errorText)
          throw new Error(`Failed to ${isEditing ? 'update' : 'create'} ${config.name}: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        const error = data.error || null

        if (error) {
          throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} ${config.name}`)
        }

        // Show success message and redirect if creating new
        if (!isEditing && data?.data?.id) {
          // Redirect to edit mode for newly created WOD
          navigate(`/page-builder?repo=wods&id=${data.data.id}`)
        }
        
        // Success feedback
        setSuccessMessage(`${config.name} saved successfully!`)
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
        
      } else if (targetRepository === 'blocks') {
        // Save to Workout Blocks API
        const functionName = 'workout-blocks-api'
        const supabaseUrl = 'https://givgsxytkbsdrlmoxzkp.supabase.co'
        const method = isEditing ? 'PUT' : 'POST'
        const apiUrl = isEditing 
          ? `${supabaseUrl}/functions/v1/${functionName}?id=${id}`
          : `${supabaseUrl}/functions/v1/${functionName}`
        
        // Map difficulty number to string
        const difficultyMap = {
          1: 'beginner',
          2: 'beginner',
          3: 'intermediate', 
          4: 'advanced',
          5: 'advanced'
        }
        
        const requestBody = {
          title: pageData.title,
          description: pageData.description,
          status: pageData.status,
          estimated_duration_minutes: pageData.settings.estimatedDuration,
          difficulty_level: difficultyMap[pageData.settings.difficulty] || 'beginner',
          tags: pageData.settings.tags,
          block_category: 'general',
          equipment_needed: [],
          instructions: pageData.description || '',
          pages: pageData.pages, // Include full page and block structure
          settings: pageData.settings, // Include all settings
          created_by: userId
        }
        
        const response = await fetch(apiUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdmdzeHl0a2JzZHJsbW94emtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTM1NTQsImV4cCI6MjA3MTY2OTU1NH0.dUHOfO0-8i90ebOy0HsrZqsoYqwNx1hpbUTRurLcMBA'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Save API Error Response:', errorText)
          throw new Error(`Failed to ${isEditing ? 'update' : 'create'} ${config.name}: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        const error = data.error || null

        if (error) {
          throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} ${config.name}`)
        }

        // Show success message and redirect if creating new
        if (!isEditing && data?.data?.id) {
          // Redirect to edit mode for newly created block
          navigate(`/page-builder?repo=blocks&id=${data.data.id}`)
        }
        
        // Success feedback
        setSuccessMessage(`${config.name} saved successfully!`)
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
        
      } else {
        // For programs, show coming soon message
        setSuccessMessage('Programs save functionality coming soon!')
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
        
        console.log(`Saving ${config.name}:`, pageData)
        // TODO: Implement actual save logic when backend is ready
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to save ${config.name}`
      setError(errorMessage)
      console.error('Save error:', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleLeftMenuToggle = (menuId: string) => {
    console.log('Menu toggle called with:', menuId, 'Current activeLeftMenu:', activeLeftMenu)
    const newActiveMenu = activeLeftMenu === menuId ? null : menuId
    console.log('Setting activeLeftMenu to:', newActiveMenu)
    setActiveLeftMenu(newActiveMenu)
  }

  const handleBlockAdd = (blockType: string) => {
    console.log('handleBlockAdd called with blockType:', blockType)
    if (['video', 'ai-agent', 'document', 'prompt', 'automation', 'image', 'pdf'].includes(blockType)) {
      // CONTENT blocks - open repository popup
      console.log('Opening repository popup for content block:', blockType)
      setRepositoryPopup({ type: blockType, isOpen: true })
    } else {
      // ELEMENTS blocks - add directly to canvas
      console.log('Adding element block to canvas:', blockType)
      const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: blockType,
        data: getDefaultBlockData(blockType),
        order: getCurrentPage().blocks.length,
        pageId: currentPageId
      }
      addBlockToCurrentPage(newBlock)
      setSelectedBlock(newBlock)
      setShowRightPanel(true)
    }
    setActiveLeftMenu(null)
  }

  const handleContentSelect = (contentItem: any) => {
    if (selectedBlock && showRightPanel) {
      // Update existing block when changing content
      const updatedBlock: Block = {
        ...selectedBlock,
        data: {
          ...selectedBlock.data,
          selectedContent: contentItem
        }
      }
      handleBlockUpdate(updatedBlock)
    } else {
      // Create new block when adding content
      const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: repositoryPopup.type,
        data: {
          ...getDefaultBlockData(repositoryPopup.type),
          selectedContent: contentItem
        },
        order: getCurrentPage().blocks.length,
        pageId: currentPageId
      }
      addBlockToCurrentPage(newBlock)
      setSelectedBlock(newBlock)
      setShowRightPanel(true)
    }
    setRepositoryPopup({ type: '', isOpen: false })
  }

  const addBlockToCurrentPage = (block: Block) => {
    setPageData(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === currentPageId
          ? { ...page, blocks: [...page.blocks, block] }
          : page
      )
    }))
  }

  const getCurrentPage = () => {
    return pageData.pages.find(page => page.id === currentPageId) || pageData.pages[0]
  }

  const getDefaultBlockData = (blockType: string) => {
    switch (blockType) {
      case 'section-header':
        return { text: 'Section Title', level: 'h2' }
      case 'rich-text':
        return { content: 'Enter your text here...' }
      case 'list':
        return { items: ['List item 1'], type: 'bulleted' }
      case 'division':
        return { style: 'line' }
      case 'quiz':
        return { title: 'Quiz Title', questions: [] }
      case 'quote':
        return { text: 'Quote text', author: '' }
      case 'image-upload':
        return { file: null, alt: '', caption: '' }
      default:
        return {}
    }
  }

  const handleBlockSelect = (block: Block) => {
    setSelectedBlock(block)
    setShowRightPanel(true)
  }

  const handleBlockUpdate = (updatedBlock: Block) => {
    setPageData(prev => ({
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        blocks: page.blocks.map(block => 
          block.id === updatedBlock.id ? updatedBlock : block
        )
      }))
    }))
    setSelectedBlock(updatedBlock)
  }

  const handleBlockReorder = (blockId: string, direction: 'up' | 'down') => {
    const currentPage = getCurrentPage()
    const blockIndex = currentPage.blocks.findIndex(b => b.id === blockId)
    
    if (
      (direction === 'up' && blockIndex > 0) ||
      (direction === 'down' && blockIndex < currentPage.blocks.length - 1)
    ) {
      const newBlocks = [...currentPage.blocks]
      const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1
      
      // Swap blocks
      ;[newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]]
      
      // Update order property
      newBlocks.forEach((block, index) => {
        block.order = index
      })
      
      setPageData(prev => ({
        ...prev,
        pages: prev.pages.map(page => 
          page.id === currentPageId
            ? { ...page, blocks: newBlocks }
            : page
        )
      }))
    }
  }

  const handleBackToRepository = () => {
    navigate(`/training-zone/${targetRepository}`)
  }

  const handleRepositoryChange = (newRepository: RepositoryType) => {
    const params = new URLSearchParams()
    params.set('repo', newRepository)
    if (id) {
      params.set('id', id)
    }
    navigate(`/page-builder?${params.toString()}`)
  }

  const handleOpenRepository = (contentType: string) => {
    setRepositoryPopup({ type: contentType, isOpen: true })
    // Optionally close the right panel when opening repository
    // setShowRightPanel(false)
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
    // Close other panels when opening preview
    if (!showPreview) {
      setActiveLeftMenu(null)
      setShowRightPanel(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading Page Builder...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Fixed Left Rail */}
      <FixedLeftRail 
        activeMenu={activeLeftMenu}
        onMenuToggle={handleLeftMenuToggle}
      />
      
      {/* Deployed Left Menu */}
      {activeLeftMenu && (
        <>
          {console.log('Rendering DeployedLeftMenu with menuType:', activeLeftMenu)}
          <DeployedLeftMenu
            menuType={activeLeftMenu}
            onBlockAdd={handleBlockAdd}
            onClose={() => setActiveLeftMenu(null)}
            wodData={pageData} // Keep the same prop name for compatibility
            onWodDataUpdate={setPageData}
          />
        </>
      )}
      
      {/* Center Canvas */}
      <div className="flex-1 flex flex-col">
        <CenterCanvas
          wodData={pageData} // Keep the same prop name for compatibility
          currentPageId={currentPageId}
          onPageChange={setCurrentPageId}
          selectedBlock={selectedBlock}
          onBlockSelect={handleBlockSelect}
          onBlockReorder={handleBlockReorder}
          onBackToRepository={handleBackToRepository}
          onSave={savePageData}
          saving={saving}
          targetRepository={targetRepository}
          onRepositoryChange={handleRepositoryChange}
          error={error}
          onClearError={() => setError(null)}
          successMessage={successMessage}
          onClearSuccess={() => setSuccessMessage(null)}
          onPreview={handlePreview}
        />
      </div>
      
      {/* Right Panel - Block Editor */}
      {showRightPanel && selectedBlock && (
        <RightBlockEditor
          block={selectedBlock}
          onBlockUpdate={handleBlockUpdate}
          onClose={() => {
            setShowRightPanel(false)
            setSelectedBlock(null)
          }}
          onOpenRepository={handleOpenRepository}
        />
      )}
      
      {/* Repository Navigation Popup */}
      {repositoryPopup.isOpen && (
        <RepositoryPopup
          contentType={repositoryPopup.type}
          onContentSelect={handleContentSelect}
          onClose={() => setRepositoryPopup({ type: '', isOpen: false })}
        />
      )}
      
      {/* Preview Modal */}
      <PreviewModal
        pageData={pageData}
        currentPageId={currentPageId}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
      
      {/* Save to Repository Dropdown - shown in header */}
      <div className="hidden">
        <select 
          value={targetRepository}
          onChange={(e) => {
            const newRepo = e.target.value as RepositoryType
            const params = new URLSearchParams(searchParams)
            params.set('repo', newRepo)
            navigate(`/page-builder?${params.toString()}`)
          }}
        >
          <option value="wods">Save to WODs</option>
          <option value="blocks">Save to BLOCKS</option>
          <option value="programs">Save to PROGRAMS</option>
        </select>
      </div>
    </div>
  )
}

export default PageBuilder