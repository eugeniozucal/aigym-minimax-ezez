// Placeholder content store
import { create } from 'zustand';
export const useContentStore = create((set, get) => ({
    // Initial state
    content: [],
    currentContent: null,
    pageData: {},
    currentPageId: null,
    selectedBlock: null,
    activeLeftMenu: null,
    showRightPanel: false,
    repositoryPopup: null,
    showPreview: false,
    isEditing: false,
    isDirty: false,
    autoSaveEnabled: false,
    autoSaveInterval: 30000,
    error: null,
    successMessage: null,
    sessionId: null,
    lastSaved: null,
    loading: false,
    // Actions
    setContent: (content) => set({ content }),
    setCurrentContent: (content) => set({ currentContent: content, isEditing: !!content }),
    setPageData: (data) => set({ pageData: data, isDirty: true }),
    updatePageData: (data) => set({ pageData: { ...get().pageData, ...data }, isDirty: true }),
    setSelectedBlock: (block) => set({ selectedBlock: block, showRightPanel: !!block }),
    setActiveLeftMenu: (menu) => set({ activeLeftMenu: menu }),
    setShowRightPanel: (show) => set({ showRightPanel: show }),
    setRepositoryPopup: (popup) => set({ repositoryPopup: popup }),
    setShowPreview: (show) => set({ showPreview: show }),
    setError: (error) => set({ error }),
    setSuccessMessage: (message) => set({ successMessage: message }),
    clearMessages: () => set({ error: null, successMessage: null }),
    resetEditor: () => set({
        currentContent: null,
        pageData: {},
        isEditing: false,
        isDirty: false,
        selectedBlock: null,
        showRightPanel: false
    }),
    resetUIState: () => set({
        activeLeftMenu: null,
        repositoryPopup: null,
        showPreview: false
    }),
    // Block operations
    addBlock: (block) => {
        const currentBlocks = get().pageData.blocks || [];
        set({
            pageData: { ...get().pageData, blocks: [...currentBlocks, block] },
            isDirty: true
        });
    },
    updateBlock: (id, block) => {
        const currentBlocks = get().pageData.blocks || [];
        const updatedBlocks = currentBlocks.map((b) => b.id === id ? { ...b, ...block } : b);
        set({
            pageData: { ...get().pageData, blocks: updatedBlocks },
            isDirty: true
        });
    },
    removeBlock: (id) => {
        const currentBlocks = get().pageData.blocks || [];
        const filteredBlocks = currentBlocks.filter((b) => b.id !== id);
        set({
            pageData: { ...get().pageData, blocks: filteredBlocks },
            isDirty: true
        });
    },
    reorderBlocks: (blocks) => {
        set({
            pageData: { ...get().pageData, blocks },
            isDirty: true
        });
    },
    // Content operations
    updateContent: (content) => set({ currentContent: content, isDirty: true }),
    setLastSaved: (date) => set({ lastSaved: date, isDirty: false }),
    generateSessionId: () => set({ sessionId: Math.random().toString(36).substr(2, 9) }),
    // Loading state
    setLoading: (loading) => set({ loading }),
}));
// Export individual hooks for convenience
export const usePageData = () => useContentStore((state) => state.pageData);
export const useCurrentContent = () => useContentStore((state) => state.currentContent);
export const useSelectedBlock = () => useContentStore((state) => state.selectedBlock);
export const useUIState = () => useContentStore((state) => ({
    activeLeftMenu: state.activeLeftMenu,
    showRightPanel: state.showRightPanel,
    repositoryPopup: state.repositoryPopup,
    showPreview: state.showPreview,
    error: state.error,
    successMessage: state.successMessage,
}));
export const useIsDirty = () => useContentStore((state) => state.isDirty);
export const useIsAutoSaving = () => useContentStore((state) => state.autoSaveEnabled);
