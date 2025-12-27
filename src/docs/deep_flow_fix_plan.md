# Deep Flow Repair Plan

**Objective:** Systemically resolve the 7 critical visual/functional failures AND the Deployment/Load-Time fragility identified in the Audit.

## 1. Top Menu & Sidebar Architecture
*   **Problem:** Missing Right Toggle, unsymmetrical layout.
*   **Fix:**
    *   Implement standardized, symmetrical `SidebarToggle` buttons for both Left and Right.
    *   Remove `lg:hidden` from the Right toggle to allow manual control on Desktop.
    *   Ensure both specific sidebars (Left Nav, Right Context) respond to these toggles correctly.

## 2. Layout & Positioning
*   **Problem:** Ambience selector in wrong group, confusing icons.
*   **Fix:**
    *   Move `AmbienceSelector` to the **Top Left** group (next to Zen Toggle).
    *   Group `Settings` and `ContextToggle` in the **Top Right**.
    *   Replace generic `<Layout>` icon for Playlist Badge with a more distinct `<ListMusic>` or similar from Lucide.

## 3. Empty State & Initialization (Critical)
*   **Problem:** Screen is empty/broken on load; no default timer state.
*   **Fix:**
    *   **Ghost Timer:** Refactor `TimerDisplay` to handle `null` activeTask. It should display `00:00` or the default configured duration (e.g. `25:00`) in a "Ghost" state.
    *   **Loading Skeleton:** If Contexts are loading, show a subtle pulse skeleton instead of `AnimatePresence` unmounting everything.
    *   **Empty Queue Warning:** If no task is selected, show a clear, centered Call-to-Action: "Select a Task or Playlist to Begin".

## 4. Settings Integration
*   **Problem:** Modal disrupts flow; should be in Context Panel.
*   **Fix:**
    *   Move the Timer Duration controls (25/45/60) **into the Context Panel** (Right Sidebar).
    *   Remove the floating Settings Modal entirely.
    *   The "Settings" gear icon in the top right will now toggle the Context Panel (focusing on the settings section).

## 5. Session Complete Performance & Style
*   **Problem:** Low FPS, B&W confetti, ugly buttons.
*   **Fix:**
    *   **Reduce Blur:** Switch from `backdrop-blur-2xl` to `backdrop-blur-md` or `lg` max. Use a solid opacity gradient `bg-black/90` to compensate.
    *   **Confetti Logic:** Force a vibrant fallback palette if `ambientColor` is Slate/Grey.
    *   **Standard Tokens:** Use the `<Button variant="primary">` component instead of `<button className="...">`.

## 6. Design System Alignment
*   **Problem:** Hardcoded values (`text-[18vw]`, `w-[120%]`).
*   **Fix:**
    *   Replace arbitrary values with Tailwind standard classes where possible, or define specific `focus-` tokens if needed for the "Volumetric" text.
    *   Ensure all overlays use `z-index` tokens consistent with the rest of the app.

## 7. Deployment Resilience (New)
*   **Problem:** App unmounts/flickers on lazy load; crashes on error.
*   **Fix:**
    *   **FocusErrorBoundary:** Wrap `FocusView` content in a local Error Boundary. If it crashes, show a "Reload Session" button instead of white screen.
    *   **Hydration Guard:** Add a defined `isLoading` check for `TaskContext`. If `tasks === undefined`, show the designated Skeleton Loader, NOT the "Empty State".
    *   **Chunk Pre-fetch:** (Optional) Add `import(...)` prefetch trigger on hover of the "Deep Flow" button in sidebar to reduce network delay.

## Execution Order
1.  **Refactor Structure:** Fix Top Bar & Sidebar Toggles.
2.  **Stabilize Core:** Implement the "Ghost Timer" / Loading State / Error Boundary.
3.  **Migrate Features:** Move Settings to Sidebar.
4.  **Polish Visuals:** Update Session Complete screen and Confetti logic.
## 8. Focus View Refactor (Systemic Hardcode Fix)
*   **Objective**: Remove magic numbers/hex values and split monolithic component.
*   **Constants**: Define `SIDEBAR_WIDTH` (400px), `TRANSITION_TIMING`.
*   **Components**:
    *   `src/components/views/focus/FocusSidebar.tsx`: Encapsulate Settings/Details logic.
    *   `src/components/views/focus/FocusTopBar.tsx`: Encapsulate Navigation/Ambience.
    *   `src/components/views/focus/FocusStage.tsx`: Encapsulate Timer/Title/Animations.
*   **Tokens**: Replace `FOCUS_COLORS` hexes with `tailwindcss/colors` or CSS variable references. Replace `z-[60]` with named z-index tokens if available.
