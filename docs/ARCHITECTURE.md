# Project Architecture (V2)

## 1. High-Level Overview
**"Deep Flow" Time Tracker** (v0.2.1) is a robust, offline-first Single Page Application (SPA).
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
2.  **Source of Truth**: The `TimeLedgerService` stores these logs.
3.  **Derived State**: The UI displays `cachedTotalTime`, which is **aggregated on-demand** from the ledger history.

#### Data Entity: `TimeLog`
```typescript
interface TimeLog {
  id: string;
  taskId: string;
  userId?: string;        // For cloud filtering
  startTime: string;      // ISO Date
  endTime?: string;       // ISO Date (optional)
  duration: number;       // Seconds
  type: 'auto' | 'manual' | 'migration';
  note?: string;          // Optional context (e.g., "Session Paused")
}
```

#### Data Entity: `Session`
```typescript
interface Session {
  id: string;
  taskId: string;
  startTime: string;      // ISO String
  endTime?: string;       // ISO String (undefined = active)
  duration: number;       // Seconds (calculated on completion)
  remainingTime?: number; // Snapshot for pauses/resumes
  status?: 'active' | 'paused' | 'completed';
  config?: {
    mode: 'focus' | 'break';
    duration: number;     // Minutes
  };
  lastUpdated: string;    // ISO String (Mandatory for sync anchor)
  playlistId?: string | null;
  queue?: string[];       // Synced Queue Context
}
```

### 2.3 Data Flow
1.  **User Actions**: User clicks "Play" in `FocusSessionContext`.
2.  **Active State**: `FocusSessionContext` records the `startTime` and sets `lastUpdated`.
3.  **Flush Trigger**: User clicks "Pause" or switches tasks.
4.  **Log Creation**:
    *   `duration = remainingTime(at start) - remainingTime(now)`
    *   `TimeLedger.saveLog({ duration, ... })`
5.  **UI Update**: `TimeLedger.subscribe()` notifies `useTasks` to update `cachedTotalTime`.

---

## 3. Time Synchronization System

### 3.1 The Problem
In multi-device scenarios, local clocks can drift from server time, causing:
*   Inaccurate session durations
*   Race conditions in "Last-Write-Wins" conflict resolution
*   Stale data overwriting fresh updates

### 3.2 TimeService (The Clock)
**Location**: `src/services/time/TimeService.ts`

A singleton service responsible for maintaining **trusted time** across the application.

```typescript
class TimeService {
  private clockOffset = 0;      // Milliseconds difference from server
  private isSynced = false;
  
  // Core API
  getTrustedTime(): number;     // Returns Date.now() + offset
  getTrustedISO(): string;      // ISO string from trusted time
  isReady(): boolean;           // True if sync completed
  
  // Sync Methods
  initialize(userId): Promise;  // Probe-based initial sync
  updateOffset(serverTime);     // Piggyback updates
}
```

### 3.3 Synchronization Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                        TimeService                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PROBE SYNC (App Init - Costs 1 Write)                       │
│     ├── Write: serverTimestamp() to users/{id}/system/time_probe│
│     ├── Read: Retrieve written timestamp                        │
│     ├── Calculate: offset = serverTime + latency/2 - localTime  │
│     └── Store: clockOffset = offset                             │
│                                                                 │
│  2. PIGGYBACK SYNC (Every Firestore Read - Free)                │
│     ├── FirestoreAdapter receives snapshot                      │
│     ├── Extract: snapshot.readTime                              │
│     ├── Call: timeService.updateOffset(readTime)                │
│     └── Adjust offset if drift > 500ms                          │
│                                                                 │
│  3. GUEST MODE                                                  │
│     └── Skip all sync, isSynced = true (synced with itself)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Usage Pattern
```typescript
// ALL timestamp operations should use TimeService
import { timeService } from '../services/time/TimeService';

// Getting current time
const now = timeService.getTrustedTime();

// Creating ISO timestamps for database
const timestamp = timeService.getTrustedISO();

// DON'T: Date.now() or new Date().toISOString()
```

