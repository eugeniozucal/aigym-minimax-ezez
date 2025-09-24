# 🏋️‍♂️ Phase 5 One-Shot Development Plan: WOD Builder Engine
**COMPREHENSIVE BLUEPRINT WITH CORRECTED ARCHITECTURE**

**Version:** 3.0 - Corrected Implementation Guide  
**Created:** 2025-09-16  
**Updated:** 2025-09-16  
**Author:** MiniMax Agent  
**Status:** DEFINITIVE IMPLEMENTATION BLUEPRINT  
**Based on:** Detailed User Feedback + Screenshot Analysis + Architectural Corrections

---

## 🎯 Executive Summary

This document provides the definitive one-shot development plan for Phase 5, incorporating critical architectural corrections and comprehensive feature descriptions. The plan eliminates drag-and-drop complexity in favor of intuitive click-to-embed functionality, establishes the correct three-column layout structure, and prioritizes community-based content management.

**Key Achievement Target:** Build Phase 5 WOD Builder Engine in one implementation cycle without iterations, using the correct architectural understanding and comprehensive feature specifications.

### 🔄 Critical Architectural Corrections Applied

1. **Terminology Standardization**: "Communities" replaces "communitys" throughout all interfaces, code, and documentation
2. **Three-Column Layout Clarification**: Correct understanding of left navigation rail, center canvas, and right block editor
3. **Left Rail Structure**: Fixed navigation with WOD settings first, followed by proper navigation icons
4. **Content Categories**: Accurate ELEMENTS vs CONTENT categorization based on actual implementation
5. **Pages Functionality**: Comprehensive multi-page WOD support with proper navigation
6. **Content Repository Priority**: Images and PDFs backend implementation as prerequisite
7. **Click-to-Embed Workflow**: Simplified interaction pattern replacing drag-and-drop
8. **Block Management**: Up/down arrows for reordering and comprehensive editing controls

### 📊 Three-Column Layout Architecture (CORRECTED)

Based on comprehensive analysis of the working implementation, the true architecture consists of:

#### **Left Column: Fixed Navigation Rail (Dark Sidebar)**
- **SETTINGS Icon** (Gear) - FIRST priority icon for comprehensive WOD configuration
- **ELEMENTS Icon** (Plus) - Access to basic building blocks (Section Header, Rich Text, Quiz, Division, etc.)
- **CONTENT Icon** (Document) - Access to repository content blocks (Video, AI Agent, Document, etc.)
- **PAGES Icon** (Stacked rectangles) - Page management operations (create, rename, reorganize pages)

#### **Center Column: Dynamic Canvas Area (White Background)**
- **Top Toolbar**: Back navigation, WOD title, draft status, pages indicator, unsaved changes, preview modes, save button
- **Canvas Area**: Visual editing space where blocks are embedded and edited
- **Page Navigation**: Tab-style navigation for multi-page WODs
- **Block Management**: Up/down arrows on each block for reordering

#### **Right Column: Block Editor Only (Light Gray)**
- **ONLY appears when a block is selected in canvas**
- **Active Block Editor**: Configuration panel for currently selected block
- **Block Properties**: Content selection, display customization, visibility toggles

---

## 🏗️ Complete Architecture Specification

### 1. Left Navigation Rail: Fixed Application Navigation

The left navigation rail serves as the primary application navigation, featuring four fixed icons that trigger deployed left menus when clicked.

#### **A. SETTINGS Icon (Gear) - PRIMARY FEATURE**

**Purpose**: Comprehensive WOD configuration and metadata management
**Location**: First icon in left rail (top priority position)
**Interaction**: Click to deploy WOD Settings panel

**Deployed Settings Panel Contents:**
```typescript
interface WODSettings {
  // Basic Information
  title: string;                    // WOD display name with generic template default
  description: string;              // WOD description for communities and users
  
  // Community Targeting (CRITICAL - Communities, not communitys)
  communities: {
    selectedCommunities: string[];  // Array of community IDs
    deploymentMode: 'select-all' | 'specific'; // All communities or specific selection
  };
  
  // Tag-Based Filtering
  tags: {
    availableTags: string[];        // All available tags (groups within communities)
    selectedTags: string[];         // Selected tags for narrowing audience
    tagMode: 'include' | 'exclude'; // Include or exclude tagged groups
  };
  
  // People Selection (FINAL ACTIVATION)
  people: {
    availablePeople: Person[];      // People from selected communities/tags
    selectedPeople: string[];       // Final people selection for WOD delivery
    selectionMode: 'all' | 'specific'; // All filtered people or specific selection
  };
  
  // WOD Configuration
  difficulty: 1 | 2 | 3 | 4 | 5;   // Difficulty rating
  estimatedDuration: number;        // Minutes
  tags: string[];                   // WOD categorization tags
  isPublished: boolean;             // Publication status
  scheduledDate?: string;           // Optional scheduling
  
  // Technical Settings
  autoSaveEnabled: boolean;         // Auto-save configuration
  previewMode: 'desktop' | 'tablet' | 'mobile'; // Default preview mode
}
```

#### **B. ELEMENTS Icon (Plus)**

**Purpose**: Access to basic building blocks for content creation
**Interaction**: Click to deploy Elements panel

**Deployed Elements Panel Options:**
- **Section Header**: H1-H6 headings for content organization
- **Rich Text**: Formatted text content with basic styling
- **List**: Google Forms/Trello style lists with checkboxes
- **Division**: Visual content separators and spacing
- **Quiz**: Interactive quiz with admin-controlled correct answers
- **Quote**: Blockquotes with attribution and styling
- **Image Upload**: Direct image upload (not from repository)

#### **C. CONTENT Icon (Document)**

**Purpose**: Access to repository-based content blocks
**Interaction**: Click to deploy Content panel

