# **Chapter 6: The Page Builder Engine & "Missions”and “Courses" Repositories**

**Objective:** The purpose of this chapter is to provide a comprehensive, human-readable specification for the system that allows administrators to compose rich, interactive learning experiences. This moves beyond creating simple, atomic "products" and into the realm of crafting dynamic "experiences." This chapter details the core **Page Builder** technology—a universal, block-based content editor—and its primary application: the creation of **Missions** and **Courses**. The design philosophy is built on three pillars: **Flexibility**, **Engagement**, and **Intuition**. The tools must be flexible enough to create any kind of lesson, the end result must be deeply engaging for the learner, and the creation process must feel intuitive and empowering for the administrator.

### **Part 1: The Core Philosophy \- From "Products" to "Experiences"**

To create a world-class learning platform, we must recognize that modern learning is not about consuming a static list of documents and videos. It is about progressing through a guided, multi-faceted experience. This requires a fundamental shift in our content creation model.

* **The "Lego Bricks vs. The Lego Set" Analogy:** In the previous chapter, we meticulously designed the system for creating our fundamental "Lego bricks"—the individual Agents, Videos, Prompts, and Documents. They are standardized, high-quality, and self-contained. Now, in this chapter, we build the "instruction manual" and the framework that allows an administrator to assemble these individual bricks into a magnificent, coherent "Lego set," like the Millennium Falcon or Hogwarts Castle. A "Mission" or a "Course" is not just a collection of bricks; it is a carefully designed experience, a guided journey that tells a story and leads to a specific outcome.  
* **Introducing the "Page" as a Universal Canvas:** The core innovation that enables this is the concept of a "Page." A Mission is a Page. A Course is a collection of Pages. Even a "Document" from our previous chapter can be elevated from a simple text file to a rich Page. This "Page" is a blank canvas, and the administrator is the artist. The tools we provide for painting on this canvas are called "Blocks." This block-based paradigm, popularized by platforms like Notion, is the key to providing maximum flexibility while maintaining a simple, intuitive interface. The administrator no longer has to think in terms of rigid forms with predefined fields; they can now think like a true content creator, adding, arranging, and composing different types of content blocks to build the perfect lesson.

### **Part 2: The Unified "Page Builder" Engine \- The Universal Tool**

The Page Builder is the single, powerful engine that drives the creation of all rich content. It is a technology, not just a feature, that will be deployed in multiple places across the Admin Panel. Understanding its mechanics is essential.

* **The Block-Based Paradigm:** The fundamental principle is that every piece of content on a Page is a self-contained "block." A paragraph of text is a block. An image is a block. An embedded video is a block. A quiz is a block. The administrator builds a page by simply adding, configuring, and arranging these blocks in a single, vertical column.  
* **The Universal "Add Block" Interaction:**  
  * **UI/UX:** When an administrator is editing a Page, they will see a clean, minimalist interface. As they hover their mouse between existing blocks or at the bottom of the page, a subtle horizontal line will appear with a `+` (plus) icon in the center.  
  * **The Block Library Popover:** Clicking this `+` icon does not immediately add a block. Instead, it opens a small, contextual popover menu. This menu is a searchable "Block Library," presenting all the available block types the admin can insert at that location. The library will be organized with icons and short descriptions for each block (e.g., "Text," "Image," "Embed Video," "Quiz"). The admin can either click on a block from the list or start typing to search for it (e.g., typing "vid" would filter the list to show the "Embed Video" block).  
  * **Insertion:** Clicking on a block type in the library instantly closes the popover and inserts a new, empty block of that type onto the page, ready for configuration. This entire interaction is designed to be fluid, fast, and discoverable, encouraging experimentation.  
* **Universal Block Management:**  
  * **The "Grip" Handle:** Every block on the page, when hovered over, will reveal a "grip" handle (an icon of six dots) on its left side. This handle serves two purposes:  
    1. **Reordering:** The administrator can click and hold this handle to drag the block up or down the page. As they drag, a clear blue horizontal line will indicate where the block will be dropped when they release the mouse. This provides an intuitive, visual way to reorder content.  
    2. **The Block Menu:** Clicking the grip handle (without dragging) will open a small context menu next to the block. This menu provides actions that can be performed on that specific block, such as `Duplicate` (which creates an identical copy of the block immediately below), `Copy link to this block` (for deep linking), and `Delete` (which removes the block, with a one-step "Undo" option appearing briefly at the bottom of the screen).

This universal engine ensures that once an admin learns how to add and manage one type of block, they know how to manage them all.

### **Part 3: The Block Library \- The Palette of Possibilities**

This is the exhaustive list of all the "Lego bricks" an administrator can use to build their learning experiences. Each block is designed with both admin configuration and the end-user experience in mind.

