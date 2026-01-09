# Project Structure

This document outlines the file structure of the application, which follows a **Feature-Based Architecture**.

## Overview

The `src/` directory is organized into distinct features, shared components, and global logic.

```
src/
├── assets/              # Static assets (Images, Global CSS)
├── components/          # Shared UI components (Atomic Design)
│   ├── layout/          # Global layout (Sidebar, BottomNav, Page)
│   ├── shared/          # Reusable business-agnostic widgets
│   ├── ui/              # Dumb UI primitives (Button, Input, Modal)
│   └── categories/      # Category management UI
│
├── config/              # App Configuration (ThemeRegistry, Firebase)
├── constants/           # Global Constants (Magic Numbers, Defaults)
├── context/             # Global Context Providers (State)
├── features/            # Feature-Specific Modules (Vertical Slices)
│   ├── analytics/       # Analytics Charts & View
│   ├── auth/            # Authentication, Profile, DataManager
│   ├── categories/      # Category Logic
│   ├── focus/           # Focus Session Engine, Timer, Views
│   ├── playlists/       # Playlist Management, Editors
│   ├── settings/        # App Settings
│   ├── tasks/           # Task List, Item, Details
│   └── theme/           # Color Systems
│
├── hooks/               # Custom React Hooks
├── lib/                 # External Library Configs (Firebase, etc.)
├── locales/             # i18n Translation Files
├── services/            # Core Services
│   ├── auth/            # Auth Service
│   ├── migration/       # Data Migration logic
│   ├── preferences/     # User Preferences Sync
│   ├── storage/         # LocalStorage Adapter, Firestore Adapter, TimeLedger
│   └── time/            # TimeService (Server Time Sync)
│
├── test/                # Test Utilities
├── types/               # TypeScript Definitions
└── utils/               # Helper Functions (Pure)
```

---

## Detailed Breakdown

### 1. Features (`src/features/*`)
Each folder in `features` represents a distinct domain of the application. Ideally, a feature folder contains:
-   `components/`: Sub-components specific to this feature.
-   `*View.tsx`: The main page/view entry point (e.g., `FocusView.tsx`).
-   `types.ts`: Feature-specific TypeScript interfaces.

#### 1.1 Focus (`src/features/focus`)
The core timer experience.
-   `FocusView.tsx`: The main fullscreen timer interface.
-   `types.ts`: Session interface definition.
-   `components/`: `FocusTimerDisplay`, `SessionControls`, `FocusSidebar`, `AmbienceSelector`.

#### 1.2 Tasks (`src/features/tasks`)
Task management functionality.
-   `TaskListView.tsx`: The main dashboard list.
-   `types.ts`: Task, SubTask, ProjectNote interfaces.
-   `components/`: `TaskItem`, `TaskInput`, `TaskDetailsModal`.

#### 1.3 Analytics (`src/features/analytics`)
Time tracking insights.
-   `AnalyticsView.tsx`: Charts and metrics dashboard.
-   `types.ts`: TimeLog interface.
-   `components/`: `ActivityHeatmap`, `VelocityChart`, `DistributionChart`.

#### 1.4 Playlists (`src/features/playlists`)
Grouped task flows.
-   `PlaylistManager.tsx`: The CRUD view for playlists.
-   `components/`: `PlaylistCard`, `CreatePlaylistModal`.

#### 1.5 Auth (`src/features/auth`)
User context and settings.
-   `LoginView.tsx`, `ProfileView.tsx`.
-   `components/DataManager.tsx`: Import/Export logic.

#### 1.6 Settings (`src/features/settings`)
Application-wide preferences.
-   `components/ThemeCard.tsx`: Theme previewer.

#### 1.7 Theme (`src/features/theme`)
Color system definitions.
-   `colors.ts`: Semantic color palettes.

---

### 2. Components (`src/components/*`)
Shared building blocks used *across* features.
-   `ui/`: Buttons, Inputs, Modals, Typography. (Zero dependencies on features).
-   `shared/`: Complex widgets like `DateRangePicker`, `ConfirmationModal`, `RichTextEditor`.
-   `layout/`: `Sidebar`, `BottomNav`, `Page`.
-   `Dashboard.tsx`: Main entry view for the application.
-   `TaskOrchestrator.tsx`: Task-context-aware wrapper component.

---

### 3. Context (`src/context/*`)
Global state that connects features.