**Deployed Content Panel Options:**
- **Video**: Select from video repository
- **AI Agent**: Select from ai agent repository
- **Document**: Select from document repository
- **Prompts**: Select from prompts repository
- **Automation**: Select from automation repository
- **Image**: Select from image repository
- **PDF**: Select from pdf repository

#### **D. PAGES Icon (Stacked Rectangles)**

**Purpose**: Page management and navigation
**Interaction**: Click to deploy Pages panel

**Deployed Pages Panel Options:**
- **Create New Page**: Add new page to current WOD
- **Rename Pages**: Inline editing of page titles
- **Reorganize Pages**: Drag-and-drop page reordering
- **Page Templates**: Use predefined page templates
- **Duplicate Page**: Copy current page structure

### 2. Deployed Left Menus: Block Selection System

#### **A. Menu Deployment System**

**Interaction Pattern:**
1. Click any of the 4 fixed icons in left rail
2. Left menu deploys (slides out) with relevant options
3. No search bar needed - all options visible directly
4. Click option to add block or open repository

#### **B. Content Insertion Workflow (CORRECTED)**

**Step 1: Select Block Category**
1. Click **ELEMENTS Icon** → Deployed menu shows: Section Header, Rich Text, List, Division, Quiz, Quote, Image Upload
2. Click **CONTENT Icon** → Deployed menu shows: Video, AI Agent, Document, Prompts, Automation, Image, PDF

**Step 2: Block Addition**
- **ELEMENTS blocks**: Click option → block appears instantly in canvas
- **CONTENT blocks**: Click option → Repository Navigation Popup opens

**Step 3: Repository Navigation Popup (For CONTENT blocks only)**
When user clicks any CONTENT block type:
1. **Popup Opens**: Modal overlay with repository browser (e.g., "Select Videos")
2. **Content Filtering**: Shows only selected content type 
3. **Selection Interface**: 
   - Grid/list view of available content
   - Search functionality ("Search videos...")
   - Filter options ("Published Only")
   - Sort options (Name/Modified)
   - Preview capabilities for media content

**Step 4: Content Selection and Insertion**
1. **Single Selection**: User selects one content item
2. **SELECT CONTENT Button**: Confirms selection and closes popup
3. **Instant Embedding**: Content block appears immediately in canvas
4. **Auto-Selection**: New block becomes selected, right panel shows block editor

### 4. Center Canvas: Dynamic Content Creation Area

The center canvas is the primary content creation workspace, featuring a white background and comprehensive editing tools.

The center canvas is the primary content creation workspace, featuring a white background and comprehensive editing tools.

#### **A. Top Toolbar Configuration**

**Navigation Section:**
- **Back Arrow**: "← Back to Training Zone" - return to WOD list
- **WOD Title**: Editable title with draft indicator
- **Status Indicators**: Draft/Published status with visual badges

**Content Management Section:**
- **Pages Indicator**: "1 pages • Page: Page 1" showing total pages and current page
- **Unsaved Changes**: Visual indicator when content has been modified
- **Save Button**: Manual save with loading states and success feedback

**Preview Section:**
- **Preview Button**: Toggle between edit and preview modes
- **Device Toggles**: Desktop/Tablet/Mobile preview modes with responsive switching
- **Full Preview**: Launch full-screen preview in new tab

#### **B. Canvas Content Area**

**Initial State (Empty Canvas):**
```jsx
<EmptyCanvasState>
  <CentralMessage>
    "Start building your WOD"
  </CentralMessage>
  <Instructions>
    "Start building your WOD blocks from the left panel to create engaging content"
    "Use the left sidebar to add blocks and manage content"
  </Instructions>
  <VisualCue>
    Dotted border indicating droppable/clickable area
  </VisualCue>
</EmptyCanvasState>
```

**Content Building Process:**
1. **Block Insertion**: Click any block type from right panel → block appears instantly in canvas
2. **Block Positioning**: Blocks appear at bottom by default, can be reordered with up/down arrows
3. **Block Selection**: Click block to activate → right panel shows block-specific editor
4. **Inline Editing**: Text blocks allow direct inline editing with click-to-edit
5. **Block Management**: Each block has management controls in top-right corner

#### **C. Block Management System**

**Block Controls (Top-Right of Each Block):**
- **Up Arrow**: Move block higher in sequence
- **Down Arrow**: Move block lower in sequence  
- **Settings Gear**: Open block-specific settings
- **Delete X**: Remove block with confirmation

**Block States:**
- **Default**: Normal editing state with subtle border
- **Selected**: Blue border with visible controls and right panel activation
- **Editing**: Focused state for inline text editing
- **Error**: Red border for blocks with validation issues

**Block Reordering:**
- **Up/Down Arrows**: Simple click to move block one position
- **Visual Feedback**: Smooth animations showing block movement
- **Position Persistence**: Block order saves automatically
- **Cross-Page**: Cannot move blocks between pages (intentional limitation)

### 3. Right Panel: Block Editor Only

The right panel serves a single purpose: editing selected blocks. It only appears when a block is selected in the canvas.

#### **A. Block Editor Mode (Only When Block Selected)**

When a block is selected in the canvas, the right panel displays block-specific editing controls:

**Video Block Editor Example:**
```typescript
interface VideoBlockEditor {
  // Content Selection
  contentItem: {
    selectedVideo: RepositoryVideo | null;
    browseButton: 'Browse'; // Opens repository popup for changing video
    previewThumbnail: string; // Shows current video thumbnail
  };
  
  // Display Options
  displayTitle: {
    show: boolean; // Toggle to show/hide title
    text: string; // Custom title override
    style: 'default' | 'large' | 'small';
  };
  
  // Description Options  
  description: {
    show: boolean; // Toggle to show/hide description
    text: string; // Custom description override
    source: 'original' | 'custom'; // Use original or custom description
  };
  
  // Playback Settings
  playback: {
    autoplay: boolean;
    controls: boolean;
    loop: boolean;
    startTime?: number; // Optional start time in seconds
  };
  
  // Layout Options
  layout: {
    width: '100%' | '75%' | '50%' | 'custom';
    alignment: 'left' | 'center' | 'right';
    aspectRatio: '16:9' | '4:3' | 'original';
  };
}
```

