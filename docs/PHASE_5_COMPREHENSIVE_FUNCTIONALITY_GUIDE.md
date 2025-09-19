# 🏋️‍♂️ Phase 5 Comprehensive Functionality Guide: WOD Page Builder Engine

**Version:** 1.0 - Complete Implementation Blueprint  
**Created:** 2025-09-16  
**Compiled from:** All Phase 5 iterations, working version analysis, and detailed user specifications  
**Status:** COMPREHENSIVE DEVELOPMENT GUIDE  

---

## 🎯 Executive Summary

This document provides a complete, detailed blueprint for Phase 5 - the WOD (Workout of the Day) Page Builder Engine. It captures every functionality, workflow, UI behavior, and technical requirement gathered from extensive analysis of working implementations, user feedback, and iterative development sessions.

**Phase 5 Core Achievement:** Transform the AI Gym platform from static content management to a dynamic, drag-and-drop page building system with comprehensive content repository integration.

### 🏆 Phase 5 Complete Feature Set
- **Three-Column Page Builder Interface**: Left navigation rail + center canvas + right properties panel
- **Complete Block System**: 12 block types across 3 categories with full functionality
- **Repository Integration Engine**: Seamless browsing and embedding of all content types
- **Advanced Block Management**: BLOCKS section for reusable block templates
- **Program Management System**: PROGRAMS section for workout program creation
- **Multi-Device Preview System**: Desktop/tablet/mobile preview with live updates
- **Content Assignment Workflows**: Advanced community and user targeting system

---

## 📐 Architecture Overview: Three-Column Layout System

