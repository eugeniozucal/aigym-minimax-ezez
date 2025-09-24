# AI Gym Save/Load Architecture Design - Technical Specifications

## Executive Summary

This document presents a comprehensive redesign of the AI Gym application's save/load architecture, addressing critical flaws identified in the current implementation. The new architecture employs modern React patterns including Zustand for client state management, TanStack Query for server state, a robust API abstraction layer, and component-based design principles. Key innovations include optimistic updates with automatic rollback, debounced auto-save functionality, type-safe data validation, and comprehensive error handling with user-friendly feedback systems.

## 1. Current Problems Summary

The audit revealed severe architectural issues:
- **State Management Chaos**: 9+ scattered state variables with no single source of truth
- **URL Parameter Dependency Hell**: No validation, silent fallbacks masking errors  
- **API Integration Anti-Patterns**: Direct Supabase calls with inconsistent error handling
- **Component Architecture Issues**: Tight coupling, mixed concerns in components
- **Performance Problems**: Unnecessary re-renders, race conditions in data fetching
- **Security Gaps**: No input validation, inline authentication checks

## 2. New Database Schema Design

### 2.1 Core Entity Relationships

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces for multi-tenancy
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT workspace_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- Repository types with proper enumeration
CREATE TYPE repository_type AS ENUM ('wods', 'blocks', 'programs');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE operation_type AS ENUM ('create', 'update', 'delete', 'restore');

-- Content items (replaces separate wods/blocks/programs tables)
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_type repository_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    status content_status DEFAULT 'draft',
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT content_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 255),
    CONSTRAINT content_description_length CHECK (char_length(description) <= 5000),
    CONSTRAINT content_version_positive CHECK (version > 0)
);

-- Folders for organization
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_type repository_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT folder_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
    CONSTRAINT folder_no_self_reference CHECK (id != parent_id)
);

-- Content history for versioning and audit
CREATE TABLE content_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    status content_status NOT NULL,
    operation_type operation_type NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, version)
);

-- Auto-save snapshots for recovery
CREATE TABLE auto_save_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Keep only last 10 snapshots per session
    CONSTRAINT auto_save_session_limit CHECK (
        (SELECT COUNT(*) FROM auto_save_snapshots WHERE content_id = NEW.content_id AND session_id = NEW.session_id) <= 10
    )
);
```

### 2.2 Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_content_items_workspace_repo ON content_items(workspace_id, repository_type);
CREATE INDEX idx_content_items_folder ON content_items(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX idx_content_items_created_by ON content_items(created_by);
CREATE INDEX idx_content_items_updated_at ON content_items(updated_at DESC);
CREATE INDEX idx_content_items_status ON content_items(status);

-- Full-text search
CREATE INDEX idx_content_items_search ON content_items USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- History indexes
CREATE INDEX idx_content_history_content_version ON content_history(content_id, version DESC);
CREATE INDEX idx_content_history_created_at ON content_history(created_at DESC);

-- Folder hierarchy queries
CREATE INDEX idx_folders_parent ON folders(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_folders_workspace_repo ON folders(workspace_id, repository_type);

-- Auto-save cleanup
CREATE INDEX idx_auto_save_created_at ON auto_save_snapshots(created_at);
```

### 2.3 Database Triggers and Functions

```sql
-- Auto-increment version trigger
CREATE OR REPLACE FUNCTION fn_increment_version()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
        NEW.version = OLD.version + 1;
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_increment_version
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_increment_version();

-- History tracking trigger
CREATE OR REPLACE FUNCTION fn_track_content_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO content_history(
            content_id, version, title, description, content, metadata, 
            status, operation_type, created_by
        ) VALUES (
            NEW.id, NEW.version, NEW.title, NEW.description, NEW.content, 
            NEW.metadata, NEW.status, 'create', NEW.created_by
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
        INSERT INTO content_history(
            content_id, version, title, description, content, metadata, 
            status, operation_type, created_by
        ) VALUES (
            NEW.id, NEW.version, NEW.title, NEW.description, NEW.content, 
            NEW.metadata, NEW.status, 'update', NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_track_content_history
    AFTER INSERT OR UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_track_content_history();

-- Auto-save cleanup function
CREATE OR REPLACE FUNCTION fn_cleanup_auto_save()
RETURNS void AS $$
BEGIN
    -- Delete auto-save snapshots older than 24 hours
    DELETE FROM auto_save_snapshots 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    -- Keep only the latest 10 snapshots per content item per session
    WITH ranked_snapshots AS (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY content_id, session_id 
                   ORDER BY created_at DESC
               ) as rn
        FROM auto_save_snapshots
    )
    DELETE FROM auto_save_snapshots 
    WHERE id IN (
        SELECT id FROM ranked_snapshots WHERE rn > 10
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job (run every hour)
SELECT cron.schedule('auto-save-cleanup', '0 * * * *', 'SELECT fn_cleanup_auto_save();');
```

## 3. Modern State Management Architecture

### 3.1 State Architecture Overview

```typescript
// State architecture layers
interface StateArchitecture {
  clientState: ZustandStore;      // UI state, forms, selections
  serverState: TanStackQuery;     // API data, caching, mutations
  urlState: URLSearchParams;      // Route params, filters, pagination
  persistentState: LocalStorage;  // User preferences, drafts
}
```

### 3.2 Zustand Client State Management

```typescript
// types/state.ts
export interface PageBuilderState {
  // Core data
  currentPage: PageData | null;
  selectedBlockId: string | null;
  
  // UI state
  activePanel: 'blocks' | 'properties' | 'repository' | null;
  showRepositoryPopup: boolean;
  draggedItem: DraggedItem | null;
  
  // Form state
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  setCurrentPage: (page: PageData | null) => void;
  selectBlock: (blockId: string | null) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  addBlock: (block: Block, targetId?: string, position?: 'before' | 'after' | 'inside') => void;
  removeBlock: (blockId: string) => void;
  setActivePanel: (panel: PageBuilderState['activePanel']) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  reset: () => void;
}

// stores/pageBuilderStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const usePageBuilderStore = create<PageBuilderState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      currentPage: null,
      selectedBlockId: null,
      activePanel: null,
      showRepositoryPopup: false,
      draggedItem: null,
      isEditing: false,
      hasUnsavedChanges: false,
      
      // Actions with Immer for immutable updates
      setCurrentPage: (page) => set((state) => {
        state.currentPage = page;
        state.hasUnsavedChanges = false;
        state.selectedBlockId = null;
      }),
      
      selectBlock: (blockId) => set((state) => {
        state.selectedBlockId = blockId;
        state.activePanel = blockId ? 'properties' : null;
      }),
      
      updateBlock: (blockId, updates) => set((state) => {
        if (state.currentPage) {
          const block = findBlockById(state.currentPage.blocks, blockId);
          if (block) {
            Object.assign(block, updates);
            state.hasUnsavedChanges = true;
          }
        }
      }),
      
      addBlock: (block, targetId, position = 'after') => set((state) => {
        if (state.currentPage) {
          const blocks = state.currentPage.blocks;
          if (targetId) {
            const targetIndex = blocks.findIndex(b => b.id === targetId);
            if (targetIndex !== -1) {
              const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
              blocks.splice(insertIndex, 0, block);
            }
          } else {
            blocks.push(block);
          }
          state.hasUnsavedChanges = true;
          state.selectedBlockId = block.id;
        }
      }),
      
      removeBlock: (blockId) => set((state) => {
        if (state.currentPage) {
          state.currentPage.blocks = state.currentPage.blocks.filter(b => b.id !== blockId);
          if (state.selectedBlockId === blockId) {
            state.selectedBlockId = null;
          }
          state.hasUnsavedChanges = true;
        }
      }),
      
      setActivePanel: (panel) => set((state) => {
        state.activePanel = panel;
      }),
      
      setHasUnsavedChanges: (hasChanges) => set((state) => {
        state.hasUnsavedChanges = hasChanges;
      }),
      
      reset: () => set(() => ({
        currentPage: null,
        selectedBlockId: null,
        activePanel: null,
        showRepositoryPopup: false,
        draggedItem: null,
        isEditing: false,
        hasUnsavedChanges: false,
      }))
    })),
    { name: 'page-builder-store' }
  )
);

// Utility function for nested block finding
function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return null;
}
```