**Image Block Editor (Repository Images):**
```typescript
interface ImageBlockEditor {
  // Content Selection
  contentItem: {
    selectedImage: RepositoryImage | null;
    browseButton: 'Browse'; // Opens image repository
    thumbnailPreview: string;
  };
  
  // Display Options
  altText: {
    text: string; // Alt text for accessibility
    source: 'original' | 'custom'; // Use repository alt text or custom
  };
  
  // Caption Options
  caption: {
    show: boolean;
    text: string;
    source: 'original' | 'custom';
    position: 'below' | 'overlay';
  };
  
  // Layout Options
  layout: {
    size: 'thumbnail' | 'medium' | 'large' | 'full' | 'custom';
    alignment: 'left' | 'center' | 'right';
    linkBehavior: 'none' | 'lightbox' | 'full-size';
  };
}
```

**PDF Block Editor (Repository PDFs):**
```typescript
interface PDFBlockEditor {
  // Content Selection
  contentItem: {
    selectedPDF: RepositoryPDF | null;
    browseButton: 'Browse'; // Opens PDF repository
    thumbnailPreview: string; // First page thumbnail
  };
  
  // Display Options
  displayMode: {
    mode: 'embedded' | 'link' | 'carousel'; // How PDF is presented
    height: number; // For embedded mode
    showToolbar: boolean; // PDF viewer controls
  };
  
  // Carousel Mode (LinkedIn-style)
  carousel: {
    enabled: boolean; // Use carousel for multi-page PDFs
    showPageNumbers: boolean;
    allowFullscreen: boolean;
    autoAdvance: boolean;
    slideInterval?: number; // For auto-advance
  };
  
  // Metadata Display
  metadata: {
    showTitle: boolean;
    showDescription: boolean;
    showPageCount: boolean;
    customTitle?: string; // Override repository title
  };
}
```

### 4. Pages Functionality (COMPREHENSIVE)

The pages system allows WODs to contain multiple pages, creating comprehensive training experiences.

#### **A. Pages Navigation (Top of Canvas)**

**Page Tab Display:**
- **Visual Style**: Tab-like interface above canvas
- **Current Page**: Active tab with highlighted styling
- **Page Titles**: Editable names (default: "Page 1", "Page 2", etc.)
- **Page Status**: Block count indicator ("5 blocks", "0 blocks")
- **Page Actions**: Right-click context menu for page operations

**Page Tab Example:**
```jsx
<PageTabs>
  <PageTab active={true} onClick={() => switchToPage(1)}>
    <PageTitle>Introduction</PageTitle>
    <BlockCount>3 blocks</BlockCount>
  </PageTab>
  <PageTab active={false} onClick={() => switchToPage(2)}>
    <PageTitle>Main Content</PageTitle>
    <BlockCount>7 blocks</BlockCount>
  </PageTab>
  <AddPageTab onClick={createNewPage}>
    <PlusIcon />
    New Page
  </AddPageTab>
</PageTabs>
```

#### **B. Page Management Operations**

**Creating New Pages:**
1. **Add Page Button**: Plus icon in page tabs area
2. **Page Template Selection**: Choose from templates or start blank
3. **Auto-Naming**: Default sequential naming ("Page 1", "Page 2", etc.)
4. **Immediate Switch**: Automatically switch to newly created page

**Renaming Pages:**
1. **Inline Editing**: Double-click page tab title to edit
2. **Context Menu**: Right-click → "Rename Page"
3. **Validation**: Prevent duplicate names, ensure non-empty titles
4. **Auto-Save**: Page names save immediately

**Reordering Pages:**
1. **Drag and Drop**: Drag page tabs to reorder (only for page tabs, not content blocks)
2. **Context Menu**: Right-click → "Move Left/Right"
3. **Visual Feedback**: Clear indication of drop zones and movement
4. **Persistence**: Order saves automatically

**Page Actions Menu:**
```typescript
interface PageContextMenu {
  rename: () => void;           // Inline rename functionality
  duplicate: () => void;        // Copy page with all blocks
  moveLeft: () => void;         // Reorder page position
  moveRight: () => void;        // Reorder page position
  deletePage: () => void;       // Delete with confirmation
  pageSettings: () => void;     // Individual page configuration
}
```

#### **C. Cross-Page Functionality**

**Page Independence:**
- **Block Scope**: Blocks belong to specific pages, cannot move between pages
- **Navigation State**: Page switching preserves editing state
- **Auto-Save**: Each page saves independently
- **Validation**: Each page validates independently

**Page Linking:**
- **Internal Links**: Blocks can link to other pages within same WOD
- **Navigation Blocks**: Special blocks for page-to-page navigation
- **Preview Mode**: Pages render as sequential flow in preview

### 5. Simplified Text Editing (One-Thing-at-a-Time)

Text editing follows a simplified, focused approach rather than complex WYSIWYG editors.

#### **A. Section Header Block**

**Functionality**: Simple heading creation with level selection
**Editing Model**: One thing at a time - either edit text OR change heading level

**Interaction Flow:**
1. **Initial State**: Click to add Section Header → appears with placeholder "Section Title"
2. **Text Editing**: Click text to edit inline with simple input field
3. **Level Selection**: Toolbar appears on focus with H1-H6 buttons
4. **Completion**: Click outside or Enter to finish editing

**Implementation:**
```typescript
interface SectionHeaderBlock {
  // Content
  text: string;                    // The heading text
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // Heading level
  
  // Styling (limited options)
  alignment: 'left' | 'center' | 'right';
  color: 'default' | 'primary' | 'secondary';
  
  // Interaction
  editMode: boolean;               // Currently being edited
  placeholder: string;             // Default placeholder text
}
```