### Layout Philosophy: "Command Center" Design
The Phase 5 interface follows a "command center" philosophy where every tool needed for page building is accessible without navigation away from the main workspace.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Top Application Bar                               │
│  AI Gym Logo | Dashboard | Communitys | Users | Tags | Training Zone | Content │
├────────────┬────────────────────────────────────────────────┬───────────────┤
│            │                                                │               │
│    Left    │                Center Canvas                   │     Right     │
│ Navigation │           (Drag & Drop Editor)                 │   Properties  │
│    Rail    │                                                │     Panel     │
│  (280px)   │                                                │   (320px)     │
│            │                                                │               │
│ ┌────────┐ │ ┌──────────────────────────────────────────┐   │ ┌───────────┐ │
│ │Elements│ │ │                                          │   │ │  Block    │ │
│ │Content │ │ │           Live Page Preview              │   │ │Properties │ │
│ │Interactive││                                          │   │ │           │ │
│ │        │ │ │          [Block] [Block]                 │   │ │Settings   │ │
│ │Setup   │ │ │          [Block] [Block]                 │   │ │           │ │
│ │Pages   │ │ │          [Block] [Block]                 │   │ │Community     │ │
│ └────────┘ │ │                                          │   │ │Assignment │ │
│            │ └──────────────────────────────────────────┘   │ └───────────┘ │
└────────────┴────────────────────────────────────────────────┴───────────────┘
```

### Responsive Behavior Specifications

#### Desktop (1200px+): Full Three-Column Layout
- **Left Rail**: 280px fixed width, fully expanded with block categories
- **Center Canvas**: Flexible width, optimal for content creation
- **Right Panel**: 320px fixed width, comprehensive property controls

#### Tablet (768px - 1199px): Adaptive Layout
- **Left Rail**: Collapsible to 64px icon-only mode with flyout panels
- **Center Canvas**: Adapts to available space, maintains usability
- **Right Panel**: 280px width, can be toggled on/off

#### Mobile (< 768px): Single-Panel Focus
- **Left Rail**: Hidden by default, accessible via hamburger menu
- **Center Canvas**: Full-width editing with touch-optimized controls
- **Right Panel**: Slide-over modal, triggered by block selection

---

## 🧱 Complete Block System Architecture

### Block Categories and Functionality

Phase 5 implements a comprehensive 12-block system organized into three logical categories:

#### 1. **Foundational Blocks** (6 Types) - Text & Layout Elements

**Block Type: Section Header**
- **Purpose**: Create structured headings (H1-H6) with professional formatting
- **Implementation**: `SectionHeaderBlock.tsx`
- **Features**:
  - Heading level selector (H1, H2, H3, H4, H5, H6)
  - Rich text formatting (bold, italic, color)
  - Alignment controls (left, center, right)
  - Custom CSS class support
  - Typography scale options
- **User Workflow**:
  1. Click Section Header in Elements panel
  2. Block appears with default "Section Title" text
  3. Click to enter edit mode (inline text editing)
  4. Right panel shows heading level, formatting options
  5. Real-time preview updates as user types
- **Data Structure**:
  ```typescript
  {
    type: 'section-header',
    data: {
      level: 'h2',
      text: 'Section Title',
      alignment: 'left',
      color: '#000000',
      customClass: '',
      fontWeight: 'bold'
    }
  }
  ```

**Block Type: Rich Text**
- **Purpose**: Full WYSIWYG text editing with comprehensive formatting
- **Implementation**: `RichTextBlock.tsx` with TipTap or similar editor
- **Features**:
  - Complete text formatting toolbar (bold, italic, underline, strikethrough)
  - Heading styles (H1-H6, paragraph)
  - List creation (bullets, numbers, checkboxes)
  - Link insertion and management
  - Blockquotes and code blocks
  - Text alignment and indentation
  - Color and highlighting options
- **User Workflow**:
  1. Add Rich Text block from Elements panel
  2. Click to activate WYSIWYG editor
  3. Floating toolbar appears with formatting options
  4. Right panel provides additional style controls
  5. Auto-save on content changes
- **Data Structure**:
  ```typescript
  {
    type: 'rich-text',
    data: {
      content: '<p>Rich text content with <strong>formatting</strong></p>',
      format: 'html',
      settings: {
        maxLength: null,
        allowedFormats: ['bold', 'italic', 'link'],
        placeholder: 'Enter your text here...'
      }
    }
  }
  ```

**Block Type: Image**
- **Purpose**: Display images with captions, sizing, and repository integration
- **Implementation**: `ImageBlock.tsx` with ContentPicker integration
- **Features**:
  - Repository browsing modal with search and filtering
  - Direct image upload capability
  - Multiple sizing options (small, medium, large, full-width, custom)
  - Alignment controls (left, center, right, justified)
  - Caption and alt-text management
  - Lightbox preview capability
  - Lazy loading optimization
- **User Workflow**:
  1. Add Image block from Content panel
  2. "Select Image" modal opens automatically
  3. Browse repository or upload new image
  4. Image appears with selection handles
  5. Right panel provides sizing, alignment, caption options
  6. Click image to reopen repository for changes
- **Data Structure**:
  ```typescript
  {
    type: 'image',
    data: {
      image: {
        id: 'img_123',
        url: 'https://storage.url/image.jpg',
        filename: 'workout-demo.jpg',
        alt: 'Workout demonstration',
        size: 1024000
      },
      caption: 'Proper squat form demonstration',
      size: 'medium',
      alignment: 'center',
      showCaption: true,
      lightbox: true
    }
  }
  ```

**Block Type: List**
- **Purpose**: Create structured lists with various formatting options
- **Implementation**: `ListBlock.tsx`
- **Features**:
  - List types: bullet points, numbered, checkboxes, custom bullets
  - Nested list support (sub-items)
  - Interactive checkboxes for task lists
  - Custom styling options
  - Drag-and-drop reordering
  - Import from clipboard (paste lists)
- **User Workflow**:
  1. Add List block from Elements panel
  2. Choose list type in right panel
  3. Click to add first item, press Enter for next item
  4. Tab to create sub-items, Shift+Tab to outdent
  5. Drag list items to reorder
- **Data Structure**:
  ```typescript
  {
    type: 'list',
    data: {
      listType: 'bullets',
      items: [
        { id: '1', text: 'First item', level: 0, checked: false },
        { id: '2', text: 'Second item', level: 1, checked: true },
        { id: '3', text: 'Third item', level: 0, checked: false }
      ],
      style: 'default',
      allowReordering: true
    }
  }
  ```

**Block Type: Quote**
- **Purpose**: Highlighted quotations with attribution and styling
- **Implementation**: `QuoteBlock.tsx`
- **Features**:
  - Quote text with rich formatting
  - Author attribution with title/position
  - Multiple quote styles (default, modern, minimal, boxed)
  - Color theming options
  - Optional author avatar
  - Citation/source linking
- **User Workflow**:
  1. Add Quote block from Elements panel
  2. Enter quote text in main text area
  3. Add author name and title in right panel
  4. Select quote style and color theme
  5. Optionally upload author avatar
- **Data Structure**:
  ```typescript
  {
    type: 'quote',
    data: {
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
      title: 'Co-founder of Apple',
      style: 'modern',
      theme: 'blue',
      avatar: null,
      source: 'Stanford Commencement 2005'
    }
  }
  ```

**Block Type: Divider**
- **Purpose**: Visual separation elements between content sections
- **Implementation**: `DividerBlock.tsx`
- **Features**:
  - Multiple divider styles (line, dots, decorative, custom)
  - Width and spacing controls
  - Color and opacity options
  - Margin adjustment (top/bottom spacing)
  - Optional text labels in dividers
- **User Workflow**:
  1. Add Divider block from Elements panel
  2. Choose divider style in right panel
  3. Adjust spacing and visual properties
  4. Optionally add text label
- **Data Structure**:
  ```typescript
  {
    type: 'divider',
    data: {
      style: 'line',
      width: '100%',
      color: '#cccccc',
      spacing: { top: 20, bottom: 20 },
      label: null,
      opacity: 1.0
    }
  }
  ```

#### 2. **Embedded Content Blocks** (4 Types) - Repository Integration

**Block Type: Video**
- **Purpose**: Embed videos from repository with comprehensive playback controls
- **Implementation**: `VideoBlock.tsx` with advanced VideoEditor
- **Features**:
  - Repository browsing with video previews and metadata
  - Upload capability for new videos
  - Custom video player with AI Gym branding
  - Playback controls (autoplay, loop, muted, controls visibility)
  - Video poster/thumbnail selection
  - Transcription display toggle
  - Video analytics tracking (play rate, completion)
  - Multiple quality/resolution support
- **User Workflow**:
  1. Add Video block from Content panel
  2. "Select Video" modal opens with repository browser
  3. Browse videos with thumbnail previews and metadata
  4. Select video or upload new one
  5. Configure playback settings in right panel
  6. Preview shows actual video player with controls
  7. Can change video by clicking "Change Video" button
- **Repository Integration**:
  - **Browse Interface**: Grid view with video thumbnails, titles, duration
  - **Search & Filter**: By title, tags, duration, upload date
  - **Upload Flow**: Drag-and-drop or file picker with progress indicator
  - **Metadata Management**: Title, description, transcription, tags
- **Data Structure**:
  ```typescript
  {
    type: 'video',
    data: {
      video: {
        id: 'vid_123',
        title: 'Advanced Squat Technique',
        filename: 'squat-technique.mp4',
        url: 'https://storage.url/videos/squat-technique.mp4',
        thumbnail: 'https://storage.url/thumbnails/squat-thumb.jpg',
        duration: 180,
        transcription: 'Today we will learn proper squat form...',
        size: 45000000
      },
      title: 'Learn Perfect Squat Form',
      description: 'Master the fundamentals of squatting',
      showTitle: true,
      showDescription: true,
      controls: {
        autoplay: false,
        loop: false,
        muted: false,
        showControls: true,
        showTranscription: false
      }
    }
  }
  ```

**Block Type: AI Agent**
- **Purpose**: Interactive AI chat integration with agent selection
- **Implementation**: `AIAgentBlock.tsx` with chat interface
- **Features**:
  - Repository of configured AI agents with different personalities
  - Interactive chat interface embedded in page
  - Customizable initial greeting messages
  - Chat history persistence within session
  - Multiple UI themes (default, modern, minimal)
  - Position options (inline, floating widget)
  - Agent capabilities display
  - Conversation analytics
- **User Workflow**:
  1. Add AI Agent block from Interactive panel
  2. "Select AI Agent" modal shows available agents
  3. Preview agent personalities and capabilities
  4. Select agent and configure initial message
  5. Chat interface appears with agent branding
  6. Configure display options and theming
- **Repository Integration**:
  - **Agent Library**: Browse configured AI agents with descriptions
  - **Agent Preview**: Test conversations before selection
  - **Capability Tags**: Filter agents by capabilities (Q&A, tutoring, support)
  - **Personality Profiles**: View agent personality and knowledge base
- **Data Structure**:
  ```typescript
  {
    type: 'ai-agent',
    data: {
      agent: {
        id: 'agent_123',
        name: 'Learning Assistant',
        description: 'Friendly AI tutor for workout guidance',
        personality: 'Patient, encouraging, knowledgeable',
        capabilities: ['Q&A', 'Form Correction', 'Motivation'],
        avatar: 'https://storage.url/avatars/learning-assistant.png'
      },
      title: 'Ask Your AI Trainer',
      description: 'Get personalized guidance and motivation',
      initialMessage: 'Hi! I\'m here to help with your workout questions.',
      showTitle: true,
      showDescription: true,
      chatEnabled: true,
      theme: 'default',
      position: 'inline'
    }
  }
  ```

**Block Type: Document**
- **Purpose**: Embed document gallery with browsing and viewing capability
- **Implementation**: `DocumentBlock.tsx` with document carousel
- **Features**:
  - Multi-document selection and display
  - LinkedIn-style carousel interface for multiple documents
  - Document preview with page thumbnails
  - Full-screen document viewer
  - Download capabilities
  - Document categorization and tagging
  - Search within document content
  - PDF, Word, and text file support
- **User Workflow**:
  1. Add Document block from Content panel
  2. "Browse Documents" modal with repository interface
  3. Multi-select documents for inclusion
  4. Configure display as single document or carousel
  5. Set document access permissions
  6. Preview shows document thumbnails or carousel
- **Repository Integration**:
  - **Document Library**: Organized by categories and tags
  - **Preview System**: Page thumbnails and content previews
  - **Bulk Selection**: Select multiple related documents
  - **Access Control**: Configure download and viewing permissions
- **Data Structure**:
  ```typescript
  {
    type: 'document',
    data: {
      documents: [
        {
          id: 'doc_123',
          title: 'Beginner\'s Guide to Weight Training',
          filename: 'weight-training-guide.pdf',
          url: 'https://storage.url/docs/weight-training-guide.pdf',
          thumbnail: 'https://storage.url/thumbs/weight-training-thumb.png',
          pages: 24,
          size: 2500000,
          category: 'Training Guides'
        }
      ],
      title: 'Essential Training Documents',
      description: 'Complete guides for your fitness journey',
      displayMode: 'carousel',
      allowDownload: true,
      showPreviews: true
    }
  }
  ```

**Block Type: PDF**
- **Purpose**: Specialized PDF viewer with advanced viewing features
- **Implementation**: `PDFBlock.tsx` with PDF.js integration
- **Features**:
  - Inline PDF viewer with page navigation
  - Zoom controls and full-screen mode
  - Page thumbnails sidebar
  - Text search within PDF
  - Annotation capabilities (future enhancement)
  - Print and download options
  - Mobile-optimized viewing
- **User Workflow**:
  1. Add PDF block from Content panel
  2. Select PDF from repository or upload new
  3. Configure viewer settings (zoom, controls visibility)
  4. PDF displays with navigation controls
  5. Users can view, navigate, and interact with PDF
- **Data Structure**:
  ```typescript
  {
    type: 'pdf',
    data: {
      pdf: {
        id: 'pdf_123',
        title: 'Nutrition Planning Workbook',
        filename: 'nutrition-workbook.pdf',
        url: 'https://storage.url/pdfs/nutrition-workbook.pdf',
        pages: 32,
        size: 8500000
      },
      title: 'Interactive Nutrition Workbook',
      description: 'Plan your meals and track your progress',
      showTitle: true,
      showDescription: true,
      viewer: {
        showControls: true,
        initialZoom: 'fit-width',
        allowDownload: true,
        allowPrint: true,
        showThumbnails: true
      }
    }
  }
  ```

#### 3. **Interactive Blocks** (2 Types) - Advanced Functionality

**Block Type: Quiz**
- **Purpose**: Interactive assessments with multiple question types
- **Implementation**: `QuizBlock.tsx` with comprehensive quiz engine
- **Features**:
  - Multiple question types (multiple choice, true/false, short answer, essay)
  - Drag-and-drop question builder
  - Answer randomization options
  - Immediate feedback and explanations
  - Scoring and grading system
  - Progress tracking and analytics
  - Time limits and constraints
  - Retry policies and attempt tracking
- **User Workflow**:
  1. Add Quiz block from Interactive panel
  2. Quiz builder opens with question creation interface
  3. Add questions of various types with answers
  4. Configure quiz settings (time limits, scoring, retries)
  5. Preview quiz as student would see it
  6. Quiz becomes interactive for end users
- **Data Structure**:
  ```typescript
  {
    type: 'quiz',
    data: {
      title: 'Workout Safety Assessment',
      description: 'Test your knowledge of gym safety',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What should you do before starting any workout?',
          options: [
            { id: 'a', text: 'Jump right in', correct: false },
            { id: 'b', text: 'Warm up properly', correct: true },
            { id: 'c', text: 'Lift the heaviest weight', correct: false }
          ],
          explanation: 'Proper warm-up prevents injury and improves performance.'
        }
      ],
      settings: {
        randomizeQuestions: false,
        randomizeAnswers: true,
        showCorrectAnswers: true,
        allowRetakes: true,
        passingScore: 70,
        timeLimit: 300,
        showTimer: true
      }
    }
  }
  ```

**Block Type: User Submission**
- **Purpose**: Form builder for collecting user submissions and feedback
- **Implementation**: `UserSubmissionBlock.tsx` with form builder
- **Features**:
  - Drag-and-drop form field builder
  - Multiple field types (text, email, file upload, rating, checkbox)
  - Conditional field logic
  - File upload capabilities with size/type restrictions
  - Email notifications for new submissions
  - Data export and management
  - Spam protection and validation
  - Custom success messages and redirects
- **User Workflow**:
  1. Add User Submission block from Interactive panel
  2. Form builder opens with field palette
  3. Drag fields onto form and configure properties
  4. Set up conditional logic and validation rules
  5. Configure submission handling and notifications
  6. Preview form as end user would see it
- **Data Structure**:
  ```typescript
  {
    type: 'user-submission',
    data: {
      title: 'Progress Report Submission',
      description: 'Share your weekly progress with your trainer',
      fields: [
        {
          id: 'field1',
          type: 'text',
          label: 'Your Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'field2',
          type: 'file',
          label: 'Progress Photos',
          required: false,
          allowedTypes: ['image/jpeg', 'image/png'],
          maxSize: 5000000
        }
      ],
      settings: {
        submitButtonText: 'Submit Progress',
        successMessage: 'Thank you! Your progress has been recorded.',
        collectEmail: false,
        allowAnonymous: true,
        enableNotifications: true,
        maxSubmissions: 1
      }
    }
  }
  ```

---

## 🎛️ Left Navigation Rail: Block Discovery System

### Navigation Philosophy: "Tool Palette" Approach
The left navigation rail serves as a comprehensive tool palette where users can quickly find and add any block type without extensive searching.

### Rail Structure and Behavior

#### Primary Navigation Icons (Fixed 64px Width)
```
┌─────────┐
│    📄   │  Elements (Foundational blocks)
│    📦   │  Content (Media & repository blocks)  
│    ⚡    │  Interactive (Advanced functionality blocks)
│   ───   │  [Divider]
│    ⚙️   │  Setup (Page settings)
│    📑   │  Pages (Page management)
│    👤   │  [User profile at bottom]
└─────────┘
```

#### Flyout Panel System (320px Width)
When a navigation icon is clicked, a flyout panel appears to the right showing the block options for that category:

**Elements Panel Content:**
```
┌─────────────────────────────────────┐
│  Elements                        ✕  │
├─────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │  T   │  │ TXT  │  │ IMG  │      │
│  │Header│  │ Rich │  │Image │      │
│  └──────┘  └──────┘  └──────┘      │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ LIST │  │ " "  │  │ ───  │      │
│  │ List │  │Quote │  │Divide│      │
│  └──────┘  └──────┘  └──────┘      │
│                                     │
│  💡 Text & Layout Elements          │
│  Build the foundation of your       │
│  content with text elements,        │
│  headers, lists, and layout         │
│  components.                        │
└─────────────────────────────────────┘
```

**Content Panel Content:**
```
┌─────────────────────────────────────┐
│  Content                         ✕  │
├─────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │  🎥  │  │ 📄   │  │ PDF  │      │
│  │Video │  │ Doc  │  │ PDF  │      │
│  └──────┘  └──────┘  └──────┘      │
│                                     │
│  📚 Rich Media Content              │
│  Enhance your content with images,  │
│  videos, documents, and other media │
│  from your repository.              │
└─────────────────────────────────────┘
```

**Interactive Panel Content:**
```
┌─────────────────────────────────────┐
│  Interactive                     ✕  │
├─────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ 💭   │  │ ⚡   │  │ ❓   │      │
│  │Prompt│  │Auto  │  │Quiz  │      │
│  └──────┘  └──────┘  └──────┘      │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ ⏶    │  │ 📋   │  │ 🤖   │      │
│  │Accord│  │Form  │  │ AI   │      │
│  └──────┘  └──────┘  └──────┘      │
│                                     │
│  🎮 Interactive Components          │
│  Engage users with quizzes, forms,  │
│  AI agents, automations, and other  │
│  interactive elements.              │
└─────────────────────────────────────┘
```

### Block Addition Workflow

#### Standard Block Addition Flow:
1. **User clicks category icon** (Elements/Content/Interactive)
2. **Flyout panel opens** showing available blocks in that category
3. **User clicks desired block type** (e.g., "Video")
4. **Flyout panel closes** automatically
5. **New block appears** in center canvas with default content
6. **Right properties panel opens** automatically for immediate configuration
7. **Block is selected** with blue border indicating active state

#### Quick Block Addition (Power User Feature):
- **Double-click** any category icon to open quick-add menu
- **Type to search** for specific block types across all categories
- **Keyboard shortcuts** for frequently used blocks (T for text, V for video, etc.)

### Rail Responsive Behavior

#### Desktop (1200px+): Full Rail Display
- Icons with labels visible
- Hover states show tooltips with descriptions
- Flyout panels have full width (320px)

#### Tablet (768px-1199px): Icon-Only Mode
- Labels hidden, icons only
- Tooltips become essential for usability
- Flyout panels adapt to available space

#### Mobile (<768px): Hidden by Default
- Accessible via hamburger menu
- Flyout panels become full-screen modals
- Touch-optimized button sizes

---

## 🎨 Right Properties Panel: Block Configuration System

### Panel Philosophy: "Context-Sensitive Controls"
The right properties panel dynamically adapts to show only relevant controls for the currently selected block, preventing cognitive overload while providing comprehensive configuration options.

### Panel Structure and Behavior

#### Panel States
1. **No Block Selected**: Panel shows welcome message with quick tips
2. **Block Selected**: Panel shows tabbed interface with block-specific controls
3. **Multiple Blocks Selected**: Panel shows common properties across selected blocks

#### Universal Panel Header
```
┌─────────────────────────────────────┐
│  📦 Video Block                  ✕  │  ← Block type icon and name, close button
├─────────────────────────────────────┤
│  Content | Settings | Advanced      │  ← Tab navigation
├─────────────────────────────────────┤
│                                     │
│  [Tab-specific content appears here] │
│                                     │
└─────────────────────────────────────┘
```

### Tab System for Complex Blocks

#### Content Tab
- **Primary configuration** for the block's main content
- **Repository selection** interfaces (video picker, document browser, etc.)
- **Content editing** tools (text editors, image uploading)
- **Preview components** showing how content will appear

#### Settings Tab
- **Display options** (show/hide elements, sizing, alignment)
- **Behavior settings** (autoplay, interactions, animations)
- **Style configuration** (colors, fonts, spacing)
- **Advanced properties** (CSS classes, custom attributes)

#### Advanced Tab (when applicable)
- **Community assignment** controls
- **Conditional display** rules
- **Analytics tracking** configuration
- **Integration settings** (API connections, webhooks)

### Block-Specific Property Panels

#### Video Block Properties Panel
```
Content Tab:
┌─────────────────────────────────────┐
│  📺 Video Selection                 │
│  ┌─────────────────────────────────┐ │
│  │ 🎥 Advanced Squat Technique    │ │
│  │ Duration: 3:24 | Size: 45MB    │ │
│  │ [Change Video] [Remove]         │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📝 Content Fields                  │
│  Title: [Learn Perfect Squat Form] │
│  Description:                       │
│  [Master the fundamentals...]       │
│                                     │
│  🎬 Video Preview                   │
│  [▶️ Video player with controls]    │
└─────────────────────────────────────┘

