# **Chapter 7: The "Programs" Calendar System \- Orchestrating the Learning Journey**

**Note:** This document has been updated to use 'community' terminology (previously 'community') to reflect current platform architecture.


**Objective:** The purpose of this chapter is to provide a comprehensive, human-readable specification for the system that allows administrators to orchestrate long-term learning engagements. This moves beyond the creation of individual "Missions" and "Courses" into the strategic scheduling of these experiences over weeks and months. This is the "Program" layer, the highest level of organization on the platform. It is the master syllabus for an entire community engagement. The design philosophy is built on three pillars: **Foresight**, **Flexibility**, and **Focus**. The tools must provide the administrator with the foresight to plan an entire program, the flexibility to adapt to changing circumstances, and provide the end-user with a clear focus on what they need to accomplish *today*.

### **Part 1: The Core Philosophy \- From Lessons to Journeys**

A collection of lessons, no matter how engaging, does not constitute a program. A true program has a narrative arc, a deliberate pace, and a clear timeline. It guides a learner from a starting point to a destination over a defined period. The "Programs" system is the tool we will build to enable this strategic orchestration.

* **The "University Course Catalog & Syllabus" Analogy:** To understand the hierarchy, let's expand our previous analogies.  
  * **Products (Agents, Videos) are the "Lego Bricks."**  
  * **Missions & Courses are the "Lego Sets"**—a complete, self-contained model built from those bricks.  
  * **A "Program" is the University Course Catalog and its detailed Syllabus.** It doesn't contain the textbook content itself; instead, it answers the high-level questions: Which courses do I need to take this semester? In what order? What is the topic for Week 1? What is the assignment for Monday, October 27th? It provides the structure, the timeline, and the map for the entire educational journey.  
* **The Strategic Importance of Scheduling:** The ability to visually map out an entire multi-week or multi-month program on a calendar is a powerful strategic tool. It allows the AI Workify team to:  
  * **Plan Resource Allocation:** Understand what content needs to be created and when.  
  * **Manage Community Expectations:** Provide communities with a clear, visual roadmap of the entire engagement.  
  * **Pace the Learning:** Deliberately design the intensity of the program, scheduling lighter "review" days and more intensive "project" days.  
  * **Adapt in Real-Time:** Easily adjust the schedule to accommodate holidays, community feedback, or unforeseen events by simply dragging and dropping missions to new dates.

THERE MUST BE THE POSSIBILITY OF ALSO SETTING THE COURSE WITHOUT A CALENDAR. I imagine that people can come to the gym and start a program, not being part of of a fixed schedule. Te look and feel of a daily mission would be the same, but just without being fixed on dates. Perhaps a simple settings called “fixed dates” when building a program would just be enough for this functionality.

This system elevates the administrator from a content creator to a true Program Director.

### **Part 2: The Administrator Experience \- The Program Repository**

Like all other core content types, Programs are managed from a central repository, ensuring a consistent and familiar administrative experience.

* **2.1. Navigation and The Repository View:**  
  * **Access:** The administrator navigates to this section by selecting "Management \> Programs" from the main header navigation dropdown. This brings them to the "Programs Repository."  
  * **Interface:** This page uses the same unified interface as all other repositories. A `+ Create New Program` button is located in the header. The main view is a switchable Card/List display of all existing programs.  
  * **Card View:** Each card will display the Program's `Title`, its `Short Description`, and visually indicate which communities it has been assigned to with a stack of small community logos.  
  * **List View:** The table will have sortable columns for `Program Title`, `Assigned Communitys`, `Duration` (e.g., "8 Weeks"), and `Date Created`. Each row will have an `Edit` button that leads to the Program Builder.  
* **2.2. The Program Creation Process:**  
  * **Initial Modal:** Clicking `+ Create New Program` opens a simple modal window. This is for capturing the most basic information before entering the main builder.  
  * **Fields:** The modal will require a `Program Title` (e.g., "dLocal Q4 AI Transformation Program") and an optional `Short Description`.  
  * **Entry to the Builder:** Upon clicking `Create`, the modal closes, and the administrator is immediately taken to the full-screen "Program Builder" interface for this new, empty program.

