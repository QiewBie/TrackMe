# Development Guide

## 1. Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm

### Quick Start
```bash
npm install     # Install dependencies
npm run dev     # Start local dev server (http://localhost:5173)
npm run build   # Build for production
npm run lint    # Run ESLint check
npm run test    # Run Vitest tests
```

---

## 2. Architecture & State Patterns

**Critical Change:** We do **NOT** use a central "DashboardContext".
Instead, we use specialized contexts with clear boundaries.

### How to Access State?
Do not drill props down 10 levels. Use the appropriate Hook:

| Domain | Hook | Purpose |
| :--- | :--- | :--- |
| **Tasks** | `useTaskContext()` | Read tasks list. |
| **Tasks (CRUD)** | `useTasks()` | Create, Edit, Delete, Toggle. |
| **Categories** | `useCategoryContext()` | Manage projects/categories. |
| **Focus Timer** | `useFocusContext()` | Access focus session state & actions. |
| **Focus Timer (Tick)** | `useFocusTick()` | Access `timeLeft` (updates 1Hz). |
| **Simple Timer** | `useSimpleTimer()` | Dashboard stopwatch timer. |
| **Timer Orchestrator** | `useGlobalTimer()` | Start/stop timers safely. |
| **Theme/UI** | `useUI()` | Toggle Sidebar, Zen Mode, Dark Mode. |
| **User** | `useAuth()` | Get current user profile. |
| **Playlists** | `usePlaylistContext()` | Playlist CRUD. |
| **Time Logs** | `TimeLedger` | Direct access to time log service. |

### Example: Adding a Task
```tsx
import { useTaskContext } from '../context/TaskContext';
import { useTasks } from '../hooks/useTasks';

const MyComponent = () => {
  const { tasks } = useTaskContext(); // Read
  const { addTask } = useTasks();     // Write

  const handleCreate = async () => {
    await addTask('New Task', 'category-123');
  };

  return <button onClick={handleCreate}>Add Task</button>;
};
```

### Example: Using TimeService
```tsx
import { timeService } from '../services/time/TimeService';

// Always use TimeService for timestamps
const now = timeService.getTrustedTime();       // number (ms)
const isoString = timeService.getTrustedISO();  // ISO string

// DON'T use these directly:
// Date.now()
// new Date().toISOString()
```

### Example: Starting a Timer
```tsx
import { useGlobalTimer } from '../hooks/useGlobalTimer';

const MyComponent = () => {
  const { startTimer, stopTimer, isRunning } = useGlobalTimer();

  const handleStart = () => {
    // 'dashboard' = Simple Timer, 'focus' = Focus Session
    startTimer(taskId, 'focus', { mode: 'focus' });
  };

  return <button onClick={handleStart}>Start Focus</button>;
};
```

---

## 3. Workflow: How to Add a New Feature

### Step 1: Define Data Model
If your feature needs new data, update the relevant types file.
*   *Example*: Adding "Tags" to tasks → update `src/features/tasks/types.ts`.

```typescript
export interface Task {
  // ... existing fields
  tags?: string[];
}
```

### Step 2: Update Context / Hook (Business Logic)
Modify the relevant Context or Hook.
*   Task changes → `src/hooks/useTasks.ts`
*   Focus changes → `src/context/FocusSessionContext.tsx`
*   New domain → Create new context in `src/context/`

**Critical**: Always use `timeService.getTrustedISO()` for timestamps!

### Step 3: UI Implementation
**CRITICAL**: Do not write raw HTML/CSS for common elements.
1.  **Check `src/components/ui`**: Use `<Button>`, `<Input>`, `<Modal>`, `<Logo>`.
2.  **Styling**: Use **Semantic Tokens** (`bg-brand-primary`, `bg-bg-surface`). Do not use raw colors (`bg-blue-600`).
3.  **Dynamic Colors**: For categories, use `CATEGORY_COLORS` from `src/features/theme/colors.ts`.
4.  **Icons**: Use `lucide-react`. Standard size is 18px.