### 3.3 TanStack Query Server State Management

```typescript
// hooks/useContentQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/contentApi';
import { usePageBuilderStore } from '../stores/pageBuilderStore';
import { toast } from 'react-hot-toast';

// Query keys factory
export const contentQueryKeys = {
  all: ['content'] as const,
  lists: () => [...contentQueryKeys.all, 'list'] as const,
  list: (filters: ContentFilters) => [...contentQueryKeys.lists(), filters] as const,
  details: () => [...contentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentQueryKeys.details(), id] as const,
};

// Content list query with caching
export const useContentList = (filters: ContentFilters) => {
  return useQuery({
    queryKey: contentQueryKeys.list(filters),
    queryFn: () => contentApi.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
  });
};

// Content detail query
export const useContentDetail = (id: string | null) => {
  const setCurrentPage = usePageBuilderStore(state => state.setCurrentPage);
  
  return useQuery({
    queryKey: contentQueryKeys.detail(id!),
    queryFn: () => contentApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000, // 2 minutes for editing context
    onSuccess: (data) => {
      // Automatically sync to client state
      setCurrentPage(data);
    },
  });
};

// Create content mutation with optimistic updates
export const useCreateContent = () => {
  const queryClient = useQueryClient();
  const reset = usePageBuilderStore(state => state.reset);
  
  return useMutation({
    mutationFn: contentApi.create,
    
    onMutate: async (newContent) => {
      const toastId = toast.loading('Creating content...');
      return { toastId };
    },
    
    onSuccess: (data, variables, context) => {
      // Update cache with new item
      queryClient.setQueryData(
        contentQueryKeys.detail(data.id),
        data
      );
      
      // Invalidate list queries to show new item
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists()
      });
      
      toast.success('Content created successfully!', {
        id: context.toastId
      });
      
      return data;
    },
    
    onError: (error, variables, context) => {
      toast.error(`Failed to create content: ${error.message}`, {
        id: context?.toastId
      });
    }
  });
};

// Update content mutation with optimistic updates
export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  const setHasUnsavedChanges = usePageBuilderStore(state => state.setHasUnsavedChanges);
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ContentItem> }) =>
      contentApi.update(id, updates),
    
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: contentQueryKeys.detail(id)
      });
      
      // Snapshot previous value
      const previousContent = queryClient.getQueryData(contentQueryKeys.detail(id));
      
      // Optimistically update cache
      queryClient.setQueryData(
        contentQueryKeys.detail(id),
        (oldData: ContentItem | undefined) => 
          oldData ? { ...oldData, ...updates } : undefined
      );
      
      setHasUnsavedChanges(false);
      
      return { previousContent };
    },
    
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousContent) {
        queryClient.setQueryData(
          contentQueryKeys.detail(id),
          context.previousContent
        );
      }
      setHasUnsavedChanges(true);
      
      toast.error(`Save failed: ${error.message}`);
    },
    
    onSettled: (data, error, { id }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.detail(id)
      });
    }
  });
};

// Auto-save mutation with debouncing
export const useAutoSave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contentApi.autoSave,
    
    onSuccess: (data) => {
      // Silently update cache without invalidation
      queryClient.setQueryData(
        contentQueryKeys.detail(data.contentId),
        (oldData: ContentItem | undefined) => 
          oldData ? { ...oldData, lastAutoSave: data.timestamp } : undefined
      );
    },
    
    onError: (error) => {
      // Silent auto-save failures - don't show toast
      console.warn('Auto-save failed:', error.message);
    }
  });
};
```

### 3.4 URL State Management

```typescript
// hooks/useURLState.ts
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

// URL parameter schema validation
const PageBuilderURLSchema = z.object({
  repo: z.enum(['wods', 'blocks', 'programs']).default('wods'),
  id: z.string().uuid().optional(),
  view: z.enum(['edit', 'preview']).default('edit'),
  panel: z.enum(['blocks', 'properties', 'repository']).optional(),
});

export type PageBuilderURLParams = z.infer<typeof PageBuilderURLSchema>;

export const useURLState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Parse and validate URL parameters
  const urlParams = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    const result = PageBuilderURLSchema.safeParse(params);
    
    if (!result.success) {
      console.warn('Invalid URL parameters:', result.error);
      return PageBuilderURLSchema.parse({}); // Return defaults
    }
    
    return result.data;
  }, [searchParams]);
  
  // Update URL parameters with validation
  const updateURLParams = useCallback((updates: Partial<PageBuilderURLParams>) => {
    const newParams = { ...urlParams, ...updates };
    const validatedParams = PageBuilderURLSchema.parse(newParams);
    
    setSearchParams(
      Object.fromEntries(
        Object.entries(validatedParams).filter(([_, value]) => value !== undefined)
      )
    );
  }, [urlParams, setSearchParams]);
  
  // Navigate to content with proper URL structure
  const navigateToContent = useCallback((contentId: string, repo: PageBuilderURLParams['repo']) => {
    navigate(`/page-builder?repo=${repo}&id=${contentId}&view=edit`);
  }, [navigate]);
  
  // Navigate to list view
  const navigateToList = useCallback((repo: PageBuilderURLParams['repo']) => {
    navigate(`/page-builder?repo=${repo}`);
  }, [navigate]);
  
  return {
    urlParams,
    updateURLParams,
    navigateToContent,
    navigateToList,
    isEditing: Boolean(urlParams.id),
    currentRepo: urlParams.repo,
    currentId: urlParams.id,
  };
};
```

## 4. API Design with Error Handling and Optimistic Updates

### 4.1 API Client Architecture

```typescript
// api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { z } from 'zod';

// API response schemas
const APIResponseSchema = z.object({
  data: z.unknown(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
  }).optional(),
});

const APIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type APIResponse<T> = {
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
};

export type APIError = z.infer<typeof APIErrorSchema>;

// Custom error classes
export class APIClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// API client configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    // Add authentication token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Validate response structure
    const validation = APIResponseSchema.safeParse(response.data);
    if (!validation.success) {
      console.warn('Invalid API response structure:', validation.error);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      throw new NetworkError('Request timeout');
    }
    
    if (!error.response) {
      throw new NetworkError('Network connection failed');
    }
    
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Handle authentication errors
        supabase.auth.signOut();
        window.location.href = '/login';
        throw new APIClientError('AUTHENTICATION_REQUIRED', 'Please log in to continue');
        
      case 403:
        throw new APIClientError('FORBIDDEN', 'You do not have permission to perform this action');
        
      case 422:
        // Handle validation errors
        const validationData = data as { errors?: Record<string, string[]> };
        throw new ValidationError(
          'Validation failed',
          validationData.errors || {}
        );
        
      case 429:
        throw new APIClientError('RATE_LIMITED', 'Too many requests. Please try again later.');
        
      case 500:
        throw new APIClientError('SERVER_ERROR', 'Server error. Please try again later.');
        
      default:
        const errorData = APIErrorSchema.safeParse(data);
        if (errorData.success) {
          throw new APIClientError(
            errorData.data.code,
            errorData.data.message,
            errorData.data.details
          );
        }
        
        throw new APIClientError(
          'UNKNOWN_ERROR',
          'An unexpected error occurred'
        );
    }
  }
);

// Generic API request wrapper with retry logic
export async function apiRequest<T>(
  config: AxiosRequestConfig,
  maxRetries = 3
): Promise<APIResponse<T>> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiClient(config);
      return response.data as APIResponse<T>;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIClientError && error.code !== 'RATE_LIMITED') {
        throw error;
      }
      
      // Exponential backoff for retries
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### 4.2 Content API Implementation

```typescript
// api/contentApi.ts
import { apiRequest, APIResponse } from './client';
import { z } from 'zod';