### **Part 3: The Administrator Experience \- The Program Builder Interface**

This is the strategic command center for designing a long-term learning journey. It is a dedicated, multi-panel interface designed for visual planning and scheduling.

* **3.1. The Three-Panel Layout \- A Comprehensive Workspace:**  
  * The Program Builder is a full-screen experience composed of three distinct, interacting panels.  
  * **Left Panel \- The Content Palette (20% width):** This is the library of "unscheduled" content that can be placed onto the calendar.  
  * **Center Panel \- The Calendar (60% width):** This is the main workspace, a large, interactive calendar for visual scheduling.  
  * **Right Panel \- The Manual Index Builder (20% width):** This is where the administrator crafts the human-readable table of contents for the program.  
* **3.2. Deep Dive: The Left Panel \- The Content Palette:**  
  * **Purpose:** This panel's sole purpose is to provide the administrator with a readily accessible, searchable list of all the "Missions," "Courses," and other content "products" that can be scheduled.  
  * **UI/UX:**  
    * **Search Bar:** At the top of the panel is a "Search for content..." input field. As the admin types, the list below filters in real-time.  
    * **Content Type Filter:** Below the search bar are filter tabs or buttons (e.g., `All`, `Missions`, `Courses`, `Videos`). This allows the admin to quickly narrow the list to find the specific type of content they need.  
    * **The Content List:** The rest of the panel is a scrollable list of content items. Each item is represented by a small, "draggable" card showing its icon and title.  
  * **Drag-and-Drop Interaction:** The core mechanic is drag-and-drop. The administrator can click and hold any item in this list, drag it across the screen, and drop it onto a day in the center calendar panel. When an item is being dragged, it should become semi-transparent, and a small visual representation of it should follow the mouse cursor.  
* **3.3. Deep Dive: The Center Panel \- The Interactive Calendar:**  
  * **Purpose:** This is the visual heart of the builder, where time and content intersect.  
  * **UI/UX:**  
    * **Views:** The calendar header will have controls to switch between a `Month` view (for high-level planning) and a `Week` view (for detailed scheduling). The `Week` view will display Monday to Friday by default, with an option to show weekends.  
    * **Navigation:** Clear `Previous` and `Next` arrow buttons will allow the admin to navigate through months or weeks. A `Today` button will instantly jump the calendar back to the current date.  
    * **The Calendar Grid:** The calendar is a grid of cells. Each cell represents a day. The cell for "today" will have a distinct visual highlight (e.g., a colored border or background).  
    * **Scheduling Content (The Drop Zone):** As the admin drags a content item from the Left Panel over the calendar, the day cells will react. When the cursor hovers over a valid day cell, that cell will highlight with a different color (e.g., a light blue background), indicating it is a valid "drop zone."  
    * **The Drop Action:** When the admin releases the mouse over a highlighted day, the content item is "scheduled." A small, colored "pill" representing the mission will appear inside that day's cell, displaying the mission's title. This action is automatically saved in the background, with a subtle "Saved" confirmation appearing briefly.  
    * **Managing Scheduled Items:** An admin can schedule multiple items on a single day. The pills will stack vertically within the day's cell.  
      * **Rescheduling:** The admin can simply click and drag an existing scheduled item from one day and drop it onto another.  
      * **Editing/Removing:** Clicking on a scheduled item "pill" on the calendar will open a small popover menu with two options: `Go to Editor` (which opens the Mission/Course builder for that item in a new tab) and `Unschedule` (which removes the item from the calendar and places it back in the unscheduled Content Palette).  
    * **Handling Holidays:** The system can be enhanced with a feature to mark certain dates as "Bank Holidays." Dropping a mission on such a date would trigger a small confirmation pop-up: "This date is marked as a holiday. Are you sure you want to schedule this mission?"  