### Step 4: Translations
**Never hardcode strings.** Add keys to both translation files:
*   `src/locales/en/translation.json`
*   `src/locales/uk/translation.json`

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<h1>{t('my_feature.title')}</h1>
```

---

## 4. Timer System

### Two Timer Types
1. **Focus Timer** (Pomodoro) - Countdown with work/break modes
2. **Simple Timer** (Stopwatch) - Count up from start time

**Only one can be active at a time.** Use `useGlobalTimer()` to ensure this.

### Writing Time Logs
Time is logged via `TimeLedger`:

```typescript
import { TimeLedger } from '../services/storage/TimeLedger';

// Log a session
TimeLedger.saveLog({
  id: crypto.randomUUID(),
  taskId: 'task-123',
  startTime: timeService.getTrustedISO(),
  duration: 300, // seconds
  type: 'auto', // or 'manual' for user edits
  note: 'Session Paused'
});
```

### Conflict Resolution
When cloud and local state conflict, we use **Last-Write-Wins**:
*   Every task/session has an `updatedAt` field.
*   Compare timestamps: newer wins.
*   Use `timeService.getTrustedISO()` for all writes.

---

## 5. Best Practices

### 5.1. Mobile First
Always check layout at `375px` width (iPhone SE).
*   Use `flex-wrap` for buttons.
*   Use `max-w-full` for inputs.

### 5.2. Accessibility (a11y)
*   **Don't use `div` for buttons.** Use `<button type="button">`.
*   Ensure every icon-only button has `aria-label` or `title`.

### 5.3. Performance
*   **Split Components**: If a component is huge, break it down.
*   **Use `React.memo`**: Especially for items in long lists (like `TaskItem`).
*   **Lazy Load**: Views are lazy-loaded in `App.tsx`. Keep this pattern.
*   **Avoid Context Churn**: Don't put frequently updating values (like timer ticks) in the same context as stable values.

### 5.4. Time Handling
*   **Always** use `timeService.getTrustedTime()` or `timeService.getTrustedISO()`.
*   **Never** use `Date.now()` or `new Date()` for stored timestamps.
*   **Guest mode**: TimeService returns local time (no sync), but API is consistent.

---

## 6. Cloud Sync

### Storage Adapters
The app uses an adapter pattern:
*   **Guest**: `LocalStorageAdapter` (no cloud)
*   **Logged In**: `FirestoreAdapter` (full sync)

Access via `useStorage()` hook.

### Real-Time Subscriptions
Firestore updates are received via `onSnapshot`:
*   Tasks: `subscribeToTasks(callback)`
*   Time Logs: `subscribeToTimeLogs(callback, limitDays)`
*   Sessions: `subscribeToActiveSession(callback)`

### Pending Queue
TimeLedger uses a safety net for offline writes:
1. Log is written to localStorage immediately
2. Log is added to pending queue
3. Cloud upload attempted
4. On success: removed from pending
5. On failure: retried on next app init

---

## 7. Utilities & Helpers

### `formatters.ts`
*   `formatTime(seconds)`: Returns "HH:MM:SS" (for timers).
*   `formatDuration(seconds, labels?)`: Returns "1h 30m" style.
*   `formatDate(date, format?, locale?)`: Localized date string.

### `dateHelpers.ts`
*   Date manipulation utilities for analytics.

### `theme.ts`
*   `getThemeColor(varName)`: Get computed CSS variable value.

### `storage`
Use `localStorageAdapter` for all persistence.
```ts
// Good
import { localStorageAdapter } from '../services/storage/LocalStorageAdapter';
localStorageAdapter.setItem('key', data);

// Bad
localStorage.setItem('key', JSON.stringify(data));
```

---

## 8. Testing

### Running Tests
```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

### Test Structure
Tests are co-located in `__tests__` directories:
```
src/hooks/__tests__/useFocusSession.test.ts
src/context/__tests__/FocusSessionBehavior.test.tsx
src/utils/__tests__/formatters.test.ts
```

### Mocking Contexts
```typescript
vi.mock('../../context/FocusSessionContext', () => ({
  useFocusContext: () => ({
    timeLeft: 1500,
    isPaused: true,
    activeSession: null,
    // ... mock functions
  })
}));
```

---

*Last Updated: Jan 2026*