Settings Tab:
┌─────────────────────────────────────┐
│  👁️ Display Options                 │
│  ☑️ Show title                      │
│  ☑️ Show description                │
│  ☐ Show transcript                  │
│                                     │
│  🎮 Video Controls                  │
│  ☑️ Show player controls            │
│  ☐ Autoplay video                   │
│  ☐ Loop video                       │
│  ☐ Mute by default                  │
│                                     │
│  📐 Layout                          │
│  Size: [Medium ▼]                  │
│  Alignment: [● Center]              │
└─────────────────────────────────────┘
```

#### AI Agent Block Properties Panel
```
Content Tab:
┌─────────────────────────────────────┐
│  🤖 AI Agent Selection              │
│  ┌─────────────────────────────────┐ │
│  │ 🎯 Learning Assistant          │ │
│  │ Capabilities: Q&A, Tutoring     │ │
│  │ [Change Agent] [Test Chat]      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  💬 Chat Configuration              │
│  Initial Message:                   │
│  [Hi! I'm here to help with...]    │
│                                     │
│  Display Title:                     │
│  [Ask Your AI Trainer]             │
│                                     │
│  Description:                       │
│  [Get personalized guidance...]     │
└─────────────────────────────────────┘

Settings Tab:
┌─────────────────────────────────────┐
│  🎨 Appearance                      │
│  Theme: [Default ▼]                │
│  Position: [Inline ▼]              │
│                                     │
│  ⚙️ Behavior                        │
│  ☑️ Enable chat interface           │
│  ☑️ Show agent capabilities         │
│  ☐ Floating chat widget             │
│                                     │
│  📊 Analytics                       │
│  ☑️ Track conversations             │
│  ☑️ Monitor response quality        │
└─────────────────────────────────────┘
```

### Property Panel Interaction Patterns

#### Real-Time Preview Updates
- **Immediate visual feedback** when any property is changed
- **Debounced updates** for text inputs to prevent excessive re-renders
- **Preview mode toggle** to see changes in context

#### Property Validation
- **Visual indicators** for required fields (red border, asterisk)
- **Inline error messages** for invalid values
- **Warning messages** for potentially problematic configurations

#### Smart Defaults
- **Context-aware defaults** based on content type and block position
- **Inheritance from page settings** where appropriate
- **User preference memory** for frequently used settings

---

## 🔗 Content Repository Integration System

### Repository Philosophy: "Master Library" Approach
Following AI Gym's "master library" philosophy, all content is created once and deployed everywhere. The repository system provides unified access to all content types with consistent browsing, searching, and management interfaces.

### Unified Repository Interface Design

#### Two-Panel Repository Browser
```
┌───────────────────────────────────────────────────────────┐
│  📚 Browse Video Repository                            ✕  │
├──────────────┬────────────────────────────────────────────┤
│   Filters    │               Content Gallery              │
│              │                                            │
│ 🔍 Search    │  ┌────────┐ ┌────────┐ ┌────────┐         │
│ [workout...] │  │ 🎥     │ │ 🎥     │ │ 🎥     │         │
│              │  │Squats  │ │Deadlift│ │Cardio  │         │
│ 📂 Category  │  │3:24    │ │5:12    │ │12:45   │         │
│ ☑️ Beginner  │  └────────┘ └────────┘ └────────┘         │
│ ☐ Advanced   │                                            │
│              │  ┌────────┐ ┌────────┐ ┌────────┐         │
│ 📅 Date      │  │ 🎥     │ │ 🎥     │ │ 🎥     │         │
│ Last 30 days │  │Yoga    │ │HIIT    │ │Stretch │         │
│              │  │8:33    │ │15:20   │ │6:15    │         │
│ 🏷️ Tags      │  └────────┘ └────────┘ └────────┘         │
│ ☑️ core      │                                            │
│ ☐ strength   │  [Load More]  [Upload New]                 │
│              │                                            │
│ [Clear All]  │                                            │
└──────────────┴────────────────────────────────────────────┘
```

### Repository Types and Specific Behaviors

#### Video Repository
- **Visual Browsing**: Thumbnail previews with duration overlays
- **Metadata Display**: Title, duration, file size, upload date
- **Preview Capability**: Hover to play short preview, click for full preview
- **Upload Support**: Drag-and-drop video upload with progress indicator
- **Format Support**: MP4, WebM, MOV, AVI with automatic conversion
- **Transcription Integration**: Search within video transcriptions
- **Quality Options**: Multiple resolution support with automatic selection

**Video Selection Workflow:**
1. User clicks "Select Video" in video block
2. Repository modal opens with video grid view
3. User can search, filter by category/tags/duration
4. Hover on thumbnail shows preview
5. Click thumbnail selects video and closes modal
6. Or click "Upload New" to add video to repository

#### AI Agent Repository
- **Agent Profiles**: Display agent name, description, capabilities
- **Personality Preview**: Show agent personality and communication style
- **Capability Filtering**: Filter by agent capabilities (Q&A, tutoring, support)
- **Test Chat Interface**: Preview conversations before selection
- **Agent Categories**: Educational, Support, Sales, Creative, etc.
- **Performance Metrics**: Response quality, user satisfaction scores

**Agent Selection Workflow:**
1. User clicks "Select AI Agent" in AI agent block
2. Repository modal shows agent grid with profiles
3. User can filter by capabilities, category, or rating
4. Click "Test Chat" to preview agent personality
5. Select agent to embed in block
6. Configure initial message and display options

#### Document Repository
- **Document Grid**: Show document thumbnails with page previews
- **Category Organization**: Training Guides, Policies, References, etc.
- **Multi-Select Support**: Select multiple related documents
- **Preview System**: Quick document preview with page navigation
- **Version Management**: Track document versions and updates
- **Access Control**: Configure viewing and download permissions

**Document Selection Workflow:**
1. User clicks "Browse Documents" in document block
2. Repository modal shows categorized document library
3. User can select single document or multiple for carousel
4. Preview documents before selection
5. Configure display mode (single, carousel, grid)
6. Set access permissions for viewing and downloading

#### Image Repository
- **Gallery View**: Grid layout with image thumbnails
- **Bulk Upload**: Drag-and-drop multiple images
- **Image Editing**: Basic editing tools (crop, resize, rotate)
- **Tag Management**: Organize images with descriptive tags
- **Search by Visual**: Find similar images (future enhancement)
- **Usage Tracking**: See where images are used across platform

### Advanced Repository Features

#### Smart Search System
- **Content-Aware Search**: Search within video transcriptions, document text
- **Tag-Based Discovery**: Intelligent tag suggestions and auto-tagging
- **Usage-Based Recommendations**: Suggest content based on current page context
- **Cross-Repository Search**: Search across all content types simultaneously

#### Content Assignment Integration
Following the "permission slip" system from Chapter 5:
- **Community Assignment Interface**: Select which communitys can access content
- **Tag-Based Assignment**: Assign content to user groups via tags
- **Individual User Assignment**: Direct assignment to specific users
- **Visibility Rules**: Configure content visibility based on user roles

#### Repository Management Tools
- **Bulk Operations**: Select multiple items for batch operations
- **Content Analytics**: Track usage, engagement, and performance
- **Version Control**: Manage content updates and rollbacks
- **Storage Management**: Monitor storage usage and optimize files

---

## 💾 Save and Preview System

### Save Philosophy: "Continuous Safety" Approach
The save system prioritizes user data safety with automatic backups, version tracking, and clear indicators of save state to prevent content loss.

### Save State Management

#### Save State Indicators
```
Top Toolbar Save Button States:
┌─────────────────────────────────────┐
│ ✅ Saved                           │  ← All changes saved (green)
│ 🔄 Saving...                       │  ← Save in progress (blue, animated)
│ 💾 Save Changes                    │  ← Unsaved changes (blue, enabled)
│ ⚠️ Save Failed - Retry             │  ← Error state (red, retry action)
└─────────────────────────────────────┘
```

#### Auto-Save Behavior
- **Trigger Conditions**: After 30 seconds of inactivity, or every 2 minutes during active editing
- **Change Detection**: Monitors block additions, deletions, modifications, and order changes
- **Save Indicators**: Subtle status indicators show save progress without interrupting workflow
- **Conflict Resolution**: Handles multiple browser tabs editing same page

### Version Management

#### Page Version Tracking
```typescript
interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  blocks: Block[];
  metadata: {
    totalBlocks: number;
    lastModified: Date;
    modifiedBy: string;
    changeDescription: string;
    isAutoSave: boolean;
  };
}
```

#### Version History Interface
- **Version Timeline**: Show chronological list of page versions
- **Change Summaries**: Describe what changed in each version
- **Quick Restore**: One-click restore to previous version
- **Compare Versions**: Side-by-side comparison of page versions
- **Branch Protection**: Prevent accidental overwrites of important versions

### Preview System Architecture

#### Multi-Device Preview
```
Preview Toolbar:
┌─────────────────────────────────────┐
│ 🖥️ Desktop | 📱 Tablet | 📱 Mobile │  ← Device selector
│ ───────────────────────────────────│
│ 👁️ Preview Mode | ✏️ Edit Mode     │  ← Mode toggle
│ ───────────────────────────────────│
│ 🔗 Share Preview | 📋 Get Link     │  ← Share options
└─────────────────────────────────────┘
```

#### Preview Modes

**Live Preview Mode (Default)**:
- **Real-time updates** as blocks are modified
- **Interactive elements** remain functional (videos play, forms work)
- **Responsive breakpoints** update dynamically
- **Edit overlay** shows block boundaries and edit controls

**Full Preview Mode**:
- **Clean preview** without edit controls or block boundaries
- **True user experience** exactly as end users will see it
- **All interactions** work as in production (forms submit, analytics track)
- **Device emulation** with accurate screen sizes and touch behavior

**Shared Preview Mode**:
- **Public preview links** for stakeholder review
- **Comment system** for feedback collection
- **Version-locked** prevents changes during review
- **Analytics tracking** for preview engagement

### Preview Functionality by Block Type

#### Text Blocks (Section Header, Rich Text, List, Quote)
- **Typography rendering** with accurate fonts and spacing
- **Responsive text scaling** for different screen sizes
- **Interactive editing** in live preview mode
- **Text overflow handling** for long content

#### Media Blocks (Video, Image, PDF, Document)
- **Full media playback** capabilities in preview
- **Loading state simulation** with actual file sizes
- **Responsive media scaling** for different viewports
- **Download testing** for user-facing download links

#### Interactive Blocks (AI Agent, Quiz, User Submission)
- **Functional interactions** in preview mode
- **Form submission testing** with validation
- **AI chat testing** with actual agent responses
- **Analytics tracking** for preview interactions

### Preview Performance Optimization

#### Lazy Loading Implementation
- **Progressive block rendering** for pages with many blocks
- **Image lazy loading** with placeholder states
- **Video preloading** configuration based on viewport
- **Component-level code splitting** for interactive blocks

#### Preview Caching Strategy
- **Block-level caching** for expensive renders
- **Media asset caching** with CDN integration
- **API response caching** for repository content
- **Preview state persistence** across browser sessions

---

## 🎛️ Advanced Block Management: BLOCKS Section

### BLOCKS Philosophy: "Reusable Excellence" System
The BLOCKS section transforms frequently used block combinations into reusable templates, dramatically accelerating page creation while maintaining consistency.

### Block Template System Architecture

#### Template Categories
```
Block Template Organization:
┌─────────────────────────────────────┐
│  📂 Workout Templates               │
│    - Beginner Workout Structure     │
│    - HIIT Training Format           │
│    - Strength Training Layout       │
│                                     │
│  📂 Educational Templates           │
│    - Lesson Plan Structure          │
│    - Assessment Framework           │
│    - Study Guide Format             │
│                                     │
│  📂 Assessment Templates            │
│    - Progress Check Format          │
│    - Skills Evaluation Layout       │
│    - Knowledge Quiz Structure       │
│                                     │
│  📂 Custom Templates                │
│    - User-created templates         │
│    - Organization-specific layouts  │
│    - Imported template collections  │
└─────────────────────────────────────┘
```

### Template Creation Workflow

#### Creating Templates from Existing Blocks
1. **Block Selection**: User selects blocks in main canvas (Ctrl+click for multiple)
2. **Template Creation**: Right-click → "Create Template from Selection" or toolbar button
3. **Template Configuration**:
   ```
   ┌─────────────────────────────────────┐
   │  Create Block Template               │
   ├─────────────────────────────────────┤
   │  Template Name:                     │
   │  [Beginner Workout Introduction]    │
   │                                     │
   │  Description:                       │
   │  [Standard intro format for...]     │
   │                                     │
   │  Category: [Workout Templates ▼]   │
   │                                     │
   │  Thumbnail:                         │
   │  [Auto-generate] [Upload custom]    │
   │                                     │
   │  Share Settings:                    │
   │  ☑️ Organization library            │
   │  ☐ Public template gallery         │
   │                                     │
   │  [Cancel] [Create Template]         │
   └─────────────────────────────────────┘
   ```
4. **Template Saving**: Template saved with preview thumbnail and metadata
5. **Template Availability**: Immediately available in template library

#### Template Builder Interface
**Advanced Template Creation**:
```
Template Builder (Full-Screen Mode):
┌─────────────────────────────────────────────────────────────┐
│  Template Builder: "Advanced Assessment Layout"         ✕  │
├─────────────────────────────────────────────────────────────┤
│ 📦 Blocks Palette │     Template Canvas      │ Settings     │
│                   │                          │              │
│ [Drag blocks here │  [Section Header]        │ Template Info│
│  to build template│  [Rich Text]             │ Name: [...]  │
│  structure]       │  [Quiz Block]            │ Category:    │
│                   │  [AI Agent]              │ [Assessment] │
│ 🧱 Section Header │  [User Submission]       │              │
│ 📝 Rich Text      │                          │ Variables:   │
│ ❓ Quiz           │  + Add Block             │ ☑️ Title     │
│ 🤖 AI Agent      │                          │ ☑️ Difficulty│
│ 📋 User Form     │                          │ ☑️ Duration  │
│                   │                          │              │
│ [Save Template]   │  [Preview Template]      │ [Advanced]   │
└─────────────────────────────────────────────────────────────┘
```

### Template Management System

#### Template Library Interface
```
BLOCKS Section Main View:
┌─────────────────────────────────────────────────────────────┐
│  📚 Block Templates                   🔍 [search] [+ Create] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📂 Workout Templates (12)                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 🏋️‍♂️     │ │ 🏃‍♂️     │ │ 🧘‍♀️     │ │ 💪      │      │
│  │Beginner  │ │HIIT      │ │Yoga      │ │Strength  │      │
│  │Workout   │ │Training  │ │Session   │ │Training  │      │
│  │5 blocks  │ │8 blocks  │ │6 blocks  │ │7 blocks  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  📂 Educational Templates (8)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 📚       │ │ 🎯       │ │ 📝       │ │ 🔬       │      │
│  │Lesson    │ │Learning  │ │Study     │ │Lab       │      │
│  │Plan      │ │Objective │ │Guide     │ │Exercise  │      │
│  │4 blocks  │ │3 blocks  │ │6 blocks  │ │9 blocks  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  📂 Custom Templates (3)                [+ Create Custom]   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ 🎨       │ │ 🔧       │ │ 📊       │                    │
│  │Brand     │ │Community    │ │Report    │                    │
│  │Intro     │ │Onboard   │ │Template  │                    │
│  │3 blocks  │ │12 blocks │ │8 blocks  │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

