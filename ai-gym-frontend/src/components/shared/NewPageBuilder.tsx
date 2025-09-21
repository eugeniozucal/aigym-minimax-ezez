/**
 * PageBuilder - Rebuilt with modern architecture
 * Following research-backed patterns and unified state management
 */

import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useContentStore } from '@/lib/stores/contentStore'
import { useContentItem } from '@/lib/hooks/useContent'
import { useAutoSaveEffect } from '@/lib/hooks/useAutoSave'
import { RepositoryType } from '@/lib/stores/contentStore'

// Component imports (these would need to be updated to use new state management)
import { FixedLeftRail } from '@/components/training-zone/components/FixedLeftRail'
import { DeployedLeftMenu } from '@/components/training-zone/components/DeployedLeftMenu'
import { CenterCanvas } from '@/components/training-zone/components/CenterCanvas'
import { RightBlockEditor } from '@/components/training-zone/components/RightBlockEditor'
import { RepositoryPopup } from '@/components/training-zone/components/RepositoryPopup'
import { PreviewModal } from '@/components/training-zone/components/PreviewModal'

const REPOSITORY_CONFIG = {
  wods: { name: 'WOD', color: 'orange' },
  blocks: { name: 'BLOCK', color: 'blue' },
  programs: { name: 'PROGRAM', color: 'purple' },
  ai_agents: { name: 'AI AGENT', color: 'green' },
  videos: { name: 'VIDEO', color: 'red' },
  documents: { name: 'DOCUMENT', color: 'gray' },
  prompts: { name: 'PROMPT', color: 'yellow' },
  automations: { name: 'AUTOMATION', color: 'indigo' },
  images: { name: 'IMAGE', color: 'pink' },
  pdfs: { name: 'PDF', color: 'teal' }
}

