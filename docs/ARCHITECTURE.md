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
3.  **Derived State**: The UI displays `cachedTotalTime`, which is aggregates from the logs.

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
    *   `TimeLogRepository.saveLog({ duration, ... })`
5.  **UI Update**: `TimeLogRepository` notifies `TaskContext` to update the `cachedTotalTime` for the specific task.

---

## 3. Distributed State Management

The application avoids a monolithic store in favor of specialized **Context Domains**:

### 3.1 `SessionContext` (The Engine)
*   **Role**: Manages the "Active" session.
*   **Responsibility**:
    *   Tracks `activeTaskId`.
    *   Manages "Work vs Break" state.
    *   **Crucial:** Handles the *flushing* of logs to stable storage.

### 3.2 `TimeLogRepository` (The Vault)
*   **Role**: Specialized service for Log persistence.
*   **Mechanism**: Uses a Read-Modify-Write pattern with `localStorage` to ensure atomic saves, even across multiple tabs (via `storage` event syncing).

### 3.3 `TaskContext` (The Interface)
*   **Role**: CRUD for Tasks.
*   **Sync**: Listens to changes in the Repository to keep task display times up-to-date.

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

### 5.1 Z-Index Strategy ("The Layer Cake")
To handle complex interactions (Fullscreen Focus Mode, Mobile Sidebars), we enforce a strict Z-Index hierarchy:
*   **z-[200]**: `FocusView` (Fullscreen Overlay)
*   **z-[100]**: Mobile Sidebar
*   **z-[50]**: Modals
*   **z-[40]**: Sticky Headers
*   **z-0**: Content

### 5.2 Component Design
*   **Atoms**: `Button`, `Input` (Dumb, styled components).
*   **Widgets**: `TimerDisplay`, `SessionControls` (Logic-aware).
*   **Views**: `Dashboard`, `FocusView` (Page Controllers).

### 5.3 Internationalization (i18n)
*   **Library**: `react-i18next`.
*   **Strategy**: Static JSON resources loaded at build time.
*   **Keys**: Nested structure (e.g., `focus.controls.start`) for maintainability.
*   **Date Formatting**: Dynamic import of `date-fns` locales based on current language.

---

## 6. Data Persistence & Portability

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
