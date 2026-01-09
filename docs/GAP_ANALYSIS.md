# Technical Debt & Refactoring Log

## 1. High Priority (Testing)

### TimeService Test Coverage
*   **Status**: ❌ No tests
*   **Risk**: HIGH - Critical infrastructure for time accuracy
*   **Impact**: Server sync, drift calculation, offset management untested
*   **Solution**: Add unit tests for:
    *   `getTrustedTime()` returns correct offset
    *   `updateOffset()` jitter protection (ignores < 500ms)
    *   `initialize()` performs probe correctly
    *   Guest mode bypass

### TimeLedger Test Coverage
*   **Status**: ❌ No tests
*   **Risk**: HIGH - Data persistence layer
*   **Impact**: Pending queue, deduplication, merge logic untested
*   **Solution**: Add unit tests for:
    *   `saveLog()` deduplication
    *   `addToPending()` / `removeFromPending()` queue management
    *   `mergeLogs()` cloud merge behavior
    *   Guest mode guard

### useGlobalTimer Test Coverage
*   **Status**: ❌ No tests
*   **Risk**: MEDIUM - Orchestrator for timer systems
*   **Solution**: Add tests for mutual exclusion logic

---

## 2. Medium Priority (Performance)

### RichTextEditor Optimization
*   **Problem**: The Tiptap/ProseMirror instance is heavy and can cause jank when switching projects rapidly.
*   **Solution**: Implementing lazy loading for the editor or holding a singleton instance.

### useFocusViewController Memoization
*   **Problem**: `queue` useMemo recalculates on every task update (cachedTotalTime changes 1Hz).
*   **Impact**: Can cause drag-and-drop issues in FocusSidebar.
*   **Current Fix**: FocusSidebar uses local state for drag stability.
*   **Better Solution**: Stabilize queue reference or debounce updates.

---

## 3. Codebase Health

### Legacy Code Cleanup
*   **`savedTime` field**: Deprecated but still present in Task interface for backwards compatibility.
    *   Status: Migration complete, field can be removed in next major version.
*   **`useActiveTimer` legacy exports**: Empty functions exported for compatibility.
    *   Location: `ActiveTimerContext.tsx:176-180`
    *   Solution: Remove after confirming no imports.

### Type Definition Gaps
*   Some fields in Task interface undocumented in code comments:
    *   `updatedAt` - Used for conflict resolution
    *   `focusOffset` - Focus set time tracking
    *   `lastStartTime` - Simple timer logic
*   **Solution**: Add JSDoc comments to type definitions.

---

## 4. Documentation Gaps (Resolved Jan 2026)

### Previously Missing
*   ✅ TimeService documentation - Added to ARCHITECTURE.md
*   ✅ Split Context Pattern - Added to ARCHITECTURE.md
*   ✅ Pending Queue documentation - Added to ARCHITECTURE.md
*   ✅ Cloud Sync architecture - Added to ARCHITECTURE.md
*   ✅ Hook reference - Added to PROJECT_STRUCTURE.md

---

## 5. Future Improvements

### Architecture
1. **Event Sourcing**: Consider full event sourcing for time logs instead of just append.
2. **Service Worker**: Add offline support with background sync.
3. **WebSocket**: Real-time collaboration features.

### Testing Strategy
*   **Current State**: Minimal Unit Tests + some Integration Tests via Vitest.
*   **Goal**: Add Integration tests for the "Focus Flow" (Timer → Complete → Save).
*   **Coverage Target**: 80% for services/, 60% for hooks/.

---

*Last Updated: Jan 2026*
