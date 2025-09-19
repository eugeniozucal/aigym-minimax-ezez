# AI GYM Platform - Codebase Architecture Map

## Executive Summary

The AI GYM platform is a sophisticated React-based web application built with TypeScript, featuring a modular page-builder architecture that enables dynamic content creation for fitness training programs (WODs - Workouts of the Day) and educational blocks. The architecture follows modern React patterns with custom hooks, context-based state management, and a comprehensive component hierarchy designed for scalability and maintainability.

## Core Architecture Overview

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom UI components
- **State Management**: React Context API + Custom Hooks
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with Admin RBAC
- **Drag & Drop**: @dnd-kit/core
- **Routing**: React Router v6

### Application Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   ├── layout/          # Layout components (Header, Layout, etc.)
│   ├── modals/          # Modal components
│   ├── training-zone/   # Training Zone specific components
│   ├── page-builder/    # Page builder components
│   └── ContentPicker/   # Content selection components
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
├── lib/                 # Utilities and API communities
└── test/               # Test files
```

## Key Components Analysis

### 1. TrainingZone Components

#### TrainingZoneDashboard (`src/pages/TrainingZoneDashboard.tsx`)
**Purpose**: Main dashboard for managing WODs, Blocks, and Programs

**Key Features**:
- Tab-based navigation (WODs, Blocks, Programs)
- Create/Read/Update/Delete operations
- Search and filtering capabilities
- Direct navigation to WOD Builder
- Crisis prevention patterns with timeout handling

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<ContentType>('wods')
const [searchQuery, setSearchQuery] = useState('')
const [modalState, setModalState] = useState<ModalState>('closed')
const [selectedItem, setSelectedItem] = useState<Mission | Course | null>(null)
```

**Data Dependencies**:
- `useMissions()` hook for WOD data
- `useCourses()` hook for Block data
- `useAuth()` for user context

**Navigation Flow**:
```
TrainingZoneDashboard → WODBuilder (via navigate(`/training-zone/wods/${id}`))
```

#### TrainingZoneRightSidebar (`src/components/training-zone/TrainingZoneRightSidebar.tsx`)
**Purpose**: Context-aware editor panel for block configuration

**Key Features**:
- Block-type specific editing interfaces
- Real-time content updates
- Form validation and state management
- Integration with content repositories

**Props Interface**:
```typescript
interface TrainingZoneRightSidebarProps {
  block: Block
  onBlockUpdate: (blockId: string, updates: Partial<Block>) => void
  onClose: () => void
}
```

### 2. WodBuilder Component (`src/pages/WODBuilder.tsx`)

#### Architecture Overview
**Purpose**: Comprehensive page builder for creating WODs and Blocks

**Core State Structure**:
```typescript
// Page Builder Hook Integration
const {
  structure,              // Mission/Course structure
  currentPage,           // Current page being edited
  selectedBlock,         // Currently selected block
  isEditing,            // Edit mode flag
  previewMode,          // Preview mode flag
  // ... other state and methods
} = usePageBuilder(type === 'wods' ? 'mission' : 'course', id || '')
```

**Key Features**:
1. **Multi-panel Interface**:
   - Left: PersistentIconNavigationRail (blocks palette)
   - Center: Canvas with drag-and-drop editing
   - Right: DynamicRightPanel (block settings)

2. **State Management Crisis Prevention**:
   - Stable state tracking with `mountedRef`
   - Atomic save operations with abort controllers
   - Timeout handling for all async operations
   - Memoized dependencies to prevent render loops

3. **Block Management**:
   - Drag-and-drop reordering with @dnd-kit
   - Real-time content updates
   - Block-specific editor components
   - Auto-deployment of right panel on selection

#### Component Hierarchy:
```
WODBuilder
├── PersistentIconNavigationRail (Left Panel)
├── Main Canvas Area
│   ├── DndContext
│   ├── BlockRenderer (for each block)
│   └── SortableContext
└── TrainingZoneRightSidebar (Right Panel)
```

### 3. RightHandEditorPanel Architecture

The platform implements multiple right-hand editor panels for different contexts:

#### DynamicRightPanel (`src/components/page-builder/DynamicRightPanel.tsx`)
**Purpose**: Generic, configurable right panel for block editing

**Key Features**:
- Tab-based sections: Content, Style, Layout, Advanced
- Block-type specific configurations
- Dynamic form generation based on block type
- Collapsible interface
- Block action controls (move up/down, duplicate, delete)