### 3.5 TimeServiceConfig (The Constants)
**Location**: `src/services/time/TimeServiceConfig.ts`

Centralized configuration for all time-related constants across the application.

| Constant | Value | Purpose |
|:---------|:------|:--------|
| `MAX_OFFSET_MS` | 1 hour | Maximum allowed clock offset |
| `JITTER_THRESHOLD_MS` | 500ms | Minimum drift to trigger update |
| `ZOMBIE_THRESHOLD_MS` | 24 hours | Auto-purge stale sessions |
| `SUSPENDED_SESSION_TTL_MS` | 7 days | TTL for suspended sessions |
| `LOG_RETENTION_MS` | 90 days | Local log cleanup threshold |
| `MAX_STORAGE_BYTES` | 4MB | localStorage quota limit |
| `CLOUD_LOG_LIMIT_DAYS` | 30 days | Cloud subscription window |

---

## 4. Distributed State Management

The application avoids a monolithic store in favor of specialized **Context Domains**.

### 4.1 FocusSessionContext (The Engine)
**Location**: `src/context/FocusSessionContext.tsx`

Manages the "Active" session (Pomodoro Timer).

#### Split Context Pattern (Performance Optimization)
To prevent 1Hz timer updates from causing global re-renders:

```
┌────────────────────────────────────────────────────────────┐
│                  FocusSessionProvider                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ FocusDispatchContext│  │  FocusStateContext  │          │
│  │   (Stable Actions)  │  │  (Structural State) │          │
│  ├─────────────────────┤  ├─────────────────────┤          │
│  │ • startSession      │  │ • activeSession     │          │
│  │ • pauseSession      │  │ • isPaused          │          │
│  │ • resumeSession     │  │ • suspendedSessions │          │
│  │ • stopSession       │  │ • sessionQueue      │          │
│  │ • switchTask        │  │ • sessionConfig     │          │
│  │ • setPlaylistContext│  │ • activePlaylistId  │          │
│  │ • updateQueue       │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FocusTickContext (1Hz)                 │   │
│  │                   timeLeft: number                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Why?** Components that only display the timer (TimerDisplay) subscribe to `FocusTickContext`. Components that trigger actions (SessionControls) subscribe to `FocusDispatchContext`. This prevents action-dispatch components from re-rendering every second.

#### Drift Prevention Logic (Phase 16)
To ensure timer accuracy even when the browser tab is backgrounded:

```typescript
// Instead of counting down every second:
// BAD: setTimeLeft(prev => prev - 1);

// We calculate exact remaining time:
const localTargetTimeRef = useRef<number | null>(null);

// On resume/start:
localTargetTimeRef.current = timeService.getTrustedTime() + (timeLeft * 1000);

// On every tick:
const diff = localTargetTimeRef.current - timeService.getTrustedTime();
const next = Math.max(0, Math.ceil(diff / 1000));
setTimeLeft(next);
```

#### Suspended Sessions
When switching tasks mid-session, the previous session is "suspended" rather than lost:

```typescript
const [suspendedSessions, setSuspendedSessions] = 
  useState<Record<taskId, Session>>({});
```

This allows users to resume a task with its remaining time intact.

### 4.2 ActiveTimerContext (The Stopwatch)
**Location**: `src/context/ActiveTimerContext.tsx`

Manages the "Simple Timer" (Dashboard stopwatch mode) with robust cloud synchronization.

*   **No Countdown**: Tracks elapsed time from `startTime` to now.
*   **Trusted Time**: Uses `timeService.getTrustedTime()` for all calculations.
*   **Versioned Sync**: Integrates with `VersionManager` for conflict-free multi-device sync.
*   **Lockout Mechanism**: 300ms lockout after local actions prevents UI flash.
*   **Optimistic Updates**: UI updates immediately, cloud sync in background.
*   **Rollback Support**: Failed cloud writes restore previous state.

### 4.3 useGlobalTimer (The Orchestrator)
**Location**: `src/hooks/useGlobalTimer.ts`

A "Traffic Cop" that prevents race conditions between the two timer systems.

```typescript
export type TimerSource = 'dashboard' | 'focus';