| File | Purpose |
|:-----|:--------|
| `FocusSessionContext.tsx` | The "engine" of the Pomodoro timer. Split into Dispatch/State/Tick. |
| `ActiveTimerContext.tsx` | Simple stopwatch timer for dashboard with versioned sync. |
| `TaskContext.tsx` | CRUD for tasks (wraps useTasks). |
| `AuthContext.tsx` | Firebase authentication state. |
| `ThemeContext.tsx` | Dynamic theme injection to `:root`. |
| `UIContext.tsx` | Sidebar toggle, Zen Mode. |
| `SoundContext.tsx` | SFX pool and ambience mixing. |
| `StorageContext.tsx` | Storage adapter provider (LocalStorage/Firestore). |
| `PlaylistContext.tsx` | Playlist state management. |
| `CategoryContext.tsx` | Category CRUD. |
| `LayoutContext.tsx` | Responsive shell, title hoisting, mobile detection. |

---

### 4. Hooks (`src/hooks/*`)
Custom React hooks for reusable logic.

| Hook | Purpose |
|:-----|:--------|
| `useTasks` | Task CRUD with TimeLedger integration and cloud sync. |
| `useFocusSession` | Focus session UI logic (work/break states). |
| `useFocusViewController` | Focus view route resolution and derived state. |
| `useGlobalTimer` | Orchestrator between Focus and Simple timers. |
| `useSessionSync` | Cloud synchronization for active sessions. |
| `useDataSync` | General data synchronization utilities. |
| `useCategories` | Category CRUD operations. |
| `usePlaylists` | Playlist management. |
| `useDataPersistence` | Full JSON export/import for backups. |
| `useLocalStorage` | Generic localStorage wrapper. |
| `useThemeColor` | Access current theme colors. |
| `useDynamicFavicon` | Update favicon based on task state. |
| `useHaptic` | Haptic feedback for mobile. |
| `useConfirmation` | Confirmation dialog state. |
| `useClickOutside` | Detect clicks outside element. |
| `useFloatingPosition` | Dropdown positioning logic. |
| `useFocusHotkeys` | Keyboard shortcuts for focus view. |
| `useKeyboardShortcuts` | Global keyboard shortcuts. |

---

### 5. Services (`src/services/*`)
Core business logic, isolated from React.

#### 5.1 Storage (`src/services/storage/`)
| File | Purpose |
|:-----|:--------|
| `LocalStorageAdapter.ts` | localStorage wrapper with JSON handling. |
| `FirestoreAdapter.ts` | Full Firestore integration with subscriptions. |
| `TimeLedger.ts` | Hybrid TimeLog persistence with pending queue. |
| `storage.ts` | IStorageAdapter interface definition. |
| `sessionStorage.ts` | Session-level storage utilities. |

#### 5.2 Time (`src/services/time/`)
| File | Purpose |
|:-----|:--------|
| `TimeService.ts` | Server time synchronization singleton. |
| `TimeServiceConfig.ts` | Centralized time constants (thresholds, TTLs, quotas). |

#### 5.3 Migration (`src/services/migration/`)
| File | Purpose |
|:-----|:--------|
| `FinalMigration.ts` | Legacy timeSpent → TimeLogs migration. |
| `migrationService.ts` | Generic migration utilities. |

#### 5.4 Preferences (`src/services/preferences/`)
| File | Purpose |
|:-----|:--------|
| `PreferencesService.ts` | User preferences cloud sync. |

---

### 6. Types (`src/types/*`)
Centralized TypeScript definitions.

| File | Exports |
|:-----|:--------|
| `models.ts` | Re-exports from all features. |
| `index.ts` | Main type export. |

Key interfaces are defined in their respective feature directories:
-   `features/tasks/types.ts`: Task, SubTask, ProjectNote
-   `features/focus/types.ts`: Session
-   `features/analytics/types.ts`: TimeLog
-   `features/categories/types.ts`: Category
-   `features/playlists/types.ts`: Playlist
-   `features/auth/types.ts`: UserSettings, User

---

### 7. Utils (`src/utils/*`)
Pure helper functions with no side effects.

| File | Purpose |
|:-----|:--------|
| `formatters.ts` | `formatTime()`, `formatDuration()`, `formatDate()` |
| `dateHelpers.ts` | Date manipulation utilities |
| `theme.ts` | `getThemeColor()` for CSS variable access |
| `cn.ts` | Tailwind class name merging |
| `storage.ts` | localStorage utilities |
| `haptic.ts` | Haptic feedback triggers |

---

### 8. Tests

Test files are co-located with their source files in `__tests__` directories:

```
src/
├── context/__tests__/
│   └── FocusSessionBehavior.test.tsx
├── hooks/__tests__/
│   ├── useFocusSession.test.ts
│   ├── useTasks.test.tsx
│   └── useConfirmation.test.ts
├── utils/__tests__/
│   ├── dateHelpers.test.ts
│   └── formatters.test.ts
└── features/theme/__tests__/
    └── ThemeIntegrity.test.ts
```

---

*Last Updated: Jan 2026*