**Visual Design:**
- **Heading Levels**: Clear visual hierarchy with appropriate font sizes
- **Level Selector**: Horizontal button group (H1, H2, H3, H4, H5, H6)
- **Inline Editing**: Text becomes editable input field on click
- **Focus State**: Clear visual indication when block is selected

#### **B. Rich Text Block**

**Functionality**: Formatted text with basic styling options
**Editing Model**: Simple toolbar with essential formatting only

**Formatting Options (Limited Set):**
- **Text Style**: Bold, Italic, Underline
- **Lists**: Bullet points, numbered lists
- **Links**: Simple URL linking
- **Alignment**: Left, center, right

**Implementation:**
```typescript
interface RichTextBlock {
  // Content
  content: string;                 // HTML content with basic formatting
  
  // Formatting Options
  allowedFormats: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    lists: boolean;
    links: boolean;
  };
  
  // Editor State
  editMode: boolean;
  cursorPosition?: number;
  selectedText?: string;
}
```

**Toolbar Design:**
```jsx
<RichTextToolbar>
  <FormatButton icon="Bold" active={isBold} onClick={toggleBold} />
  <FormatButton icon="Italic" active={isItalic} onClick={toggleItalic} />
  <FormatButton icon="Underline" active={isUnderline} onClick={toggleUnderline} />
  <Separator />
  <FormatButton icon="List" onClick={insertBulletList} />
  <FormatButton icon="OrderedList" onClick={insertNumberedList} />
  <Separator />
  <FormatButton icon="Link" onClick={insertLink} />
  <AlignmentGroup>
    <AlignButton align="left" active={alignment === 'left'} />
    <AlignButton align="center" active={alignment === 'center'} />
    <AlignButton align="right" active={alignment === 'right'} />
  </AlignmentGroup>
</RichTextToolbar>
```

### 6. List Functionality (Google Forms/Trello Style)

Lists function as interactive checklists similar to Google Forms or Trello, supporting different list types and checkbox functionality.

#### **A. List Types**

**Bullet Lists:**
- **Visual**: Traditional bullet points
- **Functionality**: Simple text list items
- **Use Case**: Non-interactive content organization

**Numbered Lists:**
- **Visual**: Sequential numbering (1., 2., 3.)
- **Functionality**: Ordered list items
- **Use Case**: Step-by-step instructions

**Checkbox Lists:**
- **Visual**: Checkboxes with text labels
- **Functionality**: Users can check/uncheck items
- **Use Case**: Task lists, requirements checklists

**Checklist (Trello Style):**
- **Visual**: Checkboxes with completion styling
- **Functionality**: Items show completed state with strikethrough
- **Progress**: Visual progress indicator
- **Use Case**: Project task management

#### **B. List Editor Interface**

**List Type Selector:**
```jsx
<ListTypeSelector>
  <TypeButton 
    active={type === 'bullet'} 
    onClick={() => setType('bullet')}
    icon="•"
    label="Bullets"
  />
  <TypeButton 
    active={type === 'numbered'} 
    onClick={() => setType('numbered')}
    icon="1."
    label="Numbers"
  />
  <TypeButton 
    active={type === 'checkbox'} 
    onClick={() => setType('checkbox')}
    icon="☐"
    label="Checkboxes"
  />
  <TypeButton 
    active={type === 'checklist'} 
    onClick={() => setType('checklist')}
    icon="✓"
    label="Checklist"
  />
</ListTypeSelector>
```

**List Item Management:**
- **Add Item**: "Add item" button below list (Google Forms style)
- **Edit Item**: Click to edit item text inline
- **Delete Item**: X button appears on hover
- **Reorder Items**: Up/down arrows for each item
- **Bulk Actions**: Select multiple items for bulk operations

#### **C. Checklist Functionality**

**User Interaction:**
- **Check/Uncheck**: Click checkbox to toggle completion
- **Visual Feedback**: Completed items show strikethrough text
- **Progress Tracking**: Progress bar showing completion percentage
- **State Persistence**: Checkbox states save with WOD

**Progress Display:**
```jsx
<ChecklistProgress>
  <ProgressBar value={completedItems} max={totalItems} />
  <ProgressText>
    {completedItems} of {totalItems} completed ({percentage}%)
  </ProgressText>
</ChecklistProgress>
```

### 7. Quiz Functionality with Admin Control

Quiz blocks allow creation of interactive assessments where admins have full control over correct answers.

#### **A. Quiz Question Types**

**Multiple Choice:**
- **Structure**: Question with multiple answer options
- **Admin Control**: Admin selects which options are correct
- **User Experience**: Users select one or more answers
- **Validation**: Immediate or delayed feedback

**True/False:**
- **Structure**: Statement with True/False options
- **Admin Control**: Admin sets correct answer
- **User Experience**: Single selection required
- **Validation**: Clear correct/incorrect feedback

**Short Answer:**
- **Structure**: Open text question
- **Admin Control**: Admin provides sample correct answers
- **User Experience**: Free text input
- **Validation**: Manual review or keyword matching

#### **B. Admin Quiz Editor**

**Question Creation Flow:**
1. **Add Question**: Click "Add Question" button
2. **Question Type**: Select from dropdown (Multiple Choice, True/False, Short Answer)
3. **Question Text**: Input field for question content
4. **Answer Options**: Add/edit answer choices
5. **Correct Answer Selection**: Admin marks correct options
6. **Explanation**: Optional explanation for correct answer