const startTimer = (taskId: string, source: TimerSource) => {
  if (source === 'dashboard') {
    // Kill Focus if running, then start Simple
    if (focusSession) pauseFocusSession();
    startSimpleTimer(taskId);
  } else if (source === 'focus') {
    // Kill Simple (saves log!), then start Focus
    if (simpleTimer) stopSimpleTimer();
    startFocusSession(taskId);
  }
};
```

**Key Invariant**: Only ONE timer type can be active at any time.

### 4.4 TimeLedgerService (The Vault)
**Location**: `src/services/storage/TimeLedger.ts`

Specialized service for TimeLog persistence with **hybrid storage**.

#### Storage Strategy
```
┌────────────────────────────────────────────────────────────┐
│                      saveLog(log)                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. LOCAL WRITE (Instant)                                  │
│     └── localStorage.setItem(STORAGE_KEY, [...logs, log]) │
│                                                            │
│  2. PENDING QUEUE (Safety Net)                             │
│     └── localStorage.setItem(PENDING_KEY, [...pending,log])│
│                                                            │
│  3. CLOUD WRITE (Async)                                    │
│     ├── Success: removeFromPending(log.id)                 │
│     └── Failure: Log stays in pending for retry            │
│                                                            │
│  On App Init:                                              │
│     └── processPendingQueue() retries all pending uploads  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### Features
*   **Idempotent Writes**: Duplicate detection by ID
*   **Tab Sync**: `window.addEventListener('storage')` for cross-tab updates
*   **Cost Protection**: Cloud subscription limited to 30 days of logs
*   **Legacy Migration**: Auto-uploads pre-existing local logs on first cloud sync
*   **Guest Guard**: Skips all cloud operations for guest users

### 4.5 Other Contexts

| Context | Location | Purpose |
|:--------|:---------|:--------|
| **LayoutContext** | `context/LayoutContext.tsx` | Responsive Shell, Title Hoisting |
| **TaskContext** | `context/TaskContext.tsx` | Task CRUD (wrapper for useTasks) |
| **SoundContext** | `context/SoundContext.tsx` | SFX Pool + Ambience mixing |
| **ThemeContext** | `context/ThemeContext.tsx` | Dynamic theme injection |
| **PlaylistContext** | `context/PlaylistContext.tsx` | Playlist management |
| **StorageContext** | `context/StorageContext.tsx` | Storage adapter provider |
| **AuthContext** | `context/AuthContext.tsx` | User authentication state |
| **UIContext** | `context/UIContext.tsx` | Sidebar, Zen Mode toggles |

---

## 5. Storage Layer

### 5.1 Adapter Pattern
The system uses an **Adapter Pattern** for storage, enabling seamless switching between backends.

```typescript
interface IStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  getServerTime(): number;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
}
```

#### Implementations
*   **LocalStorageAdapter**: Default. Wraps `window.localStorage` with JSON handling.
*   **FirestoreAdapter**: Cloud mode. Full Firestore integration with subscriptions.

### 5.2 Subcollection Pattern
Data is structured to mimic a NoSQL Database:

```
users/{userId}/
├── data/
│   ├── preferences       (UserSettings)
│   ├── active_session    (Session | null)
│   └── simple_timer_state
├── tasks/
│   └── {taskId}          (Task document)
├── categories/
│   └── {categoryId}      (Category document)
├── playlists/
│   └── {playlistId}      (Playlist document)
├── time_logs/
│   └── {logId}           (TimeLog document)
└── system/
    └── time_probe        (For TimeService sync)
```

---

## 6. Synchronization & Auth Model ("Cloud-Optional")

### 6.1 Guest Mode (Local-First)
*   **Default State**: Users start as "Guests".
*   **Storage**: All data resides in `localStorage`.
*   **Privacy**: Zero network requests for data storage.
*   **Guard Pattern**: All services check for `userId === 'guest'` before cloud operations.