**Section Structure**:
```typescript
type PanelSection = 'content' | 'style' | 'layout' | 'advanced'

// Block Type Configurations
const BLOCK_TYPE_CONFIGS: Record<BlockType, {
  label: string
  icon: React.ComponentType<any>
  color: string
  contentSettings: string[]
  styleSettings: string[]
  layoutSettings: string[]
}>
```

#### TrainingZoneRightSidebar (Specialized Implementation)
**Purpose**: Training Zone specific right panel with enhanced UX

**Block Type Handlers**:
- `section_header` & `rich_text`: Content editor with formatting
- `list`: Dynamic list management with type selection
- `quote`: Quote text with author attribution
- `image`: Image URL management with repository integration
- `video`, `agent`, `document`, `prompt`, `automation`: Content repository integration
- `quiz`: Quiz builder with settings
- `user_submission`: Form builder interface

### 4. ContentPickerModal Components

#### ContentPicker (`src/components/ContentPicker/ContentPicker.tsx`)
**Purpose**: Universal file browser and uploader for content repositories

**Key Features**:
- Multi-format support (images, videos, PDFs, documents)
- Upload functionality with progress tracking
- Search and filtering capabilities
- Grid/List view modes
- Multi-select capability

**Props Interface**:
```typescript
interface ContentPickerProps {
  fileTypes?: string[]
  onSelect: (file: UploadedFile) => void
  onCancel: () => void
  allowUpload?: boolean
  multiSelect?: boolean
  title?: string
  subtitle?: string
}
```

**State Management**:
```typescript
const [files, setFiles] = useState<UploadedFile[]>([])
const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([])
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
const [selectedFiles, setSelectedFiles] = useState<string[]>([])
```

#### ContentSelectorModal (`src/components/page-builder/modals/ContentSelectorModal.tsx`)
**Purpose**: Specialized modal wrapper for content repository browsing

**Integration Flow**:
```
Block Editor → ContentSelectorModal → ContentRepositoryBrowser → API
```

## State Management Architecture

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

**Purpose**: Global authentication and admin user management

**State Structure**:
```typescript
interface AuthContextType {
  user: User | null           // Supabase user object
  admin: Admin | null         // Admin profile data
  loading: boolean           // Auth loading state
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}
```

**Crisis Prevention Features**:
- Stable user comparison to prevent unnecessary re-renders
- Loading timeout (10 seconds) for production reliability
- Async admin data fetching with cleanup
- Memoized context value to prevent render loops

### 2. Page Builder Hook (`src/hooks/usePageBuilder.ts`)

**Purpose**: Centralized state management for page building operations

**Core State**:
```typescript
const [structure, setStructure] = useState<PageStructureResponse | null>(null)
const [currentPage, setCurrentPage] = useState<Page | null>(null)
const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
const [isEditing, setIsEditing] = useState(false)
const [previewMode, setPreviewMode] = useState(false)
```

**Key Methods**:
- `loadStructure()`: Load page structure with auto-creation of default page
- `createBlock()`: Create new block with atomic operations
- `updateBlock()`: Update block content with optimistic updates
- `reorderBlocks()`: Handle drag-and-drop reordering

**Crisis Prevention**:
- Global creation tracking to prevent race conditions
- Atomic operations with proper error handling
- Cleanup on unmount with AbortController

### 3. Additional Hooks

#### useMissions() & useCourses()
**Purpose**: CRUD operations for WODs and Blocks
- Optimistic updates for UI responsiveness
- Error boundary integration
- Automatic refetching on mount

#### useUserProgress()
**Purpose**: Progress tracking and analytics
- Real-time progress metrics calculation
- Activity tracking with metadata
- Performance optimization with memoization

## Data Flow Architecture

### 1. API Layer (`src/lib/page-builder-api.ts`)

**Structure**:
```typescript
// API modules for different entities
export const missionsApi = { getAll, getById, create, update, delete, ... }
export const coursesApi = { getAll, getById, create, update, delete, ... }
export const pagesApi = { getByParent, getById, create, update, delete, ... }
export const blocksApi = { getByPageId, getById, create, update, delete, ... }
export const progressApi = { trackProgress, getUserProgress, ... }
```

**Edge Function Integration**:
- `page-structure-manager`: Complex page structure operations
- `automated-content-generator`: AI-powered content generation
- `track-user-progress`: Progress tracking with analytics