// Type definitions
const ContentItemSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  repositoryType: z.enum(['wods', 'blocks', 'programs']),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  content: z.record(z.unknown()),
  metadata: z.record(z.unknown()),
  status: z.enum(['draft', 'published', 'archived']),
  folderId: z.string().uuid().optional(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().positive(),
});

const ContentFiltersSchema = z.object({
  repositoryType: z.enum(['wods', 'blocks', 'programs']),
  workspaceId: z.string().uuid(),
  folderId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;
export type ContentFilters = z.infer<typeof ContentFiltersSchema>;

const CreateContentSchema = ContentItemSchema.omit({
  id: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

const UpdateContentSchema = CreateContentSchema.partial().omit({
  workspaceId: true,
});

export type CreateContentData = z.infer<typeof CreateContentSchema>;
export type UpdateContentData = z.infer<typeof UpdateContentSchema>;

// Content API implementation
export const contentApi = {
  // Get list of content items with filtering
  async getList(filters: ContentFilters): Promise<{
    items: ContentItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const validatedFilters = ContentFiltersSchema.parse(filters);
    
    const response = await apiRequest<{
      items: ContentItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>({
      method: 'GET',
      url: '/content',
      params: validatedFilters,
    });
    
    // Validate response data
    const items = response.data.items.map(item => ContentItemSchema.parse(item));
    
    return {
      items,
      pagination: response.data.pagination,
    };
  },
  
  // Get single content item by ID
  async getById(id: string): Promise<ContentItem> {
    z.string().uuid().parse(id);
    
    const response = await apiRequest<ContentItem>({
      method: 'GET',
      url: `/content/${id}`,
    });
    
    return ContentItemSchema.parse(response.data);
  },
  
  // Create new content item
  async create(data: CreateContentData): Promise<ContentItem> {
    const validatedData = CreateContentSchema.parse(data);
    
    const response = await apiRequest<ContentItem>({
      method: 'POST',
      url: '/content',
      data: validatedData,
    });
    
    return ContentItemSchema.parse(response.data);
  },
  
  // Update existing content item
  async update(id: string, data: UpdateContentData): Promise<ContentItem> {
    z.string().uuid().parse(id);
    const validatedData = UpdateContentSchema.parse(data);
    
    const response = await apiRequest<ContentItem>({
      method: 'PATCH',
      url: `/content/${id}`,
      data: validatedData,
    });
    
    return ContentItemSchema.parse(response.data);
  },
  
  // Delete content item
  async delete(id: string): Promise<void> {
    z.string().uuid().parse(id);
    
    await apiRequest({
      method: 'DELETE',
      url: `/content/${id}`,
    });
  },
  
  // Auto-save snapshot
  async autoSave(data: {
    contentId: string;
    sessionId: string;
    snapshotData: Record<string, unknown>;
  }): Promise<{ contentId: string; timestamp: string }> {
    const validatedData = z.object({
      contentId: z.string().uuid(),
      sessionId: z.string().min(1),
      snapshotData: z.record(z.unknown()),
    }).parse(data);
    
    const response = await apiRequest<{ contentId: string; timestamp: string }>({
      method: 'POST',
      url: `/content/${validatedData.contentId}/auto-save`,
      data: {
        sessionId: validatedData.sessionId,
        snapshotData: validatedData.snapshotData,
      },
    });
    
    return response.data;
  },
  
  // Get content history
  async getHistory(id: string): Promise<{
    id: string;
    version: number;
    title: string;
    description?: string;
    content: Record<string, unknown>;
    operationType: string;
    createdBy: string;
    createdAt: string;
  }[]> {
    z.string().uuid().parse(id);
    
    const response = await apiRequest<{
      id: string;
      version: number;
      title: string;
      description?: string;
      content: Record<string, unknown>;
      operationType: string;
      createdBy: string;
      createdAt: string;
    }[]>({
      method: 'GET',
      url: `/content/${id}/history`,
    });
    
    return response.data;
  },
  
  // Restore content from version
  async restoreVersion(id: string, version: number): Promise<ContentItem> {
    z.string().uuid().parse(id);
    z.number().positive().parse(version);
    
    const response = await apiRequest<ContentItem>({
      method: 'POST',
      url: `/content/${id}/restore`,
      data: { version },
    });
    
    return ContentItemSchema.parse(response.data);
  },
};
```

## 5. Component Architecture and Data Flow

### 5.1 Component Hierarchy Design

```typescript
// components/PageBuilder/PageBuilder.tsx
import React, { useEffect } from 'react';
import { useURLState } from '../../hooks/useURLState';
import { useContentDetail } from '../../hooks/useContentQueries';
import { PageBuilderProvider } from './PageBuilderProvider';
import { PageBuilderLayout } from './PageBuilderLayout';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const PageBuilder: React.FC = () => {
  const { urlParams, isEditing, currentId } = useURLState();
  const { data: content, isLoading, error } = useContentDetail(currentId);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading content...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Failed to load content
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <PageBuilderProvider>
        <PageBuilderLayout />
      </PageBuilderProvider>
    </ErrorBoundary>
  );
};

// components/PageBuilder/PageBuilderProvider.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { usePageBuilderStore } from '../../stores/pageBuilderStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useBeforeUnload } from './hooks/useBeforeUnload';

interface PageBuilderContextType {
  // Auto-save functionality
  isAutoSaving: boolean;
  lastSaved: Date | null;
  
  // Keyboard shortcuts
  handleKeyboardShortcuts: (event: KeyboardEvent) => void;
}

const PageBuilderContext = createContext<PageBuilderContextType | null>(null);

export const usePageBuilderContext = () => {
  const context = useContext(PageBuilderContext);
  if (!context) {
    throw new Error('usePageBuilderContext must be used within PageBuilderProvider');
  }
  return context;
};

export const PageBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasUnsavedChanges = usePageBuilderStore(state => state.hasUnsavedChanges);
  const { isAutoSaving, lastSaved } = useAutoSave();
  
  // Warn user before leaving with unsaved changes
  useBeforeUnload(hasUnsavedChanges);
  
  // Keyboard shortcuts
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          // Trigger manual save
          // TODO: Implement manual save functionality
          break;
        case 'z':
          if (event.shiftKey) {
            event.preventDefault();
            // Redo functionality
          } else {
            event.preventDefault();
            // Undo functionality
          }
          break;
      }
    }
  }, []);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);
  
  const contextValue: PageBuilderContextType = {
    isAutoSaving,
    lastSaved,
    handleKeyboardShortcuts,
  };
  
  return (
    <PageBuilderContext.Provider value={contextValue}>
      {children}
    </PageBuilderContext.Provider>
  );
};
```

### 5.2 Block System Architecture

```typescript
// components/Blocks/BlockSystem.tsx
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BlockRenderer } from './BlockRenderer';
import { BlockDropZone } from './BlockDropZone';
import { usePageBuilderStore } from '../../stores/pageBuilderStore';

export const BlockSystem: React.FC = () => {
  const currentPage = usePageBuilderStore(state => state.currentPage);
  
  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No page selected
      </div>
    );
  }
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="block-system">
        <BlockDropZone
          blocks={currentPage.blocks}
          onBlocksChange={(blocks) => {
            // Update blocks in store
          }}
        />
      </div>
    </DndProvider>
  );
};