### 6.2 Authenticated Mode (Cloud Sync)
*   **Trigger**: User signs in via Google (Firebase Auth).
*   **TimeService Init**: Performs probe sync on login.
*   **TimeLedger Init**: Subscribes to cloud logs, processes pending queue.

### 6.3 Real-Time Sync

#### Tab-to-Tab
*   **Mechanism**: `window.addEventListener('storage')`
*   **Effect**: Theme changes, timer stops sync across tabs.

#### Device-to-Device
*   **Mechanism**: Firestore `onSnapshot` listeners
*   **Components**:
    *   `subscribeToTasks` - Task list changes
    *   `subscribeToTimeLogs` - Time log updates
    *   `subscribeToActiveSession` - Focus session state
    *   `subscribeToUserPreferences` - Settings sync

### 6.4 Versioned Sync System (v4.1)

The application uses a sophisticated **Version-Based Conflict Resolution** system to handle multi-device synchronization.

#### VersionManager Service
**Location**: `src/services/sync/VersionManager.ts`

A singleton service that manages operation queues, conflict detection, and version tracking.

```typescript
interface VersionMeta {
  _version: number;      // Incrementing document version
  _updatedAt: string;    // ISO timestamp from TimeService
  _deviceId: string;     // Unique device identifier
}

class VersionManager {
  // Queue Management
  enqueue(key: string, type: 'write' | 'delete'): Promise<void>;
  
  // Version Control
  getVersionMeta(key: string): VersionMeta;  // Calls prepareWrite internally
  confirmWrite(key: string): void;
  confirmDelete(key: string): void;
  abortPending(key: string): void;
  
  // Conflict Detection
  shouldApplyRemote(key, remoteVersion, remoteUpdatedAt, remoteDeviceId): {
    apply: boolean;
    reason: string;
    isConflict?: boolean;
  };
  shouldApplyRemoteNull(key: string): { apply: boolean; reason: string };
  
  // Cleanup
  resetAll(): void;  // Called on logout
}
```

#### Conflict Resolution Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   Remote Update Received                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOCKOUT CHECK (300ms)                                        │
│     └── If local action < 300ms ago → REJECT (prevents flash)   │
│                                                                  │
│  2. NULL CHECK                                                   │
│     └── If startTime is null → REJECT (pending serverTimestamp) │
│                                                                  │
│  3. VERSION COMPARISON                                           │
│     ├── remote > local → ACCEPT (newer version)                 │
│     ├── remote < local → REJECT (stale)                         │
│     └── remote == local:                                        │
│         ├── Same device? → ACCEPT (own write confirmed)         │
│         └── Diff device? → Compare timestamps                   │
│                                                                  │
│  4. TIMESTAMP TIE-BREAKER                                       │
│     └── If same version, different device:                      │
│         └── remoteUpdatedAt > localUpdatedAt → ACCEPT           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Remote Update Lockout
To prevent UI flash when Firestore echoes back local writes:

```typescript
// ActiveTimerContext
const localActionTimeRef = useRef(0);
const REMOTE_LOCKOUT_MS = 300;

// On start/stop:
localActionTimeRef.current = Date.now();

// In subscription callback:
if (Date.now() - localActionTimeRef.current < REMOTE_LOCKOUT_MS) {
  return;  // Ignore remote updates during lockout
}
```

#### Pending Write Protection
```typescript
// When serverTimestamp() hasn't resolved yet:
const remoteStartTime = normalizeTimestamp(remoteState?.startTime);
if (remoteStartTime === 0) {
  return;  // Reject null startTime (pending write)
}
```


---

## 7. Data Persistence & Portability

### 7.1 Backup Schema
```typescript
interface BackupData {
  version: number;
  date: string;
  tasks: Task[];
  activeTask?: string;
  categories: Category[];
  playlists: Playlist[];
  settings: AppSettings;
  logs: TimeLog[];
}
```

### 7.2 Restore Process
1.  **Validation**: Schema check ensures all required fields exist.
2.  **ID Sanitization**: (Optional) Remapping IDs to avoid collisions.
3.  **Hydration**: Restores all sub-collections and reloads.