* **3.1. Foundational Blocks (The Basics):**  
  * **`Section Header` Block:**  
    * **Purpose:** To create clear, structural divisions within a long page and to automatically generate the page's navigation index.  
    * **Admin UI:** A simple, large text input field. The admin can choose from different heading levels (Heading 1, Heading 2, Heading 3\) from a small dropdown that appears when text is selected.  
    * **End-User View:** Renders as a large, bold heading.  
  * **`Rich Text` Block:**  
    * **Purpose:** The workhorse for all written content, from simple paragraphs to detailed explanations.  
    * **Admin UI:** A full-featured, inline WYSIWYG editor. When the admin selects text, a floating toolbar appears with options for **Bold**, *Italic*, `Code`, Hyperlinks, and text color.  
    * **End-User View:** Renders as clean, formatted text.  
  * **`Image` Block:**  
    * **Purpose:** To visually enhance content with images, diagrams, or illustrations.  
    * **Admin UI:** An upload component that allows dragging-and-dropping an image file or browsing the computer. Once uploaded, a preview is shown. The admin can add a caption and alt-text for accessibility. They can also choose an alignment (left, center, right).  
    * **End-User View:** Renders the image with its caption below. Clicking the image opens it in a full-screen lightbox for detailed viewing.  
  * **`Bulleted/Numbered List` Block:**  
    * **Purpose:** For creating clean, easy-to-read lists.  
    * **Admin UI:** A simple, intuitive list editor. Hitting "Enter" creates a new list item. Hitting "Tab" indents the item to create a sub-list.  
    * **End-User View:** Renders as a standard HTML list.  
  * **`Quote` Block:**  
    * **Purpose:** To draw attention to a key quote or important piece of text.  
    * **Admin UI:** A text input field with a distinct style (e.g., a vertical line to the left).  
    * **End-User View:** Renders as an indented block of text with a large quotation mark or a colored border.  
  * **`Divider` Block:**  
    * **Purpose:** To create a clean visual separation between different sections of content.  
    * **Admin UI:** Simply inserts the block. There are no configuration options.  
    * **End-User View:** Renders as a subtle, full-width horizontal line.  
* **3.2. Embedded Content Blocks (Connecting the Library):**  
  * **`Embed Video` Block:**  
    * **Purpose:** To embed a video from the central Video Repository.  
    * **Admin UI:** When added, the block is an empty placeholder with a large `Browse Video Repository` button. Clicking it opens a modal window displaying the Video Repository interface (with its search and filter tools). The admin finds and selects a video.  
    * **End-User View:** Renders the video in an embedded player directly on the page. The video's title and description are displayed below it.  
  * **`Embed Agent` Block:**  
    * **Purpose:** To embed an interactive AI Agent directly into a lesson.  
    * **Admin UI:** Identical to the video block; the admin browses the Agent Repository and selects an agent.  
    * **End-User View:** Renders a full, interactive chat window directly on the page. The user can have a complete conversation with the agent without leaving the lesson.  
  * **`Embed Prompt` Block:**  
    * **Purpose:** To display a prompt from the Prompt Repository for users to copy and use.  
    * **Admin UI:** The admin browses the Prompt Repository and selects a prompt.  
    * **End-User View:** Renders the prompt text inside a styled code block with a one-click `Copy Prompt` button.  
  * **`Embed Document` Block:**  
    * **Purpose:** To display the content of a rich-text Document from the Document Repository.  
    * **Admin UI:** The admin browses the Document Repository and selects a document.  
    * **End-User View:** Renders the full content of the selected document directly on the page.  
  * **`Embed Automation` Block:**  
    * **Purpose:** To link to an automation from the Automation Repository.  
    * **Admin UI:** The admin browses the Automation Repository and selects an automation.  
    * **End-User View:** Renders as a rich preview card showing the automation's thumbnail, title, description, and a prominent `Open Automation` button that links to the target URL in a new tab.  
* **3.3. Interactive & Pedagogical Blocks (Inspired by Best-in-Class Platforms):**  
  * **`User Submission` Block:**  
    * **Purpose:** The core tool for assignments and assessments.  
    * **Admin UI:** The admin first writes instructions in a rich-text editor. Then, they use a dropdown to select the required submission format: `Text Input Box` (with an optional word count limit) or `File Upload` (with the ability to specify allowed file types, e.g., .pdf, .png).  
    * **End-User View:** Displays the instructions, followed by either a text area or a file uploader component. A `Submit` button sends their work to the Submissions Review hub.  
  * **`Accordion / Toggle` Block:**  
    * **Purpose:** To hide supplementary or optional content, keeping the main page clean. Ideal for FAQs, glossaries, or "deep dive" information.  
    * **Admin UI:** The admin provides a `Title` (the visible part) and then adds content inside the expandable area using a mini-version of the page builder itself, allowing for nested text, images, etc.  
    * **End-User View:** Renders the title with a chevron icon. Clicking the title smoothly expands the block to reveal the hidden content.  
  * **`Quiz` Block:**  
    * **Purpose:** For knowledge checks and simple assessments.  
    * **Admin UI:** The admin first adds a question. Then, they can add multiple answer options. They can select the correct answer(s) using a checkbox or radio button. They can also write custom feedback for both correct and incorrect answers. The admin can add multiple questions to a single Quiz block.  
    * **End-User View:** Renders the question and answer options. After the user submits their answer, the block provides immediate feedback, showing them the correct answer and any custom feedback the admin provided.  
  * **`Embed Forum Post` Block:**  
    * **Purpose:** To bring valuable community discussions directly into a lesson.  
    * **Admin UI:** The admin clicks a `Browse Forum` button, which opens a modal allowing them to search for and select a specific post or an entire thread.  
    * **End-User View:** Renders a rich preview of the forum post or thread, including the author's name, avatar, and content. A button allows the user to jump directly to that discussion in the main Forum section.