**Multiple Choice Question Editor:**
```jsx
<QuizQuestionEditor>
  <QuestionInput 
    value={question.text}
    onChange={updateQuestionText}
    placeholder="Enter your question..."
  />
  
  <QuestionType 
    value={question.type}
    onChange={updateQuestionType}
    options={['multiple-choice', 'true-false', 'short-answer']}
  />
  
  <AnswerOptions>
    {question.options.map((option, index) => (
      <AnswerOption key={option.id}>
        <CorrectAnswerCheckbox
          checked={option.isCorrect}
          onChange={(checked) => setCorrectAnswer(option.id, checked)}
          label="Correct"
        />
        <OptionInput
          value={option.text}
          onChange={(text) => updateOption(option.id, text)}
          placeholder={`Option ${index + 1}`}
        />
        <DeleteButton onClick={() => deleteOption(option.id)} />
      </AnswerOption>
    ))}
    <AddOptionButton onClick={addNewOption}>
      Add Option
    </AddOptionButton>
  </AnswerOptions>
  
  <ExplanationInput
    value={question.explanation}
    onChange={updateExplanation}
    placeholder="Explain the correct answer (optional)..."
  />
</QuizQuestionEditor>
```

#### **C. Quiz Display and Interaction**

**User Quiz Interface:**
- **Question Display**: Clear question text with appropriate styling
- **Answer Options**: Radio buttons (single choice) or checkboxes (multiple choice)
- **Submit/Next**: Navigation between questions
- **Progress Indicator**: Show current question number and total
- **Results Display**: Show score and correct answers after completion

**Admin Features:**
- **Preview Mode**: See quiz exactly as users will see it
- **Analytics**: Track quiz completion rates and common wrong answers
- **Question Bank**: Reuse questions across multiple quizzes
- **Randomization**: Optional random question/answer order

### 8. WOD Settings Configuration (COMPREHENSIVE)

WOD Settings serve as the primary configuration interface, accessible via the first icon in the left navigation rail. This comprehensive modal provides all essential WOD management functionality.

#### **A. WOD Settings Modal Structure**

**Modal Layout:**
```jsx
<WODSettingsModal>
  <ModalHeader>
    <Title>WOD Settings</Title>
    <SubTitle>{wodTitle}</SubTitle>
    <CloseButton onClick={closeModal} />
  </ModalHeader>
  
  <ModalContent>
    <SettingsSection title="Basic Information">
      <WODBasicInfo />
    </SettingsSection>
    
    <SettingsSection title="Community Targeting">
      <CommunitySelection />
    </SettingsSection>
    
    <SettingsSection title="Tag Filtering">
      <TagSelection />
    </SettingsSection>
    
    <SettingsSection title="People Selection">
      <PeopleSelection />
    </SettingsSection>
    
    <SettingsSection title="WOD Configuration">
      <WODConfiguration />
    </SettingsSection>
    
    <SettingsSection title="Publishing Settings">
      <PublishingSettings />
    </SettingsSection>
  </ModalContent>
  
  <ModalFooter>
    <CancelButton onClick={closeWithoutSaving}>Cancel</CancelButton>
    <SaveButton onClick={saveSettings} loading={saving}>
      Save Settings
    </SaveButton>
  </ModalFooter>
</WODSettingsModal>
```

#### **B. Basic Information Section**

**WOD Identity:**
- **WOD Name**: Text input with generic template default ("WOD [Date]" or "Training Session [Number]")
- **Description**: Textarea for WOD overview and objectives
- **Internal Notes**: Admin-only notes not visible to users
- **Created Date**: Auto-populated, read-only
- **Last Modified**: Auto-updated timestamp

#### **C. Community Targeting Section (CRITICAL)**

This section implements the corrected terminology and workflow focused on communities rather than communitys.

**Primary Community Selection:**
```jsx
<CommunitySelection>
  <SectionHeader>
    <Title>Target Communities</Title>
    <Description>Select which communities will have access to this WOD</Description>
  </SectionHeader>
  
  <CommunityDeployMenu>
    <SearchBar 
      placeholder="Search communities..."
      value={communitySearchTerm}
      onChange={setCommunitySearchTerm}
    />
    
    <SelectAllToggle>
      <Checkbox 
        checked={allCommunitiesSelected}
        onChange={toggleAllCommunities}
        label="Select All Communities"
      />
      <Count>({selectedCommunities.length} of {totalCommunities} selected)</Count>
    </SelectAllToggle>
    
    <CommunityList>
      {filteredCommunities.map(community => (
        <CommunityItem key={community.id}>
          <Checkbox 
            checked={selectedCommunities.includes(community.id)}
            onChange={(checked) => toggleCommunity(community.id, checked)}
          />
          <CommunityInfo>
            <CommunityName>{community.name}</CommunityName>
            <CommunityMeta>
              {community.memberCount} members • {community.activeMembers} active
            </CommunityMeta>
          </CommunityInfo>
        </CommunityItem>
      ))}
    </CommunityList>
  </CommunityDeployMenu>
</CommunitySelection>
```

#### **D. Tag Filtering Section**

Tags represent groups or categories within communities, allowing for more granular targeting.

**Tag Selection Interface:**
```jsx
<TagSelection>
  <SectionHeader>
    <Title>Tag Filtering</Title>
    <Description>Narrow down audience using tags (groups within communities)</Description>
  </SectionHeader>
  
  <TagDeployMenu>
    <FilterMode>
      <RadioGroup value={tagMode} onChange={setTagMode}>
        <RadioOption value="include">Include people with these tags</RadioOption>
        <RadioOption value="exclude">Exclude people with these tags</RadioOption>
      </RadioGroup>
    </FilterMode>
    
    <TagSearchBar 
      placeholder="Search available tags..."
      value={tagSearchTerm}
      onChange={setTagSearchTerm}
    />
    
    <AvailableTagsSection>
      <SectionTitle>Available Tags (from selected communities)</SectionTitle>
      {availableTags.map(tag => (
        <TagItem key={tag.id}>
          <Checkbox 
            checked={selectedTags.includes(tag.id)}
            onChange={(checked) => toggleTag(tag.id, checked)}
          />
          <TagInfo>
            <TagName>{tag.name}</TagName>
            <TagDescription>{tag.description}</TagDescription>
            <TagCount>{tag.memberCount} people</TagCount>
          </TagInfo>
        </TagItem>
      ))}
    </AvailableTagsSection>
  </TagDeployMenu>
</TagSelection>
```