// components/Blocks/BlockRenderer.tsx
import React, { useMemo } from 'react';
import { Block } from '../../types/content';
import { blockRegistry } from './registry/blockRegistry';

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, updates: Partial<Block>) => void;
  onDelete: (blockId: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const BlockComponent = useMemo(() => {
    const registration = blockRegistry.get(block.type);
    if (!registration) {
      console.warn(`Unknown block type: ${block.type}`);
      return blockRegistry.get('unknown')?.component;
    }
    return registration.component;
  }, [block.type]);
  
  if (!BlockComponent) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-700">
        Unknown block type: {block.type}
      </div>
    );
  }
  
  return (
    <div 
      className={`block-wrapper relative ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(block.id)}
    >
      {isSelected && (
        <div className="block-toolbar absolute top-0 right-0 flex gap-1 bg-white shadow-lg rounded p-1">
          <button 
            onClick={() => onDelete(block.id)}
            className="p-1 hover:bg-red-100 text-red-600"
          >
            Delete
          </button>
        </div>
      )}
      
      <BlockComponent
        {...block.props}
        blockId={block.id}
        isEditing={isSelected}
        onUpdate={(updates) => onUpdate(block.id, { props: updates })}
      />
      
      {block.children && block.children.length > 0 && (
        <div className="block-children">
          {block.children.map(childBlock => (
            <BlockRenderer
              key={childBlock.id}
              block={childBlock}
              isSelected={isSelected}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// components/Blocks/registry/blockRegistry.ts
import React from 'react';
import { z } from 'zod';

export interface BlockDefinition {
  type: string;
  displayName: string;
  description: string;
  category: string;
  icon: React.ComponentType;
  component: React.ComponentType<any>;
  propsSchema: z.ZodSchema;
  defaultProps: Record<string, unknown>;
  canHaveChildren: boolean;
  allowedParents?: string[];
  allowedChildren?: string[];
}

class BlockRegistry {
  private blocks = new Map<string, BlockDefinition>();
  
  register(definition: BlockDefinition) {
    this.blocks.set(definition.type, definition);
  }
  
  get(type: string): BlockDefinition | undefined {
    return this.blocks.get(type);
  }
  
  getAll(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }
  
  getByCategory(category: string): BlockDefinition[] {
    return this.getAll().filter(block => block.category === category);
  }
}

export const blockRegistry = new BlockRegistry();

// Register built-in blocks
import { TextBlock } from '../blocks/TextBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { ContainerBlock } from '../blocks/ContainerBlock';

blockRegistry.register({
  type: 'text',
  displayName: 'Text',
  description: 'A text block for content',
  category: 'content',
  icon: TypeIcon,
  component: TextBlock,
  propsSchema: z.object({
    content: z.string().default(''),
    fontSize: z.number().default(16),
    fontWeight: z.enum(['normal', 'bold']).default('normal'),
    textAlign: z.enum(['left', 'center', 'right']).default('left'),
  }),
  defaultProps: {
    content: 'Enter your text here',
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'left',
  },
  canHaveChildren: false,
});

blockRegistry.register({
  type: 'container',
  displayName: 'Container',
  description: 'A container for other blocks',
  category: 'layout',
  icon: BoxIcon,
  component: ContainerBlock,
  propsSchema: z.object({
    backgroundColor: z.string().default('#ffffff'),
    padding: z.number().default(16),
    gap: z.number().default(8),
    direction: z.enum(['row', 'column']).default('column'),
  }),
  defaultProps: {
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 8,
    direction: 'column',
  },
  canHaveChildren: true,
});
```

### 5.3 Data Flow Patterns

```typescript
// hooks/useDataFlow.ts
import { useEffect, useCallback } from 'react';
import { usePageBuilderStore } from '../stores/pageBuilderStore';
import { useUpdateContent } from './useContentQueries';
import { useURLState } from './useURLState';

export const useDataFlow = () => {
  const {
    currentPage,
    hasUnsavedChanges,
    setCurrentPage,
    setHasUnsavedChanges,
  } = usePageBuilderStore();
  
  const { currentId, isEditing } = useURLState();
  const updateMutation = useUpdateContent();
  
  // Sync URL changes to state
  useEffect(() => {
    if (!isEditing && currentPage) {
      // Clear current page when navigating away from edit mode
      setCurrentPage(null);
    }
  }, [isEditing, currentPage, setCurrentPage]);
  
  // Manual save function
  const saveContent = useCallback(async () => {
    if (!currentPage || !currentId || !hasUnsavedChanges) return;
    
    try {
      await updateMutation.mutateAsync({
        id: currentId,
        updates: {
          title: currentPage.title,
          description: currentPage.description,
          content: currentPage.content,
          metadata: currentPage.metadata,
        },
      });
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
      // Error is handled by the mutation
    }
  }, [currentPage, currentId, hasUnsavedChanges, updateMutation, setHasUnsavedChanges]);
  
  return {
    saveContent,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
  };
};

// hooks/useBlockOperations.ts
import { useCallback } from 'react';
import { usePageBuilderStore } from '../stores/pageBuilderStore';
import { Block } from '../types/content';
import { v4 as uuidv4 } from 'uuid';

export const useBlockOperations = () => {
  const {
    currentPage,
    selectedBlockId,
    addBlock,
    updateBlock,
    removeBlock,
    selectBlock,
  } = usePageBuilderStore();
  
  const createBlock = useCallback((type: string, props: Record<string, unknown> = {}) => {
    return {
      id: uuidv4(),
      type,
      props,
      children: [],
    } as Block;
  }, []);
  
  const insertBlock = useCallback((
    blockType: string,
    targetId?: string,
    position: 'before' | 'after' | 'inside' = 'after'
  ) => {
    const newBlock = createBlock(blockType);
    addBlock(newBlock, targetId, position);
    selectBlock(newBlock.id);
  }, [createBlock, addBlock, selectBlock]);
  
  const duplicateBlock = useCallback((blockId: string) => {
    if (!currentPage) return;
    
    const findBlock = (blocks: Block[]): Block | null => {
      for (const block of blocks) {
        if (block.id === blockId) return block;
        if (block.children) {
          const found = findBlock(block.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const originalBlock = findBlock(currentPage.blocks);
    if (originalBlock) {
      const duplicatedBlock = {
        ...originalBlock,
        id: uuidv4(),
        children: originalBlock.children?.map(child => ({
          ...child,
          id: uuidv4(),
        })),
      };
      
      addBlock(duplicatedBlock, blockId, 'after');
      selectBlock(duplicatedBlock.id);
    }
  }, [currentPage, addBlock, selectBlock]);
  
  const moveBlock = useCallback((
    blockId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
  ) => {
    // This would need to be implemented based on the specific data structure
    // For now, we'll use a simple remove and add operation
    if (!currentPage) return;
    
    const findBlock = (blocks: Block[]): Block | null => {
      for (const block of blocks) {
        if (block.id === blockId) return block;
        if (block.children) {
          const found = findBlock(block.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const blockToMove = findBlock(currentPage.blocks);
    if (blockToMove) {
      removeBlock(blockId);
      addBlock(blockToMove, targetId, position);
    }
  }, [currentPage, removeBlock, addBlock]);
  
  return {
    insertBlock,
    duplicateBlock,
    moveBlock,
    updateBlockProps: updateBlock,
    deleteBlock: removeBlock,
    selectedBlockId,
  };
};
```

## 6. URL Routing Strategy

### 6.1 Route Structure Design

```typescript
// routes/pageBuilderRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageBuilder } from '../components/PageBuilder/PageBuilder';
import { ContentList } from '../components/ContentList/ContentList';
import { NotFound } from '../components/ui/NotFound';

export const PageBuilderRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Redirect root to default repository */}
      <Route path="/" element={<Navigate to="/page-builder?repo=wods" replace />} />
      
      {/* Main page builder route */}
      <Route path="/page-builder" element={<PageBuilderWrapper />} />
      
      {/* 404 handler */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const PageBuilderWrapper: React.FC = () => {
  const { urlParams, isEditing } = useURLState();
  
  // Validate repository type
  if (!['wods', 'blocks', 'programs'].includes(urlParams.repo)) {
    return <Navigate to="/page-builder?repo=wods" replace />;
  }
  
  if (isEditing) {
    return <PageBuilder />;
  } else {
    return <ContentList repositoryType={urlParams.repo} />;
  }
};
```

### 6.2 URL State Synchronization

```typescript
// hooks/useURLSync.ts
import { useEffect } from 'react';
import { useURLState } from './useURLState';
import { usePageBuilderStore } from '../stores/pageBuilderStore';

export const useURLSync = () => {
  const { urlParams, updateURLParams } = useURLState();
  const { selectedBlockId, activePanel } = usePageBuilderStore();
  
  // Sync selected block to URL
  useEffect(() => {
    if (selectedBlockId && !urlParams.blockId) {
      updateURLParams({ blockId: selectedBlockId });
    } else if (!selectedBlockId && urlParams.blockId) {
      updateURLParams({ blockId: undefined });
    }
  }, [selectedBlockId, urlParams.blockId, updateURLParams]);
  
  // Sync active panel to URL
  useEffect(() => {
    if (activePanel !== urlParams.panel) {
      updateURLParams({ panel: activePanel });
    }
  }, [activePanel, urlParams.panel, updateURLParams]);
  
  // Sync URL changes back to store
  useEffect(() => {
    const store = usePageBuilderStore.getState();
    
    if (urlParams.blockId && urlParams.blockId !== store.selectedBlockId) {
      store.selectBlock(urlParams.blockId);
    }
    
    if (urlParams.panel && urlParams.panel !== store.activePanel) {
      store.setActivePanel(urlParams.panel);
    }
  }, [urlParams.blockId, urlParams.panel]);
};

// hooks/useNavigationGuard.ts
import { useEffect } from 'react';
import { useBeforeUnload, unstable_useBlocker as useBlocker } from 'react-router-dom';
import { usePageBuilderStore } from '../stores/pageBuilderStore';

export const useNavigationGuard = () => {
  const hasUnsavedChanges = usePageBuilderStore(state => state.hasUnsavedChanges);
  
  // Prevent browser navigation away from page
  useBeforeUnload(
    React.useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          event.returnValue = '';
        }
      },
      [hasUnsavedChanges]
    )
  );
  
  // Prevent React Router navigation
  const blocker = useBlocker(
    React.useCallback(
      ({ currentLocation, nextLocation }) => {
        return (
          hasUnsavedChanges &&
          currentLocation.pathname !== nextLocation.pathname
        );
      },
      [hasUnsavedChanges]
    )
  );
  
  // Show confirmation dialog for blocked navigation
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
  
  return { isBlocked: blocker.state === 'blocked' };
};
```

## 7. Auto-Save Implementation with Debouncing

### 7.1 Auto-Save Hook

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { usePageBuilderStore } from '../stores/pageBuilderStore';
import { useAutoSave as useAutoSaveMutation } from './useContentQueries';
import { useURLState } from './useURLState';
import { useDebouncedCallback } from 'use-debounce';

const AUTO_SAVE_DELAY = 2000; // 2 seconds
const SESSION_ID_KEY = 'page-builder-session-id';

export const useAutoSave = () => {
  const { currentPage, hasUnsavedChanges } = usePageBuilderStore();
  const { currentId, isEditing } = useURLState();
  const autoSaveMutation = useAutoSaveMutation();
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const sessionIdRef = useRef<string>();
  
  // Generate or retrieve session ID
  useEffect(() => {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    sessionIdRef.current = sessionId;
  }, []);
  
  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!currentPage || !currentId || !sessionIdRef.current || !isEditing) {
      return;
    }
    
    try {
      await autoSaveMutation.mutateAsync({
        contentId: currentId,
        sessionId: sessionIdRef.current,
        snapshotData: {
          title: currentPage.title,
          description: currentPage.description,
          content: currentPage.content,
          metadata: {
            ...currentPage.metadata,
            autoSaveTimestamp: new Date().toISOString(),
          },
        },
      });
      
      setLastSaved(new Date());
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [currentPage, currentId, isEditing, autoSaveMutation]);
  
  // Debounced auto-save
  const debouncedAutoSave = useDebouncedCallback(
    performAutoSave,
    AUTO_SAVE_DELAY,
    { leading: false, trailing: true }
  );
  
  // Trigger auto-save when content changes
  useEffect(() => {
    if (hasUnsavedChanges && currentPage && currentId && isEditing) {
      debouncedAutoSave();
    }
  }, [hasUnsavedChanges, currentPage, currentId, isEditing, debouncedAutoSave]);
  
  // Cancel pending auto-save on unmount
  useEffect(() => {
    return () => {
      debouncedAutoSave.cancel();
    };
  }, [debouncedAutoSave]);
  
  return {
    isAutoSaving: autoSaveMutation.isPending,
    lastSaved,
    forceAutoSave: performAutoSave,
  };
};

// hooks/useAutoSaveRecovery.ts
import { useEffect, useState } from 'react';
import { usePageBuilderStore } from '../stores/pageBuilderStore';
import { contentApi } from '../api/contentApi';

export const useAutoSaveRecovery = (contentId: string | null) => {
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const setCurrentPage = usePageBuilderStore(state => state.setCurrentPage);
  
  useEffect(() => {
    if (!contentId) return;
    
    const checkForRecoveryData = async () => {
      try {
        const sessionId = sessionStorage.getItem('page-builder-session-id');
        if (!sessionId) return;
        
        // Check if there are any auto-save snapshots for this session
        const response = await fetch(`/api/content/${contentId}/auto-save?sessionId=${sessionId}`);
        
        if (response.ok) {
          const snapshots = await response.json();
          const latestSnapshot = snapshots[0];
          
          if (latestSnapshot) {
            setRecoveryData(latestSnapshot.snapshotData);
            setShowRecoveryPrompt(true);
          }
        }
      } catch (error) {
        console.warn('Failed to check for recovery data:', error);
      }
    };
    
    checkForRecoveryData();
  }, [contentId]);
  
  const restoreFromRecovery = useCallback(() => {
    if (recoveryData) {
      setCurrentPage(recoveryData);
      setShowRecoveryPrompt(false);
      setRecoveryData(null);
    }
  }, [recoveryData, setCurrentPage]);
  
  const dismissRecovery = useCallback(() => {
    setShowRecoveryPrompt(false);
    setRecoveryData(null);
  }, []);
  
  return {
    showRecoveryPrompt,
    recoveryData,
    restoreFromRecovery,
    dismissRecovery,
  };
};
```

### 7.2 Auto-Save UI Components

```typescript
// components/ui/AutoSaveIndicator.tsx
import React from 'react';
import { Save, Check, AlertCircle, Loader } from 'lucide-react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { usePageBuilderStore } from '../../stores/pageBuilderStore';

export const AutoSaveIndicator: React.FC = () => {
  const { isAutoSaving, lastSaved } = useAutoSave();
  const hasUnsavedChanges = usePageBuilderStore(state => state.hasUnsavedChanges);
  
  const getStatus = () => {
    if (isAutoSaving) {
      return { icon: Loader, text: 'Saving...', className: 'text-blue-600' };
    }
    
    if (hasUnsavedChanges) {
      return { icon: AlertCircle, text: 'Unsaved changes', className: 'text-orange-600' };
    }
    
    if (lastSaved) {
      const timeAgo = formatTimeAgo(lastSaved);
      return { icon: Check, text: `Saved ${timeAgo}`, className: 'text-green-600' };
    }
    
    return { icon: Save, text: 'Not saved', className: 'text-gray-500' };
  };
  
  const { icon: Icon, text, className } = getStatus();
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Icon className={`h-4 w-4 ${isAutoSaving ? 'animate-spin' : ''}`} />
      <span>{text}</span>
    </div>
  );
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
}

