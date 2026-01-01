# Project Architecture (V2)

## 1. High-Level Overview
**"Deep Flow" Time Tracker** (v0.2.0) is a robust, offline-first Single Page Application (SPA).
The core philosophy is **"Trust the Log"**. Instead of relying on fragile counters, the application records every session segment as an immutable `TimeLog` entry.

---

## 2. Core Architecture: The Time Log Ledger

### 2.1 The Problem (Legacy V1)
In V1, "Time Spent" was a simple number on a Task object that incremented every second.
*   **Risk**: If the browser crashed during a session, all unsaved progress was lost.
*   **Limitation**: Impossible to know *when* work happened (e.g., "How much did I work on Monday?").

### 2.2 The Solution (Ledger V2)
In V2, we track time using a **Ledger Model**.
1.  **Atomic Logs**: Every time a user pauses, switches tasks, or stops, a `TimeLog` is written.
2.  **Source of Truth**: The `TimeLogRepository` stores these logs.
3.  **Derived State**: The UI displays `cachedTotalTime`, which is **aggregated on-demand** from the ledger history.

#### Data Entity: `TimeLog`
```typescript
interface TimeLog {
  id: string;
  taskId: string;
  startTime: string; // ISO Date
  duration: number;  // Seconds
  type: 'auto' | 'manual';
}
```

### 2.3 Data Flow
1.  **User Actions**: User clicks "Play" in `SessionContext`.
2.  **Active State**: `SessionContext` records the `startTimestamp`.
3.  **Flush Trigger**: User clicks "Pause" or switches tasks.
4.  **Log Creation**:
    *   `duration = Now - startTimestamp`
    *   `TimeLedgerService.saveLog({ duration, ... })`
5.  **UI Update**: `TimeLedgerService` notifies `TaskContext` to update the `cachedTotalTime` for the specific task.

---

## 3. Distributed State Management

The application avoids a monolithic store in favor of specialized **Context Domains**:

### 3.1 `SessionContext` (The Engine)
*   **Role**: Manages the "Active" session.
*   **Responsibility**:
    *   Tracks `activeTaskId`.
    *   Manages "Work vs Break" state.
    *   **Crucial:** Handles the *flushing* of logs to stable storage.

### 3.2 `TimeLedgerService` (The Vault)
*   **Role**: Specialized service for Log persistence.
*   **Mechanism**: **Memory-First Cache** with `localStorage` sync.
    *   Uses `window.addEventListener('storage')` to stay consistent across tabs.
    *   Atomic "Read-Modify-Write" pattern for data safety.

### 3.3 `LayoutContext` (The Frame)
*   **Role**: Manages the Responsive Shell (Header/Sidebar).
*   **Feature**: **Title Hoisting**. Pages render their own headers which are "teleported" to the global mobile navbar.

### 3.4 `TaskContext` (The Interface)
*   **Role**: CRUD for Tasks.
*   **Sync**: Listens to changes in the Ledger to keep task display times up-to-date.

### 3.5 `SoundContext` (The Audio Engine)
*   **Role**: Manages SFX and Ambience mixing.
*   **Mechanism**:
    *   **SFX Pool**: Preloaded map of Audio objects for low-latency feedback.
    *   **Ambience**: Single active channel with loop support.
    *   **Cloning**: Uses `cloneNode()` to allow overlapping logic (e.g., rapid click sounds).

### 3.4 `useGlobalTimer` (The Orchestrator)
*   **Role**: Manages the Dual-Timer System (Simple Stopwatch vs. Deep Focus).
*   **Mechanism**: Prevents race conditions by pausing one mode when the other starts.
    *   **Simple Timer**: Runs in `ActiveTimerContext` (Background-friendly).
    *   **Focus Session**: Runs in `FocusSessionContext` (Fullscreen, Pomodoro logic).

---

## 4. Storage Layer: Subcollection Pattern

Data is stored in `localStorage` but structured to mimic a NoSQL Database (granular collections) for future Cloud migration.

*   `items/tasks`: Map of Task objects.
*   `items/logs`: Array of `TimeLog` objects.
*   `items/app-state`: Settings and preferences.

**Storage Adapters**:
The system interacts with valid "Adapters" (`LocalStorageAdapter`), enabling us to swap the backend (e.g., to Firestore) without changing UI code.

---

## 5. UI Architecture

### 5.1 Z-Index Strategy ("The Semantic Scale")
To handle complex interactions, we enforce a strict, token-based Z-Index hierarchy in `tailwind.config.js`:
*   **z-toast (90)**: Critical Notifications.
*   **z-popover (80)**: Dropdowns, DatePickers.
*   **z-modal (70)**: Modals, Dialogs.
*   **z-overlay (60)**: Dark backdrops.
*   **z-fixed (40)**: Sticky Headers, Sidebars.
*   **z-10**: Content.

### Directory Structure
```
src/
├── assets/         # Static assets
├── components/     # Shared UI Building Blocks
├── config/         # App Config (ThemeRegistry)
├── constants/      # Global Constants
├── context/        # Global State
├── features/       # Feature Modules (Vertical Slices)
│   ├── analytics/
│   ├── auth/
│   ├── focus/
│   ├── playlists/
│   ├── settings/
│   ├── tasks/
│   └── theme/
├── hooks/          # Logic
├── lib/            # Library Configs
├── locales/        # i18n
├── services/       # Core Business Logic
│   ├── auth/
│   ├── migration/
│   └── storage/
├── types/          # TypeScript Interfaces
└── utils/          # Helpers
```
*   **Date Formatting**: Dynamic import of `date-fns` locales based on current language.

---

## 6. Synchronization & Auth Model ("Cloud-Optional")

The application operates in two distinct modes, handling data transitions seamlessly.

### 6.1 Guest Mode (Local-First)
*   **Default State**: Users start as "Guests".
*   **Storage**: All data (Logs, Preferences, Tasks) resides in `localStorage`.
*   **Privacy**: Zero network requests for data storage.

### 6.2 Authenticated Mode (Cloud Sync)
*   **Trigger**: User signs in via Google (Firebase Auth).
*   **Data Migration**:
    *   *Current Strategy*: **Server Wins** ("Scorched Earth").
    *   *Logic*: Upon login, if a cloud profile exists, it overwrites local preferences to ensure consistency across devices.
    *   *Future*: Intentional "Merge" strategy (Phase 2.5).

### 6.3 Real-Time Sync
1.  **Tab-to-Tab**:
    *   **Mechanism**: `window.addEventListener('storage')`.
    *   **Effect**: Changing a theme or stopping a timer in one tab updates all others instantly.
2.  **Device-to-Device**:
    *   **Mechanism**: `PreferencesService` (Firestore Snapshot Listeners).
    *   **Effect**: Changing "Dark Mode" on Mobile updates Desktop instantly.

---

## 7. Data Persistence & Portability

### 6.1 Backup Schema
The system supports full workspace export via a unified JSON schema:
```typescript
interface BackupData {
  version: number;
  date: string;
  tasks: Task[];
  activeTask?: string;
  categories: Category[];
  playlists: Playlist[];
  settings: AppSettings;
  logs: TimeLog[]; // The V2 Ledger
}
```

### 6.2 Restore Process
1.  **Validation**: Schema check ensures all required fields exist.
2.  **ID Sanitization**: (Optional) Remapping IDs to avoid collisions (currently replaces full state).
3.  **Hydration**: Restores all sub-collections in `localStorage` and reloads the application.

---

*Verified & Current as of Dec 2025*