#### **E. People Selection Section (FINAL ACTIVATION)**

The people selection is the final and most important step, as this application is fundamentally about people, not just communities or tags.

**People Selection Interface:**
```jsx
<PeopleSelection>
  <SectionHeader>
    <Title>People Selection</Title>
    <Description>
      Select specific people who will receive this WOD. 
      This is the final activation step.
    </Description>
  </SectionHeader>
  
  <FilteredPeopleCount>
    <Count>
      {filteredPeople.length} people available 
      (filtered by selected communities and tags)
    </Count>
  </FilteredPeopleCount>
  
  <PeopleDeployMenu>
    <SelectionMode>
      <RadioGroup value={peopleSelectionMode} onChange={setPeopleSelectionMode}>
        <RadioOption value="all">
          All filtered people ({filteredPeople.length})
        </RadioOption>
        <RadioOption value="specific">
          Select specific people
        </RadioOption>
      </RadioGroup>
    </SelectionMode>
    
    {peopleSelectionMode === 'specific' && (
      <SpecificPeopleSelection>
        <PeopleSearchBar 
          placeholder="Search people by name, email, or role..."
          value={peopleSearchTerm}
          onChange={setPeopleSearchTerm}
        />
        
        <PeopleList>
          {filteredPeople.map(person => (
            <PersonItem key={person.id}>
              <Checkbox 
                checked={selectedPeople.includes(person.id)}
                onChange={(checked) => togglePerson(person.id, checked)}
              />
              <PersonAvatar src={person.avatar} alt={person.name} />
              <PersonInfo>
                <PersonName>{person.name}</PersonName>
                <PersonRole>{person.role}</PersonRole>
                <PersonCommunities>
                  {person.communities.map(c => c.name).join(', ')}
                </PersonCommunities>
              </PersonInfo>
              <PersonStatus>
                <OnlineIndicator online={person.isOnline} />
                <LastActive>{person.lastActive}</LastActive>
              </PersonStatus>
            </PersonItem>
          ))}
        </PeopleList>
      </SpecificPeopleSelection>
    )}
  </PeopleDeployMenu>
  
  <SelectionSummary>
    <FinalCount>
      Final recipients: {getFinalRecipientCount()} people
    </FinalCount>
    <ActionButton 
      onClick={previewRecipients}
      variant="secondary"
    >
      Preview Recipients
    </ActionButton>
  </SelectionSummary>
</PeopleSelection>
```

#### **F. WOD Configuration Section**

**Training Parameters:**
- **Difficulty Level**: 1-5 scale with descriptions
- **Estimated Duration**: Time input in minutes
- **Category Tags**: WOD categorization for organization
- **Prerequisites**: Required prior WODs or knowledge
- **Learning Objectives**: Clear goals for participants

**Technical Configuration:**
- **Auto-Save Frequency**: How often to save progress
- **Preview Mode Default**: Desktop/tablet/mobile default view
- **Completion Tracking**: Enable/disable progress tracking
- **Deadline Settings**: Optional completion deadlines

#### **G. Publishing Settings Section**

**Publication Status:**
- **Draft**: WOD is being developed, not accessible to users
- **Published**: WOD is live and accessible to selected people
- **Scheduled**: WOD will publish at specified date/time
- **Archived**: WOD is no longer active but preserved

**Scheduling Options:**
- **Immediate Publication**: Publish as soon as settings are saved
- **Scheduled Publication**: Set specific date and time for go-live
- **Recurring Schedule**: Option for repeated WODs (daily, weekly, monthly)
- **Expiration Date**: Optional date when WOD becomes unavailable

### 9. Save System Implementation (COMPREHENSIVE)

The save system provides robust auto-save functionality with manual save options and comprehensive error handling.

#### **A. Save System Architecture**

**Multi-Level Save Strategy:**
1. **Auto-Save**: Continuous background saving of changes
2. **Manual Save**: User-initiated complete save operation
3. **Draft Persistence**: Maintain draft state across sessions
4. **Conflict Resolution**: Handle concurrent editing scenarios
5. **Recovery System**: Restore from save failures

#### **B. Auto-Save Implementation**

**Auto-Save Triggers:**
- **Text Changes**: Debounced save after text editing stops
- **Block Addition**: Immediate save when new blocks are added
- **Block Deletion**: Immediate save when blocks are removed
- **Block Reordering**: Save after reorder operations complete
- **Settings Changes**: Save WOD settings changes immediately
- **Page Operations**: Save after page creation, deletion, or reordering

**Auto-Save Visual Indicators:**
```jsx
<AutoSaveIndicator>
  {saveStatus === 'saving' && (
    <SaveStatus>
      <Spinner size="small" />
      <Text>Saving...</Text>
    </SaveStatus>
  )}
  
  {saveStatus === 'saved' && (
    <SaveStatus>
      <CheckIcon color="green" />
      <Text>All changes saved</Text>
      <Timestamp>Last saved: {lastSaveTime}</Timestamp>
    </SaveStatus>
  )}
  
  {saveStatus === 'error' && (
    <SaveStatus>
      <AlertIcon color="red" />
      <Text>Save failed</Text>
      <RetryButton onClick={retrySave}>Retry</RetryButton>
    </SaveStatus>
  )}
  
  {saveStatus === 'unsaved' && (
    <SaveStatus>
      <DotIcon color="orange" />
      <Text>Unsaved changes</Text>
    </SaveStatus>
  )}
</AutoSaveIndicator>
```

#### **C. Manual Save System**

**Save Button Functionality:**
- **Primary Action**: Full WOD save including all pages and settings
- **Loading State**: Visual feedback during save operation
- **Success Confirmation**: Clear indication of successful save
- **Error Handling**: Detailed error messages with recovery options

**Save Operation Flow:**
1. **Validation**: Check all blocks and pages for completeness
2. **Data Collection**: Gather all WOD data including metadata
3. **API Request**: Send consolidated save request
4. **Progress Feedback**: Show save progress for large WODs
5. **Completion**: Confirm successful save and update UI state