#### Template Usage Workflow
1. **Template Selection**: User browses template library, can preview templates
2. **Template Insertion**: 
   - **Option A**: Drag template to canvas position
   - **Option B**: Click template, choose "Insert at cursor" or "Add to end"
   - **Option C**: Use quick-insert menu in page builder
3. **Variable Configuration**:
   ```
   Template Variables Configuration:
   ┌─────────────────────────────────────┐
   │  Configure "Beginner Workout"       │
   ├─────────────────────────────────────┤
   │  Workout Title:                     │
   │  [Introduction to Weight Training] │
   │                                     │
   │  Difficulty Level:                  │
   │  [Beginner ▼]                      │
   │                                     │
   │  Duration:                          │
   │  [30 minutes]                       │
   │                                     │
   │  Instructor Name:                   │
   │  [Sarah Johnson]                    │
   │                                     │
   │  [Cancel] [Insert Template]         │
   └─────────────────────────────────────┘
   ```
4. **Template Customization**: After insertion, all blocks can be individually modified

### Block Collection System

#### Collection Block Implementation
**Purpose**: Create expandable/collapsible sections containing multiple related blocks

**Block Collection Interface**:
```
Block Collection Display (Collapsed):
┌─────────────────────────────────────┐
│  📚 Warm-Up Routine              ▶️  │
│  5 exercises • 10 minutes           │
│  Click to expand complete routine   │
└─────────────────────────────────────┘

Block Collection Display (Expanded):
┌─────────────────────────────────────┐
│  📚 Warm-Up Routine              ▼️  │
├─────────────────────────────────────┤
│  🏃‍♂️ Dynamic Stretching              │
│  [Video block with stretching demo] │
│                                     │
│  💪 Joint Mobility                   │
│  [Rich text with instructions]      │
│                                     │
│  ❤️ Heart Rate Check                 │
│  [User submission form for HR]      │
│                                     │
│  🎯 Readiness Assessment             │
│  [Quiz block with readiness check]  │
│                                     │
│  🤖 AI Form Coach                    │
│  [AI agent for form guidance]       │
└─────────────────────────────────────┘
```