* **3.4. Deep Dive: The Right Panel \- The Manual Index Builder:**  
  * **Purpose:** An automatically generated index can be rigid. This tool gives the administrator the creative freedom to craft a human-friendly, narrative table of contents for their program.  
  * **UI/UX:**  
    * **The Index List:** The panel displays the index as an ordered list.  
    * **Adding Entries:** A `+ Add Index Entry` button at the bottom allows the admin to add a new item to the list.  
    * **Editing Entries:** Each entry in the list is a text field that can be edited directly. Next to each entry are a set of small control icons:  
      * `Indent/Outdent Arrows`: To create a visual hierarchy of headings and subheadings.  
      * `Link Icon`: This is the key interactive element. Clicking it opens a small popover.  
      * `Drag Handle`: To manually reorder entries in the list.  
    * **The Linking Workflow:**  
      * When the admin clicks the `Link` icon, the popover gives them two choices: `Link to Week` or `Link to Day`.  
      * **`Link to Week`:** Selecting this opens a mini-calendar view. The admin simply clicks on any day within the desired week (e.g., Wednesday). The system is smart enough to know this means the entire week (Monday to Friday). The link is created.  
      * **`Link to Day`:** Selecting this opens the same mini-calendar, but the admin's click selects only that specific day.  
    * **Visual Feedback:** Once an entry is linked, its text becomes a blue hyperlink, and the link icon changes color to indicate a successful link.

### **Part 4: The End-User Experience \- Navigating the Learning Journey**

The end user's view of a Program must be clear, motivating, and focused. It should answer the question, "What do I need to do right now?" while still providing context for the entire journey.

* **4.1. The Program Landing Page:**  
  * **Access:** When a user is assigned to a program, it will appear on their main dashboard. Clicking it takes them to the Program Landing Page.  
  * **Layout:** The page is designed for clarity and orientation.  
    * **Header:** Displays the `Program Title` and `Description`.  
    * **Left Sidebar \- The Program Index:** The left sidebar is now populated with the clickable, hierarchical index that the administrator manually created. This is their map for the entire journey.  
    * **Main Content Area:** This area is dominated by the **Program Calendar**.  
* **4.2. The User's Calendar View:**  
  * **Visuals:** The user sees the same calendar grid as the admin, but with a simplified, read-only interface.  
    * **Highlighting "Today":** The current day is strongly highlighted.  
    * **Past and Future:** Past days are slightly greyed out, providing a sense of progress. Future days are visible but not highlighted.  
    * **Scheduled Items:** The "pills" for scheduled missions are visible on their respective days.  
  * **Interaction:** Clicking on any day in the calendar will cause the "Today's Mission" view (described below) to update and show the content for that selected day.  
* **4.3. The "Today's Mission" View \- The Focus Zone:**  
  * **Purpose:** To prevent overwhelm, users need a clear focus. Below the main calendar, there is a dedicated section titled **"Today's Mission"** (or if they've selected a different day, "Mission for \[Date\]").  
  * **Content:** This section is not just a link. It directly renders the full, interactive "Page" of the Mission scheduled for that day. The user can watch the videos, talk to the embedded agents, and complete the assignments right there in that focused view, without ever leaving the Program page. This creates a seamless and contained learning experience.  
* **4.4. The Integrated Navigation Experience:**  
  * The components of this page are fully interconnected.  
  * **Clicking the Index:** If a user clicks on an index entry in the left sidebar that is linked to "Week 3," the main calendar will smoothly scroll to show Week 3, and the "Mission" view below will update to show the content for the Monday of that week.  
  * **Clicking the Calendar:** If the user clicks on a future day in the calendar, the "Mission" view updates to show them a preview of what's coming up.  
  * This integrated design allows the user to easily switch between a high-level overview (the index and calendar) and a detailed, focused task view (the "Today's Mission" section) at will.