export function PageBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Extract URL parameters
  const id = searchParams.get('id')
  const repositoryType = (searchParams.get('repo') as RepositoryType) || 'wods'
  const isEditing = Boolean(id)
  const config = REPOSITORY_CONFIG[repositoryType]

  // State management from Zustand store
  const {
    currentContent,
    pageData,
    selectedBlock,
    activeLeftMenu,
    showRightPanel,
    repositoryPopup,
    showPreview,
    error,
    successMessage,
    setCurrentContent,
    setPageData,
    setSelectedBlock,
    setActiveLeftMenu,
    setShowRightPanel,
    setRepositoryPopup,
    setShowPreview,
    clearMessages,
    resetEditor
  } = useContentStore()

  // Server state management with TanStack Query
  const {
    data: contentData,
    isLoading,
    error: loadError,
    refetch
  } = useContentItem(id, repositoryType)

  // Auto-save functionality
  const { manualSave, isAutoSaving } = useAutoSaveEffect()

  // Initialize content when data is loaded
  useEffect(() => {
    if (contentData) {
      setCurrentContent(contentData)
    } else if (!isEditing) {
      // Create new content structure
      const newContent = {
        id: `temp-${Date.now()}`,
        workspace_id: 'default-workspace',
        repository_type: repositoryType,
        title: `New ${config.name}`,
        description: '',
        content: {
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
        },
        metadata: {},
        status: 'draft' as const,
        created_by: 'current-user',
        updated_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        tags: []
      }
      setCurrentContent(newContent)
    }
  }, [contentData, isEditing, repositoryType, config.name, setCurrentContent])

  // Handle loading errors
  useEffect(() => {
    if (loadError) {
      console.error('Failed to load content:', loadError)
    }
  }, [loadError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetEditor()
    }
  }, [])

  // Clear messages after timeout
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage, clearMessages])

  // Handle save action
  const handleSave = async () => {
    try {
      await manualSave()
      
      // Navigate to edit mode if this was a new item
      if (!isEditing && currentContent && !currentContent.id.startsWith('temp-')) {
        navigate(`/page-builder?repo=${repositoryType}&id=${currentContent.id}`)
      }
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  // Error boundary fallback
  if (loadError) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Failed to Load {config.name}
            </h2>
            <p className="text-gray-600 mb-4">
              {loadError.message || 'An error occurred while loading the content.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Loading state
  if (isLoading || (!currentContent && isEditing)) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
          <span className="ml-2">Loading {config.name}...</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        {/* Fixed Left Rail */}
        <FixedLeftRail 
          activeMenu={activeLeftMenu}
          onMenuToggle={setActiveLeftMenu}
        />

        {/* Deployed Left Menu */}
        <DeployedLeftMenu
          menuType={activeLeftMenu || ''}
          onBlockAdd={(blockType) => {
            // Handle adding block
            if (pageData && pageData.pages && pageData.pages.length > 0) {
              const currentPage = pageData.pages[0]
              const block = {
                id: `block-${Date.now()}`,
                type: blockType,
                data: {},
                order: currentPage.blocks.length,
                pageId: currentPage.id
              }
              const updatedPages = pageData.pages.map(page => 
                page.id === currentPage.id 
                  ? { ...page, blocks: [...page.blocks, block] }
                  : page
              )
              setPageData({
                ...pageData,
                pages: updatedPages
              })
            }
          }}
          onClose={() => setActiveLeftMenu(null)}
          wodData={pageData}
          onWodDataUpdate={setPageData}
        />

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col">
          <CenterCanvas
            wodData={pageData}
            currentPageId={pageData?.pages?.[0]?.id || 'page-1'}
            onPageChange={() => {}}
            selectedBlock={selectedBlock}
            onBlockSelect={setSelectedBlock}
            onBlockReorder={() => {}}
            onBackToRepository={() => {}}
            onSave={handleSave}
            saving={isAutoSaving}
            targetRepository={repositoryType === 'documents' ? 'wods' : repositoryType as 'wods' | 'blocks' | 'programs'}
            error={error}
            onClearError={clearMessages}
            successMessage={successMessage}
            onClearSuccess={clearMessages}
            onPreview={() => setShowPreview(true)}
          />
        </div>

        {/* Right Panel */}
        {showRightPanel && selectedBlock && (
          <RightBlockEditor
            block={selectedBlock}
            onBlockUpdate={(updatedBlock) => {
              // Update the block in pageData
              if (pageData && pageData.pages) {
                const updatedPages = pageData.pages.map(page => ({
                  ...page,
                  blocks: page.blocks.map(block => 
                    block.id === updatedBlock.id ? updatedBlock : block
                  )
                }))
                setPageData({
                  ...pageData,
                  pages: updatedPages
                })
              }
            }}
            onClose={() => setShowRightPanel(false)}
            onOpenRepository={(contentType) => {
              setRepositoryPopup({ type: contentType, isOpen: true })
            }}
          />
        )}

        {/* Repository Popup */}
        {repositoryPopup.isOpen && (
          <RepositoryPopup
            contentType={repositoryPopup.type}
            onContentSelect={(item) => {
              // Add selected item as a block
              if (pageData && pageData.pages && pageData.pages.length > 0) {
                const currentPage = pageData.pages[0] // Use first page for now
                const block = {
                  id: `block-${Date.now()}`,
                  type: repositoryPopup.type,
                  title: item.title,
                  description: item.description,
                  content: item.content || item,
                  order: currentPage.blocks.length,
                  pageId: currentPage.id,
                  data: item.content || item
                }
                // Add block to current page
                const updatedPages = pageData.pages.map(page => 
                  page.id === currentPage.id 
                    ? { ...page, blocks: [...page.blocks, block] }
                    : page
                )
                setPageData({
                  ...pageData,
                  pages: updatedPages
                })
              }
              setRepositoryPopup({ type: '', isOpen: false })
            }}
            onClose={() => setRepositoryPopup({ type: '', isOpen: false })}
          />
        )}

        {/* Preview Modal */}
        {showPreview && (
          <PreviewModal
            currentPageId={pageData?.id || 'page-1'}
            isOpen={showPreview}
            pageData={pageData}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </Layout>
  )
}