#### **D. Draft Management**

**Draft State Handling:**
- **Persistent Drafts**: Drafts saved even if user navigates away
- **Draft Recovery**: Restore drafts when user returns
- **Draft Comparison**: Show differences between draft and published versions
- **Draft Cleanup**: Automatic cleanup of old draft versions

### 10. Content Repository Backend Priority

The Content Repository serves as the foundation for all media and interactive content, requiring complete backend implementation before WOD builder development.

#### **A. Images Repository Backend**

**Image Upload System:**
```typescript
// Enhanced Image Upload Service
class ImageRepositoryService {
  private supabaseUrl = Deno.env.get('SUPABASE_URL');
  private serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  private bucketName = 'content-repository-images';

  async uploadImage(
    file: File, 
    organizationId: string, 
    metadata: ImageUploadMetadata
  ): Promise<RepositoryImage> {
    // File validation
    await this.validateImageFile(file);
    
    // Generate unique filename with organization structure
    const filename = this.generateUniqueFilename(file, organizationId);
    const storagePath = `organizations/${organizationId}/images/${filename}`;
    
    // Upload to Supabase Storage
    const uploadResult = await this.uploadToStorage(file, storagePath);
    
    // Generate thumbnail variants
    const thumbnails = await this.generateThumbnails(storagePath, file);
    
    // Extract image metadata
    const imageMetadata = await this.extractImageMetadata(file);
    
    // Save to database
    const imageRecord = await this.saveImageRecord({
      organizationId,
      filename,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageUrl: uploadResult.publicUrl,
      thumbnails,
      metadata: { ...imageMetadata, ...metadata },
      tags: metadata.tags || [],
      altText: metadata.altText || '',
      isPublished: metadata.isPublished || false
    });
    
    return imageRecord;
  }

  private async validateImageFile(file: File): Promise<void> {
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit: ${file.size} bytes`);
    }
    
    // Image dimension validation
    const dimensions = await this.getImageDimensions(file);
    if (dimensions.width > 4000 || dimensions.height > 4000) {
      throw new Error('Image dimensions too large');
    }
  }

  private async generateThumbnails(
    storagePath: string, 
    originalFile: File
  ): Promise<ThumbnailSet> {
    // Generate multiple thumbnail sizes
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 },
      { name: 'large', width: 1200, height: 1200 }
    ];
    
    const thumbnails: ThumbnailSet = {};
    
    for (const size of sizes) {
      const thumbnailPath = `${storagePath}_${size.name}`;
      const resizedImage = await this.resizeImage(originalFile, size);
      const uploadResult = await this.uploadToStorage(resizedImage, thumbnailPath);
      thumbnails[size.name] = uploadResult.publicUrl;
    }
    
    return thumbnails;
  }
}
```

#### **B. PDFs Repository Backend**

**PDF Processing System:**
```typescript
// PDF Repository Service with Carousel Support
class PDFRepositoryService {
  private supabaseUrl = Deno.env.get('SUPABASE_URL');
  private serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  private bucketName = 'content-repository-pdfs';

  async uploadPDF(
    file: File, 
    organizationId: string, 
    metadata: PDFUploadMetadata
  ): Promise<RepositoryPDF> {
    // PDF validation
    await this.validatePDFFile(file);
    
    // Generate unique filename
    const filename = this.generateUniqueFilename(file, organizationId);
    const storagePath = `organizations/${organizationId}/pdfs/${filename}`;
    
    // Upload to storage
    const uploadResult = await this.uploadToStorage(file, storagePath);
    
    // Extract PDF metadata and pages
    const pdfMetadata = await this.extractPDFMetadata(file);
    
    // Generate page thumbnails for carousel functionality
    const pageImages = await this.generatePageThumbnails(file, organizationId);
    
    // Save to database
    const pdfRecord = await this.savePDFRecord({
      organizationId,
      filename,
      originalName: file.name,
      fileSize: file.size,
      storageUrl: uploadResult.publicUrl,
      pageCount: pdfMetadata.pageCount,
      pageImages, // For LinkedIn-style carousel
      metadata: { ...pdfMetadata, ...metadata },
      title: metadata.title || file.name,
      description: metadata.description || '',
      tags: metadata.tags || [],
      isPublished: metadata.isPublished || false
    });
    
    return pdfRecord;
  }

  private async generatePageThumbnails(
    file: File, 
    organizationId: string
  ): Promise<PDFPageImage[]> {
    // Convert each PDF page to image for carousel display
    const pageImages: PDFPageImage[] = [];
    
    // Use PDF.js or similar library to extract pages
    const pdfDoc = await this.loadPDFDocument(file);
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = await this.renderPageToCanvas(page);
      const imageBlob = await this.canvasToBlob(canvas);
      
      // Upload page image to storage
      const pageImagePath = `organizations/${organizationId}/pdf-pages/${file.name}-page-${pageNum}.jpg`;
      const uploadResult = await this.uploadToStorage(imageBlob, pageImagePath);
      
      pageImages.push({
        pageNumber: pageNum,
        imageUrl: uploadResult.publicUrl,
        thumbnailUrl: uploadResult.publicUrl, // Could generate smaller thumbnail
        width: canvas.width,
        height: canvas.height
      });
    }
    