---

## 8. UI Architecture

### 8.1 Z-Index Strategy ("The Semantic Scale")
Defined in `tailwind.config.js`:

| Token | Value | Purpose |
|:------|:------|:--------|
| `z-toast` | 120 | Critical Notifications |
| `z-popover` | 110 | Dropdowns, DatePickers |
| `z-modal` | 100 | Modals, Dialogs |
| `z-overlay` | 60 | Dark backdrops |
| `z-fixed` | 40 | Sticky Headers, Sidebars |
| `z-[10-30]` | 10-30 | Content Internal Stacking |

### 8.2 Animation System (New)
**Location**: `src/constants/animations.ts`

Standardized constants for consistent motion:

```typescript
export const ANIMATION_DURATION = {
    FAST: 0.2,   // Micro-interactions (drops, modals)
    MEDIUM: 0.3, // Page transitions, standard elements
    SLOW: 0.5,   // Complex layout shifts
    ENTER: 0.4   // Entrance animations
};
```

### 8.3 Directory Structure
```
src/
├── assets/         # Static assets
├── components/     # Shared UI Building Blocks
├── config/         # App Config (ThemeRegistry)
├── constants/      # Global Constants
├── context/        # Global State Providers
│   ├── ActiveTimerContext.tsx
│   ├── AuthContext.tsx
│   ├── FocusSessionContext.tsx
│   ├── PlaylistContext.tsx
│   ├── SoundContext.tsx
│   ├── StorageContext.tsx
│   ├── ThemeContext.tsx
│   └── UIContext.tsx
├── features/       # Feature Modules (Vertical Slices)
│   ├── analytics/
│   ├── auth/
│   ├── focus/
│   ├── playlists/
│   ├── settings/
│   ├── tasks/
│   └── theme/
├── hooks/          # Custom Hooks
│   ├── useFocusSession.ts
│   ├── useFocusViewController.ts
│   ├── useGlobalTimer.ts
│   ├── useSessionSync.ts
│   └── useTasks.ts
├── lib/            # Library Configs
├── locales/        # i18n
├── services/       # Core Business Logic
│   ├── auth/
│   ├── migration/
│   ├── preferences/
│   ├── storage/
│   │   ├── FirestoreAdapter.ts
│   │   ├── LocalStorageAdapter.ts
│   │   └── TimeLedger.ts
│   └── time/
│       └── TimeService.ts
├── types/          # TypeScript Interfaces
└── utils/          # Helpers
```

---

## 9. Performance & Mobile Optimization

### 9.1 Re-render Optimization
*   **Split Contexts**: Tick/Dispatch/State separation prevents cascade re-renders.
*   **useCallback/useMemo**: All context actions are memoized.
*   **Stable References**: Controller objects in hooks are stabilized with `useMemo`.

### 9.2 Mobile Experience
*   **Grip Handling**: `touch-action: none` on draggable elements.
*   **Viewport Safety**: Sidebars use `w-80` instead of `w-full`.
*   **Typography**: Standardized `text-xs font-bold uppercase` for headers.

---

## 10. Key Hooks Reference

| Hook | Purpose | Key Dependencies |
|:-----|:--------|:-----------------|
| `useFocusContext` | Access focus session state & actions | FocusSessionContext |
| `useFocusTick` | Access timeLeft (1Hz updates) | FocusTickContext |
| `useSimpleTimer` | Access dashboard timer | ActiveTimerContext |
| `useGlobalTimer` | Orchestrate between timer types | Both timer contexts |
| `useFocusSession` | Focus session UI logic | useFocusContext, useGlobalTimer |
| `useFocusViewController` | Focus view controller | All contexts |
| `useSessionSync` | Cloud session sync | FirestoreAdapter |
| `useDataSync` | General data sync utilities | StorageContext |
| `useTasks` | Task CRUD with ledger integration | TimeLedger, Storage |
| `useTaskContext` | Access tasks from context | TaskContext |

---

*Verified & Current as of Jan 2026*