### **Part 4: The "Missions”and  “Courses" Repository \- The Admin's Creation Space**

This is two separate dedicated repository but practically are the same, just generating different “Products” with different ids that are used for different purposes when building “Programs” and other types of content. Ca mission, for example, can refer to a course embedded. Where the Page Builder engine is used to create the primary learning experiences.

* **4.1. The Repository View:**  
  * This repository in both cases is accessible via Missions or Courses in the menu.  It uses the same unified interface (Card View, List View, Filter Sidebar). An admin can create a new "Mission" or a new "Course." For the system, these are technically the same `content_item_type`, but separating them in the UI provides organizational clarity for the admin.  
* **4.2. The Course or Mission Builder UI:**  
  * **The Two-Panel Workspace:** When an admin creates or edits a Mission/Course, they enter the dedicated builder. This is a powerful, two-panel interface designed for composing complex learning paths.  
    * **Left Panel (Dynamic Outline & Index):** This panel is the structural heart of the lesson. It displays the page's outline as a nested list.  
      * **How it Works:** Every time the admin adds a `Section Header` block to the main page on the right, a corresponding entry is automatically created in this left-panel outline. A "Heading 1" creates a top-level item, while "Heading 2" creates a nested sub-item. This creates a dynamic, real-time Table of Contents.  
      * **Admin Interaction:** The admin can click on any item in the outline to instantly scroll the right-side editor to that specific block. They can also drag-and-drop items within the outline to reorder entire sections of the page at once.  
    * **Right Panel (The Page Canvas):** This is the main workspace. It is the Page Builder interface described in Part 2, where the admin adds and arranges all the content blocks (`Rich Text`, `Embed Video`, `Quiz`, etc.) that make up the lesson.

### **Part 5: The End-User Learning Experience \- The "Scrollable Story"**

The ultimate goal of this entire chapter is to create a stunning and effective learning experience for the end user.

* **5.1. The Engaging, Mobile-First UI:**  
  * The user-facing view of a Mission or Course will be clean, spacious, and content-forward. The design will be fully responsive, providing an excellent experience on any device, from a large desktop monitor to a mobile phone. The goal is to make the learning experience feel like an engaging, "scrollable story," not a dry, academic document.  
* **5.2. The Contextual Navigation:**  
  * When a user views a Mission or Course, the left sidebar (which is used for filters in the admin view) transforms into the **Contextual Navigation Index**.  
  * **How it Works:** This sidebar displays the same dynamic Table of Contents that was generated by the `Section Header` blocks. It allows the user to see the entire structure of the lesson at a glance and to jump to any section with a single click.  
  * **Progress Indication:** As the user scrolls down the page, the corresponding section in the left-side index will automatically highlight, so they always know where they are in the lesson.  
  * **Last Position Memory:** The system will automatically save the user's scroll position on the page. When they leave and come back to the lesson later, they will be gently prompted with a small banner: "Welcome back\! Continue from where you left off?" Clicking it will smoothly scroll them back to their last position.  
* **5.3. The "Practiced" Check System \- A Universal Progress Tracker:**  
  * **The UI Element:** Every single block on a page—every paragraph, every video, every quiz—will have a small, circular checkbox next to it. This is the "Practiced" check.  
  * **User Interaction:** When a user feels they have understood or completed the task associated with a block, they click the checkbox. The checkmark animates in with a satisfying effect, and the entire block might subtly fade its opacity to visually indicate completion. This provides a granular sense of progress and accomplishment.  
  * **Persistence:** This is the most powerful aspect. The state of this check (whether it's checked or not) is saved *specifically for that user and that block*. This means if the same `Embed Video` block is used in three different Missions, once the user checks it as "Practiced" in one place, it will appear as already checked in the other two places. A tooltip on the checkmark will say "You practiced this on \[Date\]." This respects the user's time and provides a seamless, intelligent experience across the entire platform. It prevents them from having to re-watch or re-do content they have already mastered, a common frustration in less sophisticated learning systems.