#### Collection Management Features
- **Nested Collections**: Collections can contain other collections for hierarchical organization
- **Progress Tracking**: Track completion of individual items within collections
- **Conditional Display**: Show/hide collection items based on user progress or preferences
- **Collection Analytics**: Track engagement with collection items and expansion rates

---

## 🏃‍♂️ PROGRAMS Section: Workout Program Management

### PROGRAMS Philosophy: "Structured Learning Journeys"
The PROGRAMS section enables creation and management of structured workout programs that combine multiple WODs into cohesive, progressive training experiences.

### Program Architecture

#### Program Structure Hierarchy
```
Program Organization:
┌─────────────────────────────────────┐
│  🏃‍♂️ 12-Week Strength Program        │
├─────────────────────────────────────┤
│  📅 Week 1: Foundation              │
│    └── Day 1: Introduction WOD     │
│    └── Day 3: Basic Movements WOD  │
│    └── Day 5: Assessment WOD       │
│                                     │
│  📅 Week 2: Building Strength      │
│    └── Day 1: Progressive Load WOD │
│    └── Day 3: Compound Moves WOD   │
│    └── Day 5: Endurance Test WOD   │
│                                     │
│  📅 Week 3: Intermediate Level     │
│    └── [Continues for all 12 weeks]│
└─────────────────────────────────────┘
```

