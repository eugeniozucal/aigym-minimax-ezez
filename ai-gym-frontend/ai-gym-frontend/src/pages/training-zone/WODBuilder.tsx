import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { FixedLeftRail } from './components/FixedLeftRail'
import { DeployedLeftMenu } from './components/DeployedLeftMenu'
import { CenterCanvas } from './components/CenterCanvas'
import { RightBlockEditor } from './components/RightBlockEditor'
import { RepositoryPopup } from './components/RepositoryPopup'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export interface Block {
  id: string
  type: string
  data: any
  order: number
  pageId: string
}

export interface Page {
  id: string
  title: string
  blocks: Block[]
  order: number
}

export interface WODData {
  id?: string
  title: string
  description: string
  status: 'draft' | 'published'
  pages: Page[]
  settings: {
    communities: string[]
    tags: string[]
    people: string[]
    difficulty: 1 | 2 | 3 | 4 | 5
    estimatedDuration: number
    autoSaveEnabled: boolean
  }
}

export function WODBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  // Core state
  const [wodData, setWodData] = useState<WODData>({
    title: 'New WOD',
    description: '',
    status: 'draft',
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
  
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      loadWOD(id)
    }
  }, [isEditing, id])

  const loadWOD = async (wodId: string) => {
    try {
      setLoading(true)
      // Load WOD data from API
      // For now, use sample data
      setWodData({
        id: wodId,
        title: 'Sample WOD',
        description: 'A sample WOD for testing',
        status: 'draft',
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
    } catch (err) {
      setError('Failed to load WOD')
    } finally {
      setLoading(false)
    }
  }

  const saveWOD = async () => {
    try {
      setSaving(true)
      // Save WOD data via API
      console.log('Saving WOD:', wodData)
      // Implement actual save logic here
    } catch (err) {
      setError('Failed to save WOD')
    } finally {
      setSaving(false)
    }
  }

  const handleLeftMenuToggle = (menuId: string) => {
    setActiveLeftMenu(activeLeftMenu === menuId ? null : menuId)
  }

  const handleBlockAdd = (blockType: string) => {
    if (['video', 'ai-agent', 'document', 'prompts', 'automation', 'image', 'pdf'].includes(blockType)) {
      // CONTENT blocks - open repository popup
      setRepositoryPopup({ type: blockType, isOpen: true })
    } else {
      // ELEMENTS blocks - add directly to canvas
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
    setRepositoryPopup({ type: '', isOpen: false })
  }

  const addBlockToCurrentPage = (block: Block) => {
    setWodData(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === currentPageId
          ? { ...page, blocks: [...page.blocks, block] }
          : page
      )
    }))
  }

  const getCurrentPage = () => {
    return wodData.pages.find(page => page.id === currentPageId) || wodData.pages[0]
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
    setWodData(prev => ({
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
      
      setWodData(prev => ({
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
    navigate('/training-zone/wods')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading WOD Builder...</p>
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
        <DeployedLeftMenu
          menuType={activeLeftMenu}
          onBlockAdd={handleBlockAdd}
          onClose={() => setActiveLeftMenu(null)}
          wodData={wodData}
          onWodDataUpdate={setWodData}
        />
      )}
      
      {/* Center Canvas */}
      <div className="flex-1 flex flex-col">
        <CenterCanvas
          wodData={wodData}
          currentPageId={currentPageId}
          onPageChange={setCurrentPageId}
          selectedBlock={selectedBlock}
          onBlockSelect={handleBlockSelect}
          onBlockReorder={handleBlockReorder}
          onBackToRepository={handleBackToRepository}
          onSave={saveWOD}
          saving={saving}
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
    </div>
  )
}

export default WODBuilder