// components/ui/RecoveryPrompt.tsx
import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { useAutoSaveRecovery } from '../../hooks/useAutoSaveRecovery';

interface RecoveryPromptProps {
  contentId: string;
}

export const RecoveryPrompt: React.FC<RecoveryPromptProps> = ({ contentId }) => {
  const {
    showRecoveryPrompt,
    restoreFromRecovery,
    dismissRecovery,
  } = useAutoSaveRecovery(contentId);
  
  if (!showRecoveryPrompt) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-white border border-orange-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">
            Unsaved Changes Found
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            We found auto-saved changes from your previous session. Would you like to restore them?
          </p>
          <div className="flex gap-2">
            <button
              onClick={restoreFromRecovery}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
            <button
              onClick={dismissRecovery}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 8. Independent Testing Strategy

### 8.1 Unit Testing Framework

```typescript
// tests/stores/pageBuilderStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePageBuilderStore } from '../../stores/pageBuilderStore';

describe('PageBuilderStore', () => {
  beforeEach(() => {
    usePageBuilderStore.getState().reset();
  });
  
  describe('Block Management', () => {
    it('should add a block to the current page', () => {
      const { result } = renderHook(() => usePageBuilderStore());
      
      // Setup initial page
      act(() => {
        result.current.setCurrentPage({
          id: 'page-1',
          title: 'Test Page',
          description: 'Test Description',
          blocks: [],
          content: {},
          metadata: {},
        });
      });
      
      const newBlock = {
        id: 'block-1',
        type: 'text',
        props: { content: 'Hello World' },
        children: [],
      };
      
      act(() => {
        result.current.addBlock(newBlock);
      });
      
      expect(result.current.currentPage?.blocks).toHaveLength(1);
      expect(result.current.currentPage?.blocks[0]).toEqual(newBlock);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
    
    it('should update a block by ID', () => {
      const { result } = renderHook(() => usePageBuilderStore());
      
      const initialBlock = {
        id: 'block-1',
        type: 'text',
        props: { content: 'Original' },
        children: [],
      };
      
      act(() => {
        result.current.setCurrentPage({
          id: 'page-1',
          title: 'Test Page',
          description: 'Test Description',
          blocks: [initialBlock],
          content: {},
          metadata: {},
        });
      });
      
      act(() => {
        result.current.updateBlock('block-1', {
          props: { content: 'Updated' }
        });
      });
      
      expect(result.current.currentPage?.blocks[0].props.content).toBe('Updated');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
    
    it('should remove a block by ID', () => {
      const { result } = renderHook(() => usePageBuilderStore());
      
      const block1 = { id: 'block-1', type: 'text', props: {}, children: [] };
      const block2 = { id: 'block-2', type: 'text', props: {}, children: [] };
      
      act(() => {
        result.current.setCurrentPage({
          id: 'page-1',
          title: 'Test Page',
          description: 'Test Description',
          blocks: [block1, block2],
          content: {},
          metadata: {},
        });
      });
      
      act(() => {
        result.current.removeBlock('block-1');
      });
      
      expect(result.current.currentPage?.blocks).toHaveLength(1);
      expect(result.current.currentPage?.blocks[0].id).toBe('block-2');
      expect(result.current.selectedBlockId).toBeNull();
    });
  });
  
  describe('Selection Management', () => {
    it('should select a block and set active panel', () => {
      const { result } = renderHook(() => usePageBuilderStore());
      
      act(() => {
        result.current.selectBlock('block-1');
      });
      
      expect(result.current.selectedBlockId).toBe('block-1');
      expect(result.current.activePanel).toBe('properties');
    });
    
    it('should clear selection when selecting null', () => {
      const { result } = renderHook(() => usePageBuilderStore());
      
      act(() => {
        result.current.selectBlock('block-1');
      });
      
      act(() => {
        result.current.selectBlock(null);
      });
      
      expect(result.current.selectedBlockId).toBeNull();
      expect(result.current.activePanel).toBeNull();
    });
  });
});
```

### 8.2 API Integration Testing

```typescript
// tests/api/contentApi.test.ts
import { contentApi } from '../../api/contentApi';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('ContentAPI', () => {
  describe('getList', () => {
    it('should fetch content list with filters', async () => {
      server.use(
        rest.get('/api/content', (req, res, ctx) => {
          const repositoryType = req.url.searchParams.get('repositoryType');
          const page = req.url.searchParams.get('page');
          
          expect(repositoryType).toBe('wods');
          expect(page).toBe('1');
          
          return res(ctx.json({
            data: {
              items: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  workspaceId: '123e4567-e89b-12d3-a456-426614174001',
                  repositoryType: 'wods',
                  title: 'Test WOD',
                  description: 'A test workout',
                  content: {},
                  metadata: {},
                  status: 'draft',
                  createdBy: '123e4567-e89b-12d3-a456-426614174002',
                  updatedBy: '123e4567-e89b-12d3-a456-426614174002',
                  createdAt: '2025-01-01T00:00:00Z',
                  updatedAt: '2025-01-01T00:00:00Z',
                  version: 1,
                }
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                pages: 1,
              }
            }
          }));
        })
      );
      
      const result = await contentApi.getList({
        repositoryType: 'wods',
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test WOD');
      expect(result.pagination.total).toBe(1);
    });
    
    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/content', (req, res, ctx) => {
          return res.once(
            ctx.status(500),
            ctx.json({
              code: 'SERVER_ERROR',
              message: 'Internal server error',
            })
          );
        })
      );
      
      await expect(contentApi.getList({
        repositoryType: 'wods',
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })).rejects.toThrow('Internal server error');
    });
  });
  
  describe('create', () => {
    it('should create new content item', async () => {
      const newContent = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        repositoryType: 'wods' as const,
        title: 'New WOD',
        description: 'A new workout',
        content: { blocks: [] },
        metadata: {},
        status: 'draft' as const,
      };
      
      server.use(
        rest.post('/api/content', async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(newContent);
          
          return res(ctx.json({
            data: {
              id: '123e4567-e89b-12d3-a456-426614174003',
              ...newContent,
              createdBy: '123e4567-e89b-12d3-a456-426614174002',
              updatedBy: '123e4567-e89b-12d3-a456-426614174002',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
              version: 1,
            }
          }));
        })
      );
      
      const result = await contentApi.create(newContent);
      
      expect(result.id).toBeDefined();
      expect(result.title).toBe('New WOD');
      expect(result.version).toBe(1);
    });
  });
});
```

### 8.3 Component Integration Testing

```typescript
// tests/components/PageBuilder.integration.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PageBuilder } from '../../components/PageBuilder/PageBuilder';
import { server } from '../mocks/server';

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('PageBuilder Integration', () => {
  it('should load content and display page builder interface', async () => {
    // Mock the URL parameters
    Object.defineProperty(window, 'location', {
      value: {
        search: '?repo=wods&id=123e4567-e89b-12d3-a456-426614174000&view=edit',
      },
      writable: true,
    });
    
    server.use(
      rest.get('/api/content/123e4567-e89b-12d3-a456-426614174000', (req, res, ctx) => {
        return res(ctx.json({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            workspaceId: '123e4567-e89b-12d3-a456-426614174001',
            repositoryType: 'wods',
            title: 'Test WOD',
            description: 'A test workout',
            content: {
              blocks: [
                {
                  id: 'block-1',
                  type: 'text',
                  props: { content: 'Hello World' },
                  children: [],
                }
              ]
            },
            metadata: {},
            status: 'draft',
            createdBy: '123e4567-e89b-12d3-a456-426614174002',
            updatedBy: '123e4567-e89b-12d3-a456-426614174002',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            version: 1,
          }
        }));
      })
    );
    
    render(<PageBuilder />, { wrapper: createTestWrapper() });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
    });
    
    // Check that the page builder interface is rendered
    expect(screen.getByDisplayValue('Test WOD')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
  
  it('should handle content update with optimistic updates', async () => {
    render(<PageBuilder />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
    });
    
    const titleInput = screen.getByDisplayValue('Test WOD');
    
    // Update the title
    fireEvent.change(titleInput, { target: { value: 'Updated WOD' } });
    
    // Check that the change is immediately reflected (optimistic update)
    expect(screen.getByDisplayValue('Updated WOD')).toBeInTheDocument();
    
    // Check that save indicator shows unsaved changes
    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });
  
  it('should show error state when content fails to load', async () => {
    server.use(
      rest.get('/api/content/123e4567-e89b-12d3-a456-426614174000', (req, res, ctx) => {
        return res.once(ctx.status(404), ctx.json({
          code: 'NOT_FOUND',
          message: 'Content not found',
        }));
      })
    );
    
    render(<PageBuilder />, { wrapper: createTestWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load content')).toBeInTheDocument();
      expect(screen.getByText('Content not found')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});
```

### 8.4 End-to-End Testing Strategy

```typescript
// tests/e2e/pageBuilder.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Page Builder E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication if needed
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
  });
  
  test('should create a new WOD with blocks', async ({ page }) => {
    // Navigate to page builder
    await page.goto('/page-builder?repo=wods');
    
    // Click create new button
    await page.click('[data-testid="create-new-button"]');
    
    // Fill in basic information
    await page.fill('[data-testid="title-input"]', 'E2E Test WOD');
    await page.fill('[data-testid="description-input"]', 'Created by E2E test');
    
    // Add a text block
    await page.click('[data-testid="add-text-block"]');
    await page.fill('[data-testid="text-block-content"]', 'Workout instructions');
    
    // Save the WOD
    await page.click('[data-testid="save-button"]');
    
    // Wait for save confirmation
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    
    // Verify URL updated with new ID
    await expect(page).toHaveURL(/\/page-builder\?repo=wods&id=[\w-]+&view=edit/);
    
    // Verify content is saved
    await page.reload();
    await expect(page.locator('[data-testid="title-input"]')).toHaveValue('E2E Test WOD');
    await expect(page.locator('[data-testid="text-block-content"]')).toHaveValue('Workout instructions');
  });
  
  test('should handle auto-save functionality', async ({ page }) => {
    // Navigate to existing content
    await page.goto('/page-builder?repo=wods&id=existing-id&view=edit');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="title-input"]');
    
    // Modify content
    await page.fill('[data-testid="title-input"]', 'Auto-save test');
    
    // Wait for auto-save indicator
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saving...');
    
    // Wait for auto-save completion
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Saved');
    
    // Simulate page refresh to test recovery
    await page.reload();
    
    // Should show recovery prompt
    await expect(page.locator('[data-testid="recovery-prompt"]')).toBeVisible();
    
    // Accept recovery
    await page.click('[data-testid="restore-button"]');
    
    // Verify content was restored
    await expect(page.locator('[data-testid="title-input"]')).toHaveValue('Auto-save test');
  });
  
  test('should prevent navigation with unsaved changes', async ({ page }) => {
    await page.goto('/page-builder?repo=wods&id=existing-id&view=edit');
    
    // Make changes
    await page.fill('[data-testid="title-input"]', 'Unsaved changes');
    
    // Try to navigate away
    await page.click('[data-testid="home-link"]');
    
    // Should show confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss(); // Cancel navigation
    });
    
    // Should still be on page builder
    await expect(page).toHaveURL(/\/page-builder/);
  });
});
```

### 8.5 Performance Testing

```typescript
// tests/performance/pageBuilder.perf.test.ts
import { test, expect } from '@playwright/test';

test.describe('Page Builder Performance', () => {
  test('should load page builder within performance budget', async ({ page }) => {
    // Start performance tracking
    await page.goto('/page-builder?repo=wods');
    
    // Measure time to interactive
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="page-builder-canvas"]', { state: 'visible' });
    const loadTime = Date.now() - startTime;
    
    // Assert performance budget (3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // Measure largest contentful paint
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1];
          resolve(lcp.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500); // 2.5 seconds LCP budget
  });
  
  test('should handle large numbers of blocks efficiently', async ({ page }) => {
    await page.goto('/page-builder?repo=wods&id=large-content&view=edit');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="page-builder-canvas"]');
    
    // Measure rendering performance with 100+ blocks
    const startTime = performance.now();
    
    // Add multiple blocks
    for (let i = 0; i < 20; i++) {
      await page.click('[data-testid="add-text-block"]');
    }
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should handle 20 blocks in under 1 second
    expect(renderTime).toBeLessThan(1000);
    
    // Check that UI remains responsive
    await page.click('[data-testid="save-button"]');
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible({ timeout: 5000 });
  });
});
```

## 9. Migration Strategy and Implementation Plan

### 9.1 Phased Migration Approach

```typescript
// migration/migrationPlan.ts
export interface MigrationPhase {
  name: string;
  description: string;
  prerequisites: string[];
  steps: MigrationStep[];
  rollbackPlan: string[];
  successCriteria: string[];
}

export interface MigrationStep {
  id: string;
  description: string;
  type: 'database' | 'code' | 'config' | 'test';
  script?: string;
  estimatedTime: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const migrationPlan: MigrationPhase[] = [
  {
    name: 'Phase 1: Database Schema Migration',
    description: 'Update database schema and add new tables',
    prerequisites: ['Database backup completed', 'Maintenance window scheduled'],
    steps: [
      {
        id: 'db-1',
        description: 'Create new unified content_items table',
        type: 'database',
        script: 'migrations/001_create_content_items.sql',
        estimatedTime: '10 minutes',
        riskLevel: 'medium',
      },
      {
        id: 'db-2',
        description: 'Migrate existing wods data',
        type: 'database',
        script: 'migrations/002_migrate_wods.sql',
        estimatedTime: '30 minutes',
        riskLevel: 'high',
      },
      {
        id: 'db-3',
        description: 'Migrate existing blocks data',
        type: 'database',
        script: 'migrations/003_migrate_blocks.sql',
        estimatedTime: '20 minutes',
        riskLevel: 'high',
      },
      {
        id: 'db-4',
        description: 'Create indexes and constraints',
        type: 'database',
        script: 'migrations/004_create_indexes.sql',
        estimatedTime: '15 minutes',
        riskLevel: 'low',
      },
    ],
    rollbackPlan: [
      'Restore database from backup',
      'Update application to use old schema',
      'Run data validation scripts',
    ],
    successCriteria: [
      'All existing data migrated successfully',
      'Performance tests pass',
      'Data integrity checks pass',
    ],
  },
  {
    name: 'Phase 2: API Layer Replacement',
    description: 'Replace direct Supabase calls with new API layer',
    prerequisites: ['Phase 1 completed', 'New API endpoints deployed'],
    steps: [
      {
        id: 'api-1',
        description: 'Deploy new API endpoints',
        type: 'code',
        estimatedTime: '20 minutes',
        riskLevel: 'medium',
      },
      {
        id: 'api-2',
        description: 'Update content queries to use new API',
        type: 'code',
        estimatedTime: '40 minutes',
        riskLevel: 'medium',
      },
      {
        id: 'api-3',
        description: 'Test API integration',
        type: 'test',
        estimatedTime: '30 minutes',
        riskLevel: 'low',
      },
    ],
    rollbackPlan: [
      'Revert to direct Supabase calls',
      'Disable new API endpoints',
    ],
    successCriteria: [
      'All API endpoints responding correctly',
      'Integration tests passing',
      'Performance within acceptable limits',
    ],
  },
  {
    name: 'Phase 3: State Management Migration',
    description: 'Replace scattered state with Zustand store',
    prerequisites: ['Phase 2 completed', 'State management patterns tested'],
    steps: [
      {
        id: 'state-1',
        description: 'Implement Zustand store',
        type: 'code',
        estimatedTime: '60 minutes',
        riskLevel: 'medium',
      },
      {
        id: 'state-2',
        description: 'Migrate PageBuilder component',
        type: 'code',
        estimatedTime: '90 minutes',
        riskLevel: 'high',
      },
      {
        id: 'state-3',
        description: 'Update child components',
        type: 'code',
        estimatedTime: '120 minutes',
        riskLevel: 'medium',
      },
    ],
    rollbackPlan: [
      'Revert to old state management',
      'Remove Zustand dependency',
    ],
    successCriteria: [
      'All UI functionality working',
      'No state synchronization issues',
      'Performance improved',
    ],
  },
  {
    name: 'Phase 4: Auto-save and Error Handling',
    description: 'Implement auto-save and comprehensive error handling',
    prerequisites: ['Phase 3 completed', 'Error handling patterns established'],
    steps: [
      {
        id: 'features-1',
        description: 'Implement auto-save functionality',
        type: 'code',
        estimatedTime: '80 minutes',
        riskLevel: 'medium',
      },
      {
        id: 'features-2',
        description: 'Add error boundaries and toast notifications',
        type: 'code',
        estimatedTime: '60 minutes',
        riskLevel: 'low',
      },
      {
        id: 'features-3',
        description: 'Implement navigation guards',
        type: 'code',
        estimatedTime: '40 minutes',
        riskLevel: 'low',
      },
    ],
    rollbackPlan: [
      'Disable auto-save functionality',
      'Revert to basic error handling',
    ],
    successCriteria: [
      'Auto-save working reliably',
      'Error handling comprehensive',
      'User experience improved',
    ],
  },
  {
    name: 'Phase 5: Testing and Validation',
    description: 'Comprehensive testing and performance validation',
    prerequisites: ['Phase 4 completed', 'Test environment ready'],
    steps: [
      {
        id: 'test-1',
        description: 'Run full test suite',
        type: 'test',
        estimatedTime: '60 minutes',
        riskLevel: 'low',
      },
      {
        id: 'test-2',
        description: 'Performance testing',
        type: 'test',
        estimatedTime: '40 minutes',
        riskLevel: 'low',
      },
      {
        id: 'test-3',
        description: 'User acceptance testing',
        type: 'test',
        estimatedTime: '120 minutes',
        riskLevel: 'low',
      },
    ],
    rollbackPlan: [
      'Revert to previous version',
      'Address critical issues',
    ],
    successCriteria: [
      'All tests passing',
      'Performance targets met',
      'User acceptance criteria met',
    ],
  },
];
```

### 9.2 Data Migration Scripts

```sql
-- migrations/001_create_content_items.sql
-- Create new unified schema for content management

-- Create enums
CREATE TYPE repository_type AS ENUM ('wods', 'blocks', 'programs');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE operation_type AS ENUM ('create', 'update', 'delete', 'restore');

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT workspace_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_type repository_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT folder_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255),
    CONSTRAINT folder_no_self_reference CHECK (id != parent_id)
);

-- Create main content_items table
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_type repository_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    status content_status DEFAULT 'draft',
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT content_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 255),
    CONSTRAINT content_description_length CHECK (char_length(description) <= 5000),
    CONSTRAINT content_version_positive CHECK (version > 0)
);

-- Create content history table
CREATE TABLE IF NOT EXISTS content_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    status content_status NOT NULL,
    operation_type operation_type NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_id, version)
);

-- Create auto-save snapshots table
CREATE TABLE IF NOT EXISTS auto_save_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- migrations/002_migrate_wods.sql
-- Migrate existing wods data to new schema

-- Create default workspace for existing data
INSERT INTO workspaces (id, name, owner_id)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Default Workspace',
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE id = '00000000-0000-0000-0000-000000000001'::UUID);

-- Migrate wods to content_items
INSERT INTO content_items (
    id,
    workspace_id,
    repository_type,
    title,
    description,
    content,
    metadata,
    status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    w.id,
    '00000000-0000-0000-0000-000000000001'::UUID as workspace_id,
    'wods'::repository_type,
    w.title,
    w.description,
    jsonb_build_object(
        'difficulty', w.difficulty,
        'duration', w.duration,
        'exercises', COALESCE(w.exercises, '[]'::jsonb),
        'equipment', COALESCE(w.equipment, '[]'::jsonb)
    ) as content,
    jsonb_build_object(
        'tags', COALESCE(w.tags, '[]'::jsonb),
        'category', w.category
    ) as metadata,
    CASE 
        WHEN w.is_published = true THEN 'published'::content_status
        ELSE 'draft'::content_status
    END as status,
    COALESCE(w.created_by, (SELECT id FROM auth.users LIMIT 1)),
    COALESCE(w.updated_by, w.created_by, (SELECT id FROM auth.users LIMIT 1)),
    w.created_at,
    w.updated_at
FROM wods w
WHERE NOT EXISTS (
    SELECT 1 FROM content_items ci 
    WHERE ci.id = w.id AND ci.repository_type = 'wods'
);

-- migrations/003_migrate_blocks.sql
-- Migrate existing blocks data to new schema

INSERT INTO content_items (
    id,
    workspace_id,
    repository_type,
    title,
    description,
    content,
    metadata,
    status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    b.id,
    '00000000-0000-0000-0000-000000000001'::UUID as workspace_id,
    'blocks'::repository_type,
    b.title,
    b.description,
    jsonb_build_object(
        'block_type', b.block_type,
        'configuration', COALESCE(b.configuration, '{}'::jsonb),
        'children', COALESCE(b.children, '[]'::jsonb)
    ) as content,
    jsonb_build_object(
        'category', b.category,
        'reusable', COALESCE(b.is_reusable, false)
    ) as metadata,
    'draft'::content_status as status,
    COALESCE(b.created_by, (SELECT id FROM auth.users LIMIT 1)),
    COALESCE(b.updated_by, b.created_by, (SELECT id FROM auth.users LIMIT 1)),
    b.created_at,
    b.updated_at
FROM blocks b
WHERE NOT EXISTS (
    SELECT 1 FROM content_items ci 
    WHERE ci.id = b.id AND ci.repository_type = 'blocks'
);
```

### 9.3 Deployment Strategy

```typescript
// deployment/deploymentConfig.ts
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  rollback: RollbackConfig;
  monitoring: MonitoringConfig;
}

export interface FeatureFlags {
  newSaveLoadArchitecture: boolean;
  autoSave: boolean;
  optimisticUpdates: boolean;
  errorBoundaries: boolean;
  performanceMonitoring: boolean;
}

export interface RollbackConfig {
  enabled: boolean;
  triggers: string[];
  automaticThreshold: {
    errorRate: number;
    responseTime: number;
  };
}

export const deploymentConfigs: Record<string, DeploymentConfig> = {
  development: {
    environment: 'development',
    features: {
      newSaveLoadArchitecture: true,
      autoSave: true,
      optimisticUpdates: true,
      errorBoundaries: true,
      performanceMonitoring: true,
    },
    rollback: {
      enabled: true,
      triggers: ['manual'],
      automaticThreshold: {
        errorRate: 0.1,
        responseTime: 5000,
      },
    },
    monitoring: {
      enabled: true,
      logLevel: 'debug',
      metricsCollection: true,
    },
  },
  staging: {
    environment: 'staging',
    features: {
      newSaveLoadArchitecture: true,
      autoSave: true,
      optimisticUpdates: true,
      errorBoundaries: true,
      performanceMonitoring: true,
    },
    rollback: {
      enabled: true,
      triggers: ['manual', 'automatic'],
      automaticThreshold: {
        errorRate: 0.05,
        responseTime: 3000,
      },
    },
    monitoring: {
      enabled: true,
      logLevel: 'info',
      metricsCollection: true,
    },
  },
  production: {
    environment: 'production',
    features: {
      newSaveLoadArchitecture: false, // Start with feature flag disabled
      autoSave: false,
      optimisticUpdates: false,
      errorBoundaries: true,
      performanceMonitoring: true,
    },
    rollback: {
      enabled: true,
      triggers: ['manual', 'automatic'],
      automaticThreshold: {
        errorRate: 0.01,
        responseTime: 2000,
      },
    },
    monitoring: {
      enabled: true,
      logLevel: 'warn',
      metricsCollection: true,
    },
  },
};

// Feature flag implementation
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const environment = process.env.NODE_ENV as keyof typeof deploymentConfigs;
  const config = deploymentConfigs[environment] || deploymentConfigs.development;
  return config.features[flag];
};
```

## 10. Conclusion

This comprehensive technical specification provides a complete roadmap for redesigning the AI Gym application's save/load architecture. The new design addresses all critical issues identified in the current implementation while incorporating modern React best practices and proven architectural patterns.

### Key Benefits

1. **Centralized State Management**: Zustand store eliminates state chaos and provides single source of truth
2. **Robust Error Handling**: Comprehensive error boundaries and user feedback systems
3. **Type-Safe APIs**: Zod validation ensures data integrity throughout the application
4. **Optimistic Updates**: Improved user experience with automatic rollback on failures
5. **Auto-Save Functionality**: Prevents data loss with debounced auto-save and recovery mechanisms
6. **Scalable Architecture**: Component-based design supports future feature additions
7. **Comprehensive Testing**: Independent testing strategy ensures reliability and maintainability

### Implementation Priority

The phased migration approach ensures minimal disruption to current operations while systematically addressing architectural debt. Feature flags enable gradual rollout and easy rollback if issues arise.

This architecture design provides a solid foundation for the AI Gym application's continued growth and evolution, ensuring maintainability, performance, and excellent user experience.