### Program Creation Interface

#### Program Builder Workflow
```
Program Builder Main Interface:
┌─────────────────────────────────────────────────────────────┐
│  Create New Program                                      ✕  │
├─────────────────────────────────────────────────────────────┤
│ Program Details │    Program Structure    │   Settings      │
│                 │                         │                 │
│ Name:           │  📅 Week 1             │ Difficulty:     │
│ [Strength...]   │  ├── Day 1: [Select WOD▼] │ [Intermediate] │
│                 │  ├── Day 3: [Select WOD▼] │                 │
│ Description:    │  └── Day 5: [Select WOD▼] │ Duration:       │
│ [A comprehensive│                         │ [12 weeks]     │
│  strength...]   │  📅 Week 2             │                 │
│                 │  ├── Day 1: [Select WOD▼] │ Frequency:      │
│ Category:       │  ├── Day 3: [Select WOD▼] │ [3x per week]  │
│ [Strength ▼]    │  └── Day 5: [Select WOD▼] │                 │
│                 │                         │ Prerequisites: │
│ Instructor:     │  [+ Add Week]           │ [None]         │
│ [Sarah Johnson] │                         │                 │
│                 │                         │ Equipment:      │
│ Thumbnail:      │                         │ ☑️ Dumbbells    │
│ [Upload Image]  │                         │ ☑️ Barbell      │
│                 │                         │ ☐ Resistance   │
│ [Save Draft] [Preview Program] [Publish]  │                 │
└─────────────────────────────────────────────────────────────┘
```

#### WOD Assignment Interface
When assigning WODs to program days:
```
WOD Selection Modal:
┌─────────────────────────────────────┐
│  Select WOD for Week 1, Day 1       │
├─────────────────────────────────────┤
│  🔍 [Search WODs...]                │
│                                     │
│  📂 Filter by Category:             │
│  ☑️ Beginner  ☑️ Strength          │
│  ☐ Advanced   ☐ Cardio             │
│                                     │
│  📋 Available WODs:                 │
│  ┌─────────────────────────────────┐ │
│  │ 🏋️‍♂️ Foundation Strength      ✅ │ │
│  │ Duration: 45 min | Difficulty: B│ │
│  │ [Preview] [Select]              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 💪 Basic Movement Patterns     │ │
│  │ Duration: 30 min | Difficulty: B│ │
│  │ [Preview] [Select]              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Create New WOD] [Cancel]          │
└─────────────────────────────────────┘
```

### Program Management Features