### 2. Type System (`src/lib/page-builder-types.ts`)

**Core Types**:
```typescript
export type BlockType = 'section_header' | 'rich_text' | 'image' | ...
export interface Block {
  id: string
  page_id: string
  block_type: BlockType
  content: Record<string, any>
  config: Record<string, any>
  style: Record<string, any>
  // ... other fields
}
```

**Block Definitions Registry**:
```typescript
export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  // Complete registry of all block types with metadata
}
```

## Component Relationships & Data Flow

### 1. WOD Creation Flow
```
TrainingZoneDashboard 
  → Create WOD Button 
  → useMissions.createMission() 
  → Navigate to WODBuilder 
  → usePageBuilder.loadStructure()
  → Auto-create Page 1
```

### 2. Block Editing Flow
```
WODBuilder Canvas 
  → Click Block 
  → setSelectedBlock() 
  → Auto-open RightSidebar 
  → TrainingZoneRightSidebar 
  → Block-specific Editor 
  → onBlockUpdate() 
  → usePageBuilder.updateBlock()
```

### 3. Content Selection Flow
```
Block Editor 
  → "Browse" Button 
  → ContentSelectorModal 
  → ContentRepositoryBrowser 
  → API Call 
  → File Selection 
  → Block Content Update
```

## Advanced Architecture Patterns

### 1. Crisis Prevention Patterns

**Timeout Handling**:
```typescript
const timeoutId = setTimeout(() => {
  controller.abort()
  setError('Operation timed out')
}, 30000)
```

**Stable State Management**:
```typescript
const mountedRef = useRef(true)
useEffect(() => {
  return () => { mountedRef.current = false }
}, [])
```

**Memoized Dependencies**:
```typescript
const memoizedPageData = useMemo(() => {
  if (!currentPage) return null
  return { /* stable object structure */ }
}, [currentPage?.id, currentPage?.title, /* specific fields */])
```

### 2. Performance Optimizations

**Lazy Loading**: Components loaded on demand
**Optimistic Updates**: UI updates before API confirmation
**Debounced Operations**: Search and auto-save functionality
**Memoization**: Expensive calculations cached

### 3. Error Boundaries & Recovery

**Component Level**: Individual component error handling
**Operation Level**: API call error recovery
**User Feedback**: Toast notifications and error states
**Graceful Degradation**: Fallback UI components

## Database Schema Integration

### Core Tables
- `missions`: WOD definitions
- `courses`: Block definitions  
- `pages`: Individual pages within WODs/Blocks
- `blocks`: Content blocks within pages
- `user_progress`: Progress tracking
- `uploaded_files`: Content repository

### Relationships
```
Mission/Course (1) → Pages (Many) → Blocks (Many)
User (1) → Progress Records (Many)
ContentRepositories (1) → Blocks (Many) [via content references]
```

## Deployment & Build Architecture

### Build Configuration (`vite.config.ts`)
- TypeScript compilation
- Tailwind CSS processing
- Asset optimization
- Environment variable handling

### Testing Strategy (`src/test/`)
- Component testing with React Testing Library
- Integration tests for page builder
- API mocking for isolated testing

## Security Architecture

### Authentication Flow
1. Supabase Auth integration
2. Admin role verification
3. Row Level Security (RLS) policies
4. Protected route components

### Authorization Patterns
```typescript
<ProtectedRoute requireAdmin>
  <Component />
</ProtectedRoute>
```

## Future Extensibility

### Plugin Architecture Ready
- Block registry system for new block types
- Component factory patterns
- Dynamic editor registration

### API Extensibility
- Versioned API endpoints
- Edge function modular architecture
- Type-safe API community generation

---

## Key Takeaways

1. **Modular Architecture**: Clean separation between UI, state, and API layers
2. **Type Safety**: Comprehensive TypeScript integration throughout
3. **Performance Focus**: Optimistic updates, memoization, and lazy loading
4. **Crisis Prevention**: Robust error handling and timeout management
5. **Extensible Design**: Plugin-ready architecture for future enhancements
6. **User Experience**: Intuitive drag-and-drop interface with real-time feedback

The AI GYM platform demonstrates enterprise-grade React architecture with sophisticated state management, comprehensive error handling, and a user-centric design approach that prioritizes both developer experience and end-user functionality.