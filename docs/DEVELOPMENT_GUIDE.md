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
```

---

## 2. Architecture & State Patterns

**Critical Change:** We do **NOT** use a central "DashboardContext".
Instead, we use specialized contexts.

### How to Access State?
Do not drill props down 10 levels. Use the appropriate Hook:

| Domain | Hook | Purpose |
| :--- | :--- | :--- |
| **Tasks** | `useTaskContext()` | Create, Edit, Delete tasks. |
| **Categories** | `useCategoryContext()` | Manage projects/categories. |
| **Time/Focus** | `useSession()` | Start/Stop Focus Timer logic. |
| **Theme/UI** | `useUI()` | Toggle Sidebar, Zen Mode, Dark Mode. |
| **User** | `useAuth()` | Get current user profile. |

### Example: Adding a Task
```tsx
import { useTaskContext } from '../context/TaskContext';

const MyComponent = () => {
  const { addTask } = useTaskContext();

  const handleCreate = () => {
    addTask({ title: "New Task", categoryId: "123" });
  };

  return <button onClick={handleCreate}>Add Task</button>;
};
```

---

## 3. Workflow: How to Add a New Feature

### Step 1: Define Data Model
If your feature needs new data, update `src/types/models.ts`.
*   *Example*: Adding "Tags" to tasks.
```typescript
export interface Task {
  // ... existing fields
  tags: string[];
}
```

### Step 2: Update Context (Business Logic)
Modify the relevant Context (e.g., `src/context/TaskContext.tsx`) to handle the new field.
*   Update the `addTask` function to accept tags.
*   Update individual update references.
*   **Note**: Persistence to `localStorage` is usually automatic if you modify the main state array in 'TaskContext'.

### Step 3: UI Implementation
**CRITICAL**: Do not write raw HTML/CSS for common elements.
1.  **Check `src/components/ui`**: Use `<Button>`, `<Input>`, `<Modal>`, `<Logo>`.
2.  **Styling**: Use **Semantic Tokens** (`bg-brand-DEFAULT`, `bg-bg-surface`). Do not use raw colors (`bg-blue-600`).
3.  **Dynamic Colors**: For categories or tags, use `TAG_COLORS` from `src/utils/theme.ts`.
4.  **Icons**: Use `lucide-react`. Standard size is 18px.

### Step 4: Translations
**Never hardcode strings.** Add keys to `src/locales/en/translation.json` and `src/locales/uk/translation.json`.

```tsx
import { useTranslation } from 'react-i18next';

// ...
const { t } = useTranslation();
<h1>{t('my_feature.title')}</h1>
```

---

## 4. Best Practices

### 4.1. Mobile First
Always check layout at `375px` width (iPhone SE).
*   Use `flex-wrap` for buttons.
*   Use `max-w-full` for inputs.

### 4.2. Accessibility (a11y)
*   **Don't use `div` for buttons.** Use `<button type="button">`.
*   Ensure every icon-only button has `aria-label` or `title`.

### 4.3. Performance
*   **Split Components**: If a component is huge, break it down.
*   **Use `React.memo`**: Especially for items in long lists (like `TaskItem`).
*   **Lazy Load**: Views are lazy-loaded in `App.tsx`. Keep this pattern for large new routes.

---

## 5. Utilities & Helpers

### `formatters.ts`
*   `formatTime(seconds)`: Returns "HH:MM:SS" (for timers).
*   `formatDate(date)`: Localized date string.

### `storage`
Use `localStorageAdapter` for all persistence.
```ts
// Good
localStorageAdapter.setItem('key', data);

// Bad
localStorage.setItem('key', JSON.stringify(data));
```