#### Program Dashboard
```
PROGRAMS Section Main View:
┌─────────────────────────────────────────────────────────────┐
│  🏃‍♂️ Workout Programs               🔍 [search] [+ Create]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Program Statistics                                      │
│  Active Programs: 12 | Total Enrollments: 348             │
│  This Month: 23 new enrollments | 89% completion rate      │
│                                                             │
│  📂 Strength Programs (5)                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 💪       │ │ 🏋️‍♂️     │ │ ⚡        │ │ 🎯       │      │
│  │12-Week   │ │Powerlifter│ │HIIT      │ │Olympic   │      │
│  │Strength  │ │Foundation │ │Strength  │ │Lifting   │      │
│  │156 users │ │89 users   │ │203 users │ │67 users  │      │
│  │[Edit]    │ │[Edit]     │ │[Edit]    │ │[Edit]    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  📂 Cardio Programs (3)                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ 🏃‍♂️       │ │ 🚴‍♀️       │ │ 🏊‍♂️       │                    │
│  │Couch to  │ │Cycling   │ │Swimming  │                    │
│  │5K        │ │Endurance │ │Technique │                    │
│  │124 users │ │56 users  │ │34 users  │                    │
│  │[Edit]    │ │[Edit]    │ │[Edit]    │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

#### Program Analytics Dashboard
```
Program Performance Analytics:
┌─────────────────────────────────────┐
│  📊 12-Week Strength Program Stats │
├─────────────────────────────────────┤
│  📈 Enrollment Trends              │
│  [Line chart showing enrollment]    │
│                                     │
│  🎯 Completion Rates by Week        │
│  Week 1: ████████████ 98%          │
│  Week 2: ███████████  92%          │
│  Week 3: ██████████   87%          │
│  Week 4: █████████    82%          │
│  [Continue for all weeks]           │
│                                     │
│  🔥 Most Popular WODs               │
│  1. Foundation Strength (4.8⭐)     │
│  2. Progressive Overload (4.7⭐)    │
│  3. Compound Movements (4.6⭐)      │
│                                     │
│  💬 Recent Feedback                 │
│  "Great progression structure!"     │
│  "Videos are super helpful"        │
│  "Could use more rest day guidance" │
└─────────────────────────────────────┘
```

### Program Features and Functionality

#### Adaptive Progression System
- **Performance Tracking**: Monitor user performance across program WODs
- **Automatic Adjustments**: Suggest program modifications based on user progress
- **Alternative Paths**: Provide different tracks for users struggling or excelling
- **Rest Day Management**: Include active recovery and rest day guidance

#### Program Customization Options
- **Personalized Scheduling**: Allow users to adjust workout frequency and timing
- **Equipment Modifications**: Provide alternative exercises for limited equipment
- **Difficulty Scaling**: Offer beginner, intermediate, and advanced versions
- **Goal Alignment**: Customize programs based on user fitness goals

#### Integration with Progress Tracking
- **Milestone Tracking**: Set and track key program milestones
- **Progress Visualization**: Show user progress through program timeline
- **Achievement Badges**: Award badges for program completion and milestones
- **Social Features**: Enable users to share progress and encourage others

---

## 🎯 Content Assignment and Community Management

### Assignment Philosophy: "Permission Slip" System
Following AI Gym's established "permission slip" philosophy, all content assignment is based on explicit permission grants rather than broad access control, ensuring precise content targeting.

### Community Assignment Interface

#### Assignment Control Panel
```
Community Assignment (Right Panel Section):
┌─────────────────────────────────────┐
│  👥 Community Assignment               │
├─────────────────────────────────────┤
│  📊 Assignment Overview             │
│  Currently assigned to: 3 communitys  │
│  Total potential users: 127        │
│                                     │
│  🏢 Community Assignments              │
│  ┌─────────────────────────────────┐ │
│  │ 🏋️‍♂️ FitnessPro Gym         ✅  │ │
│  │ Assigned to: 2 tags, 5 users   │ │
│  │ [Manage Assignment]             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 🏃‍♀️ HealthFirst Clinic      ✅  │ │
│  │ Assigned to: 1 tag, 12 users   │ │
│  │ [Manage Assignment]             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 💼 Corporate Wellness Co     ❌  │ │
│  │ Not assigned                    │ │
│  │ [Assign to Community]              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [+ Assign to New Community]           │
└─────────────────────────────────────┘
```

#### Detailed Assignment Modal
```
Community Assignment Detail Modal:
┌─────────────────────────────────────┐
│  Manage Assignment: FitnessPro Gym  │
├─────────────────────────────────────┤
│  🏷️ Assign to User Tags             │
│  ┌─────────────────────────────────┐ │
│  │ 🔍 [Search tags...]             │ │
│  │                                 │ │
│  │ Available Tags:                 │ │
│  │ ☑️ beginners (23 users)         │ │
│  │ ☑️ advanced (12 users)          │ │
│  │ ☐ seniors (8 users)             │ │
│  │ ☐ athletes (15 users)           │ │
│  │                                 │ │
│  │ Selected: beginners, advanced   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  👤 Assign to Specific Users        │
│  ┌─────────────────────────────────┐ │
│  │ 🔍 [Search users...]            │ │
│  │                                 │ │
│  │ Available Users:                │ │
│  │ ☑️ Sarah Johnson                │ │
│  │ ☑️ Mike Chen                    │ │
│  │ ☑️ Lisa Rodriguez               │ │
│  │ ☐ David Kim                     │ │
│  │ ☐ Emma Wilson                   │ │
│  │                                 │ │
│  │ Selected: 3 individual users    │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📊 Assignment Summary              │
│  Total users who will see content: │
│  • 35 via tags (beginners: 23,     │
│    advanced: 12)                   │
│  • 3 individual assignments        │
│  • Total: 38 users                 │
│                                     │
│  [Cancel] [Save Assignment]         │
└─────────────────────────────────────┘
```

### Advanced Assignment Features

#### Conditional Assignment Rules
```typescript
interface AssignmentRule {
  id: string;
  name: string;
  conditions: {
    userProgress?: {
      minimumLevel: number;
      completedPrograms: string[];
      skillTags: string[];
    };
    timeBasedAccess?: {
      startDate: Date;
      endDate: Date;
      timeZone: string;
    };
    deviceRestrictions?: {
      allowedDevices: ('desktop' | 'tablet' | 'mobile')[];
      requireApp: boolean;
    };
    prerequisiteContent?: {
      requiredWODs: string[];
      requiredProgramCompletion: string[];
    };
  };
  actions: {
    grantAccess: boolean;
    sendNotification: boolean;
    trackAnalytics: boolean;
  };
}
```

#### Bulk Assignment Operations
- **Template-Based Assignment**: Apply assignment templates to multiple pieces of content
- **Program-Level Assignment**: Assign entire programs with cascading permissions
- **Bulk Tag Management**: Apply multiple tags to content batches
- **Assignment Import/Export**: Transfer assignments between environments

#### Assignment Analytics
- **Access Patterns**: Track how assigned content is accessed and consumed
- **Assignment Effectiveness**: Measure engagement rates by assignment method
- **Coverage Analysis**: Identify users who may need additional content assignments
- **Permission Auditing**: Track assignment changes and access grants over time

---

## 🔧 Technical Implementation Details

### React Architecture Patterns

#### Component Structure
```typescript
// Main page builder component architecture
src/pages/WorldClassPageBuilderEditor.tsx
├── components/
│   ├── LeftNavigationRail.tsx
│   ├── RightSidebar.tsx
│   ├── ContentPicker/
│   │   ├── ContentPicker.tsx
│   │   ├── VideoRepository.tsx
│   │   ├── AIAgentRepository.tsx
│   │   └── DocumentRepository.tsx
│   └── BlockEditors/
│       ├── TextEditor.tsx
│       ├── VideoEditor.tsx
│       ├── AIAgentEditor.tsx
│       ├── QuizEditor.tsx
│       └── [Other block editors]
```

#### State Management Strategy
```typescript
// Global state structure for page builder
interface PageBuilderState {
  // Page data
  currentPage: {
    id: string;
    title: string;
    blocks: Block[];
    metadata: PageMetadata;
  };
  
  // UI state
  ui: {
    selectedBlockId: string | null;
    showRightPanel: boolean;
    previewMode: boolean;
    devicePreview: 'desktop' | 'tablet' | 'mobile';
    leftPanelActiveTab: string | null;
  };
  
  // Content repositories
  repositories: {
    videos: Video[];
    aiAgents: AIAgent[];
    documents: Document[];
    images: Image[];
    loadingStates: Record<string, boolean>;
  };
  
  // Save state
  saveState: {
    hasUnsavedChanges: boolean;
    lastSaveTime: Date | null;
    saving: boolean;
    saveError: string | null;
  };
}
```

#### Performance Optimization Patterns
```typescript
// Block component memoization
const VideoBlock = React.memo(({ block, isSelected, onUpdate }) => {
  const content = useMemo(() => block.content || {}, [block.content]);
  
  const handleChange = useCallback((updates) => {
    onUpdate({
      ...block,
      content: { ...content, ...updates }
    });
  }, [block, content, onUpdate]);
  
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.block.content) === JSON.stringify(nextProps.block.content)
  );
});
```

### Database Schema

#### Core Tables Structure
```sql
-- WODs (Workout of the Day) - Main page entities
CREATE TABLE wods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50),
  estimated_duration INTEGER, -- in minutes
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks - Individual content blocks within WODs
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wod_id UUID REFERENCES wods(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- 'video', 'ai-agent', 'quiz', etc.
  content JSONB NOT NULL, -- Block-specific content and configuration
  position INTEGER NOT NULL, -- Order within the WOD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Block templates for reusable block collections
CREATE TABLE block_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  blocks JSONB NOT NULL, -- Array of block configurations
  thumbnail_url VARCHAR(500),
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs - Structured workout programs
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50),
  duration_weeks INTEGER,
  frequency_per_week INTEGER,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program structure - weeks and WOD assignments
