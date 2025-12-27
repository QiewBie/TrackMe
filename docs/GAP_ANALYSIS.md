# Technical Debt & Refactoring Log

## 1. High Priority (Performance & Stability)

### Persistence Layer (`LocalStorage`)
*   **Problem**: Data is tied to the specific browser instance. No backup.
*   **Solution**: Abstract the data layer to support a Backend (Supabase/Firebase). **Status**: Ready for migration (Adapter pattern implemented).

### `RichTextEditor` Optimization
*   **Problem**: The Tiptap/ProseMirror instance is heavy and can cause jank when switching projects rapidly.
*   **Solution**: Implementing lazy loading for the editor or holding a singleton instance.

## 2. Codebase Health

### Type Safety
*   **Status**: Core types are split (`models.ts`, `ui.ts`), but `index.ts` still re-exports everything.
*   **Goal**: Ensure strict import boundaries.

### Testing Strategy
*   **Current State**: Minimal Unit Tests via Vitest.
*   **Goal**: Add Integration tests for the "Focus Flow" (Timer -> Complete -> Save).

## 3. Resolved Items (Recently Fixed) ✅

### Native Alerts
*   **Fix**: Replaced `window.confirm` with custom `ConfirmationModal` in `DataManager`.

### Focus View Accessibility
*   **Fix**: Replaced inaccessible `div` buttons with semantic `<button>` elements.

### Ambience UI
*   **Fix**: Implemented `AmbienceSelector` with volume control.

### Infinite Render Loops
*   **Fix**: Patched `DateTimePicker` and `TaskInput` to prevent `useEffect` cycles.
