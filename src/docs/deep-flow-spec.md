# Deep Flow (FocusView) Specification
> **Note:** This document represents the state of the Deep Flow interface as restored from memory on 2025-12-27. It serves as the "source of truth" for the current implementation's logic and aesthetics.

## 1. Core Concept & Visual Foundation
**Deep Flow** is a distraction-free, full-screen (`100dvh`) mode designed to maximize user focus.

-   **Layering:** It renders *over* the main application layout (`absolute inset-0 z-50`).
-   **Ambient Background:**
    -   A dark, immersive base (`bg-bg-main`).
    -   **Dynamic Ambiance:** Large, slow-pulsing radial gradients in the background. Their color is **not hardcoded** but derived dynamically from the *Active Task's Project Category*.
    -   *Example:* If working on a "Health" project (green), the background glows with subtle emerald hues. If "Code" (blue), it glows blue.

## 2. Component Hierarchy & Layout

### A. The "Zen" Top Bar (Auto-Hiding)
Located at the very top (`absolute top-0 w-full`).
-   **Behavior:** Completely invisible (`opacity-0`) when the timer is running to prevent eye wandering. Re-appears on hover.
-   **Components:**
    -   **Left:** `Zen Mode` toggle (hides/shows the sidebar).
    -   **Right:**
        -   `AmbienceSelector`: Dropdown for soundscapes.
        -   `Settings`: Gear icon opening the Session Duration modal (25/45/60 min).
        -   `PanelRight`: Toggle for the Context Panel (Queue/Subtasks).

### B. The Main Stage (Center Screen)
The focal point of the interface. Visually centered vertically and horizontally.

1.  **Timer Display (The Anchor)**
    -   **Typography:** Massive, heavy sans-serif digits.
    -   **Style:** "Volumetric" aesthetic—uses a vertical gradient (`bg-clip-text`) on the digits to give them metallic/3D depth.
    -   **Status Pill:** Located immediately below the digits.
        -   *Running:* Bordered (`border-brand/20`), glowing text (`text-brand`), subtle shadow.
        -   *Paused:* Grey, flat, recessed (`bg-white/5`, `text-slate-400`).

2.  **Task Meta-Data (Below Timer)**
    -   **Task Title:** Large `h2`, centered, usually white/light-grey.
    -   **Project Badge:** A rounded capsule below the title.
        -   *Style:* Soft grey background (`bg-bg-surface`). **Crucially:** No harsh white border.
        -   *Indicator:* A colored dot corresponding to the project color (supports full palette: violet, rose, sky, etc.), enhanced with a colored shadow glow.
    -   **Playlist Badge:** (Optional) If active via playlist, a small tag with an icon appears next to the project badge.

### C. The Player (Controls)
A floating island located at the bottom center (`absolute bottom-12`).
-   **Visuals:** High border-radius (pill/rounded rectangle), `backdrop-blur` or solid surface color, deep drop-shadow (`shadow-2xl`) to separate it from the background.
-   **Buttons:**
    1.  **Check (Complete):** Left. Hovering turns it green. Triggers confetti.
    2.  **Play/Pause:** Center. The largest button. Brand color (`bg-blue-600` or similar). Transitions between "Play" triangle and "Pause" bars.
    3.  **Skip (Next):** Right. "Fast forward" icon. Disabled if no tasks remain in the queue.

### D. The Context Panel (Right Sidebar)
A collapsible panel sliding in from the right (`fixed right-0`).
-   **Content:**
    1.  **Active Task Subtasks:** Independent checkboxes.
    2.  **The Queue:** A draggable (`Reorder.Group`) list of upcoming tasks.
        -   *Safety:* Renders defensively (checks for null categories) to prevent crashes.

## 3. Logical Flows

### Session Initialization
-   **Entry:** Checks URL `id`. If missing, auto-selects the first `isRunning` or incomplete task.
-   **Queue Source:** 
    -   *Global:* All incomplete tasks.
    -   *Playlist:* Only tasks from the selected playlist.

### Completion Flow
1.  User clicks **Complete**.
2.  **Visual Feedback:** Confetti explosion from the button.
3.  **Data Update:** Task marked `completed: true`.
4.  **Auto-Advance (The "Next" Logic):**
    -   System scans the *current queue* for the next incomplete index.
    -   **Circular Logic:** If at the bottom, wraps around to the top.
    -   If a task is found -> Focus switches to it immediately.
    -   If NO tasks found -> Transitions to "All Done" celebration screen.

### Skip Flow
-   Similar to Completion but DOES NOT mark the task as done.
-   Simply moves the `currentIndex` pointer to the next incomplete slot.

## 4. Specific Visual Details (From recent polish)
-   **Gradient Text:** The timer digits are NOT plain white. They use a gradient texture.
-   **Soft Borders:** We explicitly removed `border-white/10` from badges to avoid a "wireframe" look.
-   **Brand Colors:** The primary accent is a specific shade of Blue (`brand-primary`), but the interface adapts (via the background) to the Project Color.

---
*End of Memory Spec*