CREATE TABLE program_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  wod_id UUID REFERENCES wods(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Content Repository Tables
```sql
-- Videos repository
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  duration INTEGER, -- in seconds
  file_size INTEGER, -- in bytes
  thumbnail_url VARCHAR(500),
  transcription TEXT,
  tags TEXT[], -- Array of tags
  organization_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Agents repository
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  personality TEXT NOT NULL,
  knowledge_base TEXT,
  capabilities TEXT[], -- Array of capabilities
  avatar_url VARCHAR(500),
  system_prompt TEXT NOT NULL,
  organization_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents repository
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- 'pdf', 'docx', 'txt', etc.
  file_size INTEGER,
  page_count INTEGER,
  thumbnail_url VARCHAR(500),
  tags TEXT[],
  organization_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Integration Points

#### WOD Management API
```typescript
// WOD API endpoints
interface WODsAPI {
  // Core CRUD operations
  createWOD(data: CreateWODRequest): Promise<WOD>;
  updateWOD(id: string, data: UpdateWODRequest): Promise<WOD>;
  deleteWOD(id: string): Promise<void>;
  getWOD(id: string): Promise<WOD>;
  listWODs(filters: WODFilters): Promise<WOD[]>;
  
  // Block management
  addBlock(wodId: string, block: BlockData): Promise<Block>;
  updateBlock(wodId: string, blockId: string, data: BlockData): Promise<Block>;
  deleteBlock(wodId: string, blockId: string): Promise<void>;
  reorderBlocks(wodId: string, blockIds: string[]): Promise<void>;
  
  // Publishing and status
  publishWOD(id: string): Promise<WOD>;
  unpublishWOD(id: string): Promise<WOD>;
  duplicateWOD(id: string): Promise<WOD>;
}
```

#### Repository API
```typescript
// Content repository API endpoints
interface RepositoryAPI {
  // Video repository
  getVideos(organizationId: string, filters?: VideoFilters): Promise<Video[]>;
  uploadVideo(file: File, metadata: VideoMetadata): Promise<Video>;
  updateVideo(id: string, metadata: VideoMetadata): Promise<Video>;
  deleteVideo(id: string): Promise<void>;
  getVideoSignedUrl(id: string): Promise<string>;
  
  // AI Agent repository
  getAIAgents(organizationId: string): Promise<AIAgent[]>;
  createAIAgent(data: CreateAIAgentRequest): Promise<AIAgent>;
  updateAIAgent(id: string, data: UpdateAIAgentRequest): Promise<AIAgent>;
  deleteAIAgent(id: string): Promise<void>;
  testAIAgent(id: string, message: string): Promise<string>;
  
  // Document repository
  getDocuments(organizationId: string, filters?: DocumentFilters): Promise<Document[]>;
  uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document>;
  getDocumentSignedUrl(id: string): Promise<string>;
  generateDocumentThumbnail(id: string): Promise<string>;
}
```

---

## 🐛 Critical Bug Prevention

### Known Issues and Solutions

#### Infinite Loop Prevention
Based on the detailed analysis from the emergency investigation, several critical patterns must be avoided:

**useEffect Dependency Stabilization:**
```typescript
// ❌ DANGEROUS - Can cause infinite loops
useEffect(() => {
  if (block.data.video) {
    loadVideoUrl();
  }
}, [block.data.video]); // loadVideoUrl not in dependencies

// ✅ SAFE - Stabilized dependencies
const loadVideoUrl = useCallback(async () => {
  if (!block.data.video) return;
  // async logic here
}, [block.data.video]);

useEffect(() => {
  loadVideoUrl();
}, [loadVideoUrl]);
```

**Object Reference Stabilization:**
```typescript
// ❌ DANGEROUS - Object recreated every render
const content = block.content || {};

// ✅ SAFE - Memoized object reference
const content = useMemo(() => block.content || {}, [block.content]);
```

**Async Operation Cleanup:**
```typescript
// ✅ SAFE - Proper async cleanup
useEffect(() => {
  let cancelled = false;
  
  const loadData = async () => {
    try {
      const result = await fetchData();
      if (!cancelled) {
        setData(result);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error.message);
      }
    }
  };
  
  loadData();
  
  return () => {
    cancelled = true;
  };
}, [dependencies]);
```

#### Block Format Consistency
Maintain single block format throughout application:
```typescript
// Standard block format
interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  position: number;
  metadata?: {
    created_at: Date;
    updated_at: Date;
    created_by: string;
  };
}
```

#### Error Boundary Implementation
```typescript
// Block-level error boundaries
class BlockErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Block Error:', error, errorInfo);
    // Send error to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="block-error-fallback">
          <p>This block encountered an error.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 🚀 Implementation Timeline

### Phase 5 Development Schedule

#### Week 1-2: Foundation (Days 1-14)
**Milestone**: Stable three-column layout with basic block system
- [ ] Three-column layout implementation
- [ ] Left navigation rail with block categories
- [ ] Basic block creation and selection system
- [ ] Right properties panel structure
- [ ] Save/load functionality

#### Week 3-4: Core Blocks (Days 15-28)
**Milestone**: All 12 block types implemented and functional
- [ ] Foundational blocks (Text, Header, Image, List, Quote, Divider)
- [ ] Content blocks (Video, Document, PDF) with repository integration
- [ ] Interactive blocks (AI Agent, Quiz, User Submission)
- [ ] Block property editors for all types

#### Week 5-6: Repository Integration (Days 29-42)
**Milestone**: Complete content repository browsing and management
- [ ] Video repository with upload and browsing
- [ ] AI Agent repository with testing interface
- [ ] Document repository with preview system
- [ ] Image repository with editing tools
- [ ] Repository search and filtering

#### Week 7-8: Advanced Features (Days 43-56)
**Milestone**: BLOCKS and PROGRAMS sections functional
- [ ] Block template creation and management
- [ ] Template library with categorization
- [ ] Program creation and structure management
- [ ] Program-WOD assignment system
- [ ] Program analytics dashboard

#### Week 9-10: Polish and Testing (Days 57-70)
**Milestone**: Production-ready Phase 5 system
- [ ] Comprehensive testing across all block types
- [ ] Performance optimization and bug fixes
- [ ] Responsive design validation
- [ ] Integration testing with existing system
- [ ] User acceptance testing and feedback incorporation

### Success Metrics

#### Functional Metrics
- [ ] All 12 block types create without errors
- [ ] Repository integration works for all content types
- [ ] Save/preview system functions reliably
- [ ] Responsive design works across all devices
- [ ] No infinite loops or critical bugs

#### Performance Metrics
- [ ] Page load time < 3 seconds
- [ ] Block creation time < 1 second
- [ ] Repository browsing responsive < 500ms
- [ ] Memory usage stable during extended editing
- [ ] 99.9% uptime during testing period

#### User Experience Metrics
- [ ] Intuitive workflow - users can create content without training
- [ ] Comprehensive functionality - supports all workout content types
- [ ] Reliable operation - no data loss or system crashes
- [ ] Consistent behavior - all blocks follow same interaction patterns

---

## 📚 Conclusion

This comprehensive functionality guide provides the complete blueprint for implementing Phase 5 of the AI Gym platform. It captures every detail from the three-column layout architecture to specific block implementations, repository integration patterns, and advanced management features.

**Key Implementation Principles:**
1. **User-Centric Design**: Every workflow optimizes for content creator efficiency
2. **Scalable Architecture**: System supports growth in content types and usage
3. **Performance-First**: All patterns prevent infinite loops and optimize rendering
4. **Consistent Experience**: Unified design language across all interactions
5. **Repository Integration**: Seamless content reuse and management

**Success Definition:**
Phase 5 is successful when content creators can build engaging, interactive workout pages using the drag-and-drop interface with comprehensive block types, repository integration, and advanced management features—all while maintaining the performance and reliability standards expected of a world-class platform.

This document serves as the definitive implementation guide to achieve that success without the need for multiple iterations or architectural changes.

---

**Document Version**: 1.0  
**Total Pages**: Comprehensive implementation blueprint  
**Implementation Ready**: ✅ Complete specifications provided  
**Next Step**: Begin Phase 5.1 - Foundation Setup