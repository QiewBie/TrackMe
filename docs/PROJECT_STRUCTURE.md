# Project Structure

This document outlines the file structure of the application, which follows a **Feature-Based Architecture**.

## Overview

The `src/` directory is organized into distinct features, shared components, and global logic.

```
src/
├── assets/              # Static assets (Images, Global CSS)
├── components/          # Shared UI components (Atomic Design)
│   ├── layout/          # Global layout (Sidebar, etc.)
│   ├── shared/          # Reusable business-agnostic widgets
│   ├── ui/              # Dumb UI primitives (Button, Input)
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
│   └── storage/         # LocalStorage Adapter & Repository
│
├── test/                # Test Utilities
├── types/               # TypeScript Definitions
└── utils/               # Helper Functions (Pure)
```

## Detailed Breakdown

### 1. Features (`src/features/*`)
Each folder in `features` represents a distinct domain of the application. Ideally, a feature folder contains:
-   `components/`: Sub-components specific to this feature.
-   `*View.tsx`: The main page/view entry point (e.g., `FocusView.tsx`).

#### 1.1 Focus (`src/features/focus`)
The core timer experience.
-   `FocusView.tsx`: The main fullscreen timer interface.
-   `components/`: `FocusTimerDisplay`, `SessionControls`, `FocusSidebar`.

#### 1.2 Tasks (`src/features/tasks`)
Task management functionality.
-   `TaskListView.tsx`: The main dashboard list.
-   `components/`: `TaskItem`, `TaskInput`, `TaskDetailsModal`.

#### 1.3 Playlists (`src/features/playlists`)
Grouped task flows.
-   `PlaylistManager.tsx`: The CRUD view for playlists.
-   `components/`: `PlaylistCard`, `CreatePlaylistModal`.

#### 1.4 Auth (`src/features/auth`)
User context and settings.
-   `LoginView.tsx`, `ProfileView.tsx`.
-   `components/DataManager.tsx`: Import/Export logic.

#### 1.5 Settings (`src/features/settings`)
Application-wide preferences.
-   `components/ThemeCard.tsx`: Theme previewer.

#### 1.6 Theme (`src/features/theme`)
Color system definitions.
-   `colors.ts`: Semantic color palettes.

### 2. Components (`src/components/*`)
Shared building blocks used *across* features.
-   `ui/`: Buttons, Inputs, Modals, Typography. (Zero dependencies on features).
-   `shared/`: Complex widgets like `DateRangePicker`, `ConfirmationModal`.
-   `layout/`: `Sidebar`, `BottomNav`.
-   `Dashboard.tsx`: Main entry view for the application.

### 3. Context (`src/context/*`)
Global state that connects features.
-   `FocusSessionContext`: The "engine" of the timer.
-   `TaskContext`: CRUD for tasks.
-   `UIContext`: Visual state (sidebar toggle, theme).

---

*Last Updated: Dec 2025*
