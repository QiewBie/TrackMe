# Project Architecture

## 1. High-Level Overview
Reflecting the state as of December 2025 (`v0.1.0`), the **"Deep Flow" Time Tracker** is a client-side Single Page Application (SPA) built with **React 18** and **Vite**.

It prioritizes:
1.  **Offline-First**: All data persists in `localStorage` (via `LocalStorageAdapter`).
2.  **Responsive Design**: Mobile-first approach using Tailwind CSS.
3.  **Performance**: Logic is split into specialized Contexts to minimize re-renders.

---

## 2. Technology Stack

### Core
*   **Framework**: React 18
*   **Build Tool**: Vite (Fast HMR & Bundling)
*   **Language**: TypeScript (Strict mode enabled)
*   **Styling**: Tailwind CSS + `tailwind-merge` + `clsx`
*   **Routing**: React Router DOM (v7)

### Key Libraries
*   **State**: Context API + `useReducer`
*   **Animations**: `framer-motion` (Layout transitions & micro-interactions)
*   **Drag & Drop**: `@dnd-kit` (Kanban/List reordering)
*   **Charts**: `recharts` (Velocity & Heatmaps)
*   **I18n**: `i18next` (English/Ukrainian)
*   **Rich Text**: `tiptap` (Headless wrapper around ProseMirror)
*   **Utils**: `date-fns` (Time manipulation), `canvas-confetti` (Celebrations)

---

## 3. Architecture Pattern: "Context Forest"

Unlike the outdated "Dashboard Controller" pattern, the application now uses a **Distributed State Architecture**. We avoid a single monolithic store to keep domains decoupled.

### The Provider Tree (`App.tsx`)
The application is wrapped in a specific order of Providers to handle dependencies:

1.  **`AuthProvider`**: User identity (User Name, Avatar). *Root level.*
2.  **`UIContext`**: Theme (Dark/Light), Sidebar & Mobile Menu toggle.
3.  **`SoundContext`**: Audio management (Ambience, Sound Effects).
4.  **`CategoryContext`**: Projects & Color definitions.
5.  **`TaskContext`**: Core CRUD for Tasks. *Depends on Auth.*
6.  **`PlaylistContext`**: Saved Task queues. *Depends on Tasks.*
7.  **`TimerContext`**: Global "Tick" mechanism (1s interval).
8.  **`SessionContext`**: Logic for Focus Sessions (Pomodoro state). *Depends on Timer.*

### Key Context Responsibilities

#### `TaskContext`
*   **Role**: Source of Truth for all Tasks.
*   **Method**: `tasks` array, `addTask`, `updateTask`, `deleteTask`.
*   **Sync**: Automatically writes to `localStorage` on change.

#### `TimerContext` vs `SessionContext`
*   **`TimerContext`**: The "Hardware Clock". It runs a `setInterval` and broadcasts a `tick` event. It does **not** know what a "task" is. It simply counts seconds.
*   **`SessionContext`**: The "Business Logic". It listens to ticks and manages:
    *   State: `idle` | `work` | `break`
    *   Duration: 25m / 5m logic.
    *   **Dependency Injection**: `FocusView` bridges `SessionContext` and `TakContext` so they don't depend on each other directly.

---

## 4. File Structure (`src/`)

The project follows a **Feature-First** directory structure within `components`, but keeps **State Logic** centralized in `context` and `hooks`.

```graphql
src/
├── components/
│   ├── analytics/       # Charts (Velocity, Heatmap)
│   ├── categories/      # Category Manager Modal
│   ├── layout/          # Sidebar, Shell, MobileNav
│   ├── playlists/       # Playlist Manager, Templates
│   ├── profile/         # DataManager (Import/Export)
│   ├── shared/          # Reusable Domain Components (AmbienceSelector)
│   ├── tasks/           # Task Entities (Input, Item, DetailsModal)
│   ├── ui/              # Dumb UI Primitives (Button, Modal, Input)
│   └── views/           # Page Controllers (FocusView, Dashboard, AnalyticsView)
├── context/             # React Context Definitions (State Containers)
├── hooks/               # Custom Hooks
│   ├── useDataPersistence.ts # LocalStorage Logic
│   ├── useFocusSession.ts    # Session Controller
│   └── useSound.ts           # Audio Hooks
├── locales/             # i18n JSON files (en/uk)
├── services/            # Pure JS Services
│   └── storage/         # LocalStorageAdapter
└── utils/               # Pure Functions (formatters, constants)
```

---

## 5. Data Flow & Persistence

### The "Adapter Pattern" for Storage
We utilize `src/services/storage/LocalStorageAdapter.ts`.
*   **Abstraction**: We do not call `localStorage.getItem` directly in components.
*   **Safety**: The adapter handles JSON parsing errors and `null` checks.
*   **Future Proofing**: This allows us to potentially swap `localStorage` for `IndexedDB` or a Cloud API by replacing just the adapter.