    return pageImages;
  }

  // PDF Carousel Display Component (for WOD builder)
  renderPDFCarousel(pdf: RepositoryPDF): JSX.Element {
    return (
      <PDFCarousel>
        <CarouselContainer>
          {pdf.pageImages.map((page, index) => (
            <CarouselSlide key={page.pageNumber}>
              <PageImage 
                src={page.imageUrl}
                alt={`Page ${page.pageNumber} of ${pdf.title}`}
                onClick={() => openFullscreen(pdf, page.pageNumber)}
              />
              <PageNumber>
                {page.pageNumber} / {pdf.pageCount}
              </PageNumber>
            </CarouselSlide>
          ))}
        </CarouselContainer>
        
        <CarouselControls>
          <PrevButton onClick={previousPage} disabled={currentPage === 1} />
          <PageIndicator>
            Page {currentPage} of {pdf.pageCount}
          </PageIndicator>
          <NextButton onClick={nextPage} disabled={currentPage === pdf.pageCount} />
        </CarouselControls>
        
        <CarouselActions>
          <FullscreenButton onClick={() => openFullscreen(pdf, currentPage)}>
            View Full Size
          </FullscreenButton>
          <DownloadButton onClick={() => downloadPDF(pdf.storageUrl)}>
            Download PDF
          </DownloadButton>
        </CarouselActions>
      </PDFCarousel>
    );
  }
}
```

#### **C. Content Repository UI Integration**

**Repository Browser Interface:**
```jsx
// Content Repository Browser for WOD Block Selection
const ContentRepositoryBrowser = ({ 
  contentType, 
  organizationId, 
  onSelect, 
  onClose 
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadRepositoryItems();
  }, [contentType, searchTerm, selectedTags]);

  const loadRepositoryItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-repository/${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          search: searchTerm,
          tags: selectedTags,
          publishedOnly: true // Only show published content for WOD embedding
        })
      });
      
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      console.error('Failed to load repository items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RepositoryBrowserModal>
      <ModalHeader>
        <Title>Select {contentType}</Title>
        <Subtitle>Choose from your content repository</Subtitle>
        <CloseButton onClick={onClose} />
      </ModalHeader>
      
      <BrowserToolbar>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={`Search ${contentType}...`}
        />
        
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
        
        <ViewModeToggle>
          <ViewButton 
            active={viewMode === 'grid'} 
            onClick={() => setViewMode('grid')}
            icon="Grid"
          />
          <ViewButton 
            active={viewMode === 'list'} 
            onClick={() => setViewMode('list')}
            icon="List"
          />
        </ViewModeToggle>
      </BrowserToolbar>
      
      <BrowserContent>
        {loading ? (
          <LoadingState>Loading {contentType}...</LoadingState>
        ) : items.length === 0 ? (
          <EmptyState>
            <EmptyIcon />
            <EmptyMessage>No {contentType} found</EmptyMessage>
            <CreateButton onClick={() => redirectToContentCreation(contentType)}>
              Create New {contentType}
            </CreateButton>
          </EmptyState>
        ) : (
          <ItemGrid viewMode={viewMode}>
            {items.map(item => (
              <RepositoryItem 
                key={item.id}
                item={item}
                contentType={contentType}
                viewMode={viewMode}
                onSelect={() => onSelect(item)}
              />
            ))}
          </ItemGrid>
        )}
      </BrowserContent>
      
      <ModalFooter>
        <CancelButton onClick={onClose}>Cancel</CancelButton>
        <SelectButton 
          onClick={() => onSelect(selectedItem)}
          disabled={!selectedItem}
        >
          Insert Selected {contentType}
        </SelectButton>
      </ModalFooter>
    </RepositoryBrowserModal>
  );
};
```

---

## 🚀 Implementation Timeline

### Week 1: Foundation and Content Repository
- **Days 1-2**: Content Repository backend (Images and PDFs priority)
- **Days 3-4**: WOD Settings modal and community targeting system
- **Day 5**: Content repository UI and browser components

### Week 2: Core Builder Interface
- **Days 6-7**: Three-column layout with corrected architecture
- **Days 8-9**: Left navigation rail and pages functionality
- **Day 10**: Right panel block selection and editing

### Week 3: Block System Implementation
- **Days 11-12**: ELEMENTS blocks (Section Header, Rich Text, Lists)
- **Days 13-14**: CONTENT blocks integration with repository
- **Day 15**: Quiz functionality with admin control

### Week 4: Integration and Polish
- **Days 16-17**: Save system and auto-save implementation
- **Days 18-19**: Block reordering and management controls
- **Day 20**: Testing, bug fixes, and final polish

---

## 🔧 Technical Implementation Notes

### Critical Success Factors

1. **Terminology Consistency**: "Communities" throughout all code, UI, and documentation
2. **Architecture Accuracy**: Three-column layout must match screenshot specifications
3. **Content Repository Priority**: Images and PDFs backend must be completed first
4. **People-Focused Design**: All targeting ultimately focuses on individual people
5. **Click-to-Embed Simplicity**: No drag-and-drop complexity
6. **Real-Time Updates**: Content changes propagate across all WODs using that content
7. **Auto-Save Reliability**: Robust save system preventing data loss

### Performance Considerations

- **Lazy Loading**: Repository content loads on demand
- **Image Optimization**: Automatic thumbnail generation and progressive loading
- **Save Debouncing**: Prevent excessive API calls during rapid editing
- **Memory Management**: Proper cleanup of event listeners and subscriptions
- **Mobile Responsiveness**: Touch-friendly interfaces for tablet/mobile editing

### Security Requirements

- **Organization Isolation**: Content strictly scoped to organization
- **Permission Validation**: User permissions checked on all operations
- **Content Sanitization**: All user input properly sanitized
- **File Upload Security**: Comprehensive file validation and scanning
- **API Rate Limiting**: Prevent abuse of upload and save endpoints

---

## 📝 Conclusion

This comprehensive document provides the definitive blueprint for Phase 5 implementation, incorporating all architectural corrections and detailed specifications. The plan prioritizes the Content Repository backend, implements the corrected three-column layout, and ensures community-focused functionality throughout.

The key to successful implementation is maintaining focus on the people-centered design philosophy, where communities serve as filters but individual people are the ultimate recipients and beneficiaries of the WOD content.

With this detailed specification, the development team can proceed with confidence, building a robust and user-friendly WOD Builder Engine that meets all functional requirements and provides an exceptional user experience.