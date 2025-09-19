# Video Modal Fix - Implementation Guide

## Quick Fix Implementation

### Step 1: Replace RightSidebar Implementation

The AI Gym platform is using a simplified RightSidebar that doesn't render the VideoEditor component. We need to replace it with the working implementation.

#### Code Changes Required:

**File**: `/workspace/ai-gym-platform/src/components/RightSidebar.tsx`

**Action**: Replace entire file content with the working implementation and update import paths.

**New Implementation**:

```tsx
import React from 'react';
import { X } from 'lucide-react';

// Import all block editors
import { TextEditor } from './BlockEditors/TextEditor';
import { ImageEditor } from './BlockEditors/ImageEditor';
import { VideoEditor } from './BlockEditors/VideoEditor';  // This is the key import
import { DocumentEditor } from './BlockEditors/DocumentEditor';
import { PDFEditor } from './BlockEditors/PDFEditor';
import { PromptsEditor } from './BlockEditors/PromptsEditor';
import { AutomationEditor } from './BlockEditors/AutomationEditor';
import { QuizEditor } from './BlockEditors/QuizEditor';
import { AccordionEditor } from './BlockEditors/AccordionEditor';
import { UserSubmissionEditor } from './BlockEditors/UserSubmissionEditor';
import { AIAgentEditor } from './BlockEditors/AIAgentEditor';

// Legacy block interface for compatibility
interface Block {
  id: string;
  type: string;
  data: any;
}

interface RightSidebarProps {
  isOpen: boolean;
  selectedBlock: Block | null;
  onClose: () => void;
  onBlockChange: (block: Block) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  selectedBlock,
  onClose,
  onBlockChange
}) => {
  if (!isOpen || !selectedBlock) {
    return null;
  }

  const renderEditor = () => {
    switch (selectedBlock.type) {
      case 'text':
      case 'section-header':
      case 'rich-text':
        return (
          <TextEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'image':
        return (
          <ImageEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'video':  // THIS IS THE KEY CASE
        return (
          <VideoEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'document':
        return (
          <DocumentEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'pdf':
        return (
          <PDFEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'prompts':
        return (
          <PromptsEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'automation':
        return (
          <AutomationEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'quiz':
        return (
          <QuizEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'accordion':
        return (
          <AccordionEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'user-submission':
        return (
          <UserSubmissionEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      case 'ai-agent':
        return (
          <AIAgentEditor
            block={selectedBlock}
            onChange={onBlockChange}
            onClose={onClose}
          />
        );
      
      default:
        return (
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🛠️</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Editor Coming Soon</h4>
                <p className="text-gray-600">
                  The editor for {selectedBlock.type} blocks is currently being developed.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-40 transform transition-transform duration-300 ease-in-out">
      {renderEditor()}
    </div>
  );
};
```

### Step 2: Handle Block Type Compatibility

The AI Gym platform might use different block type names. We need to ensure compatibility:

**Add type mapping** in the switch statement if needed:

```tsx
const renderEditor = () => {
  // Normalize block type for compatibility
  const blockType = selectedBlock.type === 'video' ? 'video' : selectedBlock.type;
  
  switch (blockType) {
    // ... existing cases
  }
};
```

### Step 3: Interface Compatibility

If the AI Gym platform uses different block interfaces, add a conversion layer:

```tsx
// Add interface conversion if needed
const convertBlockForEditor = (block: any): Block => {
  return {
    id: block.id,
    type: block.block_type || block.type,
    data: block.content || block.data || {}
  };
};

const convertBlockFromEditor = (block: Block): any => {
  return {
    ...selectedBlock,
    content: block.data,
    data: block.data
  };
};
```

## Testing Steps

### 1. Create Video Block Test
1. Navigate to the page builder
2. Add a new video block
3. Verify the block is created successfully

### 2. Edit Video Block Test
1. Click on an existing video block
2. Verify the VideoEditor opens in the right sidebar
3. Check that all VideoEditor features are available

### 3. Browse Repository Test
1. In the VideoEditor, click "Browse Repository" button
2. Verify the ContentPicker modal opens
3. Select a video file
4. Verify the video is updated in the block

### 4. Content Item Section Test
1. Look for the "Content Item" section with Browse button
2. Click the Browse button
3. Verify the ContentPicker modal opens
4. Test video selection works

## Debugging Tips

If the fix doesn't work immediately:

### 1. Check Console Errors
```javascript
// Look for these types of errors:
// - Import path errors
// - Component not found errors
// - Block type mismatch errors
```

### 2. Verify Component Imports
```bash
# Check if VideoEditor exists:
ls -la /workspace/ai-gym-platform/src/components/BlockEditors/VideoEditor.tsx

# Check if all BlockEditor components exist
ls -la /workspace/ai-gym-platform/src/components/BlockEditors/
```

### 3. Block Type Debugging
```tsx
// Add temporary logging in RightSidebar:
const renderEditor = () => {
  console.log('Selected block type:', selectedBlock.type);
  console.log('Selected block data:', selectedBlock);
  
  switch (selectedBlock.type) {
    // ... cases
  }
};
```

## Rollback Plan

If issues occur, quickly rollback:

```bash
# Restore original file:
mv /workspace/ai-gym-platform/src/components/RightSidebar.tsx.backup /workspace/ai-gym-platform/src/components/RightSidebar.tsx
```

## Success Indicators

✅ **VideoEditor renders** when clicking on video blocks
✅ **Browse Repository button** opens ContentPicker modal
✅ **Video selection** works from the modal
✅ **All video editing features** are accessible
✅ **No console errors** in browser dev tools
✅ **Consistent editing experience** across all block types

This fix addresses the core issue where the VideoEditor component wasn't being rendered for existing video blocks, thus making the Browse Repository functionality unavailable.