### Optimistic UI
*   **State First**: When a user creates a task, we update the React State *immediately*.
*   **Persist Later**: The `useEffect` hooks in Contexts monitor state changes and write to Storage asynchronously.

---

## 6. Key Design Decisions

### 6.1. Decoupled Timer Logic
We refactored `useTasks` to **remove** direct dependency on the Timer.
*   **Old**: `useTasks` tried to stop the timer when a task was completed. (Circular dependency).
*   **New**: `FocusView` acts as the orchestrator. It tells `TaskContext` to "complete task" AND tells `SessionContext` to "stop timer".

### 6.2. Component-Level CSS
We use **Tailwind Utility Classes** exclusively, adhering to a **Semantic Token System**.
*   **Styles**: No hardcoded hex values (e.g., `bg-blue-600`). Use `bg-brand-DEFAULT`, `text-brand-active`, `bg-bg-surface`.
    *   Tokens defined in `tailwind.config.js`.
    *   Content colors (Tags/Categories) defined in `src/utils/theme.ts`.
*   **Style Sharing**: Common patterns are extracted into `components/ui`.
*   **Animations**: Legacy CSS animations replaced/moved to Tailwind config.

## 7. Storage Architecture (New in v0.2)
We moved from "Monolithic Blob" to **Granular Subcollections**.
*   **Old**: `saveTasks(allTasks)` -> wrote entire array to one doc.
*   **New**: `storage.saveTask(task)` -> writes to `users/{uid}/tasks/{taskId}`.
*   **Benefit**: Scalable, conflict-free, and enables real-time listeners (Firestore).
*   **Adapters**: Both `FirestoreAdapter` and `LocalStorageAdapter` implement this granular interface.

### 6.3. Mobile Layout & Z-Index Strategy ("Layer Cake")

To address mobile layout challenges—specifically the interaction between the bottom navigation bar, the sidebar menu, sticky headers, and full-height views like `FocusView`—we employ a strict **Z-Index Hierarchy** and a **Margin-Based Layout** strategy.

#### The "Layer Cake" Hierarchy
We strictly define Z-index levels to ensure predictable interaction:

*   **z-[105] (Navigation Layer):** **BottomNav**.
    *   The bottom navigation sits *above* everything, including the Sidebar. This ensures floating action buttons (like Deep Flow) or active states are never clipped by the open menu.
    *   **Behavior**: Interacting with it explicitly closes the mobile menu via code.
*   **z-[100] (God Layer):** **Sidebar**.
    *   The mobile sidebar is the highest *panel* element.
*   **z-[90] (Curtain Layer):** **Backdrop**.
    *   The semi-transparent overlay that appears when the mobile menu is open.
    *   **Crucial**: It sits *above* the Header (`z-40`). This ensures that clicking the top header area (outside the sidebar) hits the backdrop and closes the menu.
*   **z-[50] (Modal Layer):** **Modals & Overlays**.
    *   Standard modals sit here.
*   **z-[40] (Interface Layer):** **Sticky Header**.
    *   The top header floats above content but yields to the menu/backdrop.
*   **z-[30] (Context Layer):** **FocusView Panels**.
    *   Side panels within views (e.g., Focus Context).
    *   **Constraint**: These panels must use `top-16` (Header height) and `bottom-16` (Nav height) on mobile to physically respect the sticky bars, rather than just layering over/under them.
*   **z-0 (Content Layer):** **Main View**.

#### Margin-Based Layout vs Spacers
To prevent content from being obscured by the `fixed` BottomNav on mobile:
*   **Do NOT use**: `pb-20` (padding) on the content container. This often fails in `h-full` views (like `FocusView`) or isn't respected by certain flex layouts.
*   **Do NOT use**: "Invisible Spacer Divs" at the bottom.
*   **USE**: `mb-16` (margin-bottom) on the **Scroll Container** itself.
    *   Matches the exact height of the Bottom Navbar (64px).
    *   This forces the browser to calculate the viewport height as ending *above* the navigation bar.
    *   This ensures `h-full` elements occupy exactly 100% of the *visible* space.

### 6.4. Mobile Experience Philosophy
We adhere to specific mobile-first UX patterns:
*   **Clean UI**: Mobile navigation is **icon-only**. Text labels are removed to reduce visual noise. Active states use bold strokes or distinct fills rather than color blobs.
*   **Handy UI**: Interactive elements in the Sidebar (Project List) use larger touch targets (height, padding) and font sizes on mobile compared to desktop.
*   **Space Efficiency**: Secondary navigation elements (Footer links) are hidden inside the Mobile Sidebar if they duplicate Bottom Nav functionality, maximizing space for the primary Project List.
