# Technical Debt & Refactoring Log

## 1. High Priority (Performance & Stability)

### `RichTextEditor` Optimization
*   **Problem**: The Tiptap/ProseMirror instance is heavy and can cause jank when switching projects rapidly.
*   **Solution**: Implementing lazy loading for the editor or holding a singleton instance.

## 2. Codebase Health

### Testing Strategy
*   **Current State**: Minimal Unit Tests via Vitest.
*   **Goal**: Add Integration tests for the "Focus Flow" (Timer -> Complete -> Save).
