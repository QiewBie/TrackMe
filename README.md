# ⚡ Deep Flow: Time Tracker (V2)

A premium, offline-first productivity workspace designed for deep work. Built with a robust **Ledger-Based Architecture**, it prioritizes data integrity, immersive focus, and strict local privacy.

## ✨ Core Features

### 🧠 Focus & Flow
*   **Immersive Session Engine**: A dedicated `FocusView` overlay that blocks distractions.
*   **Timer Modes**: Customizable Work, Short Break, and Long Break configurations.
*   **Dynamic Ambience**: Integrated audio engine (`useAudio`) mixing Rain, Forest, Café, and Fireplace soundscapes.
*   **Task Queue**: Auto-advancing playlist system ("General Queue" or specific Playlists).

### 📊 Analytics & Data (Ledger V2)
*   **Immutable Logging**: Time is not stored as a mutable counter but as specific `TimeLog` entries (`startTime`, `duration`, `projectId`).
*   **Source of Truth**: Dashboards derive metrics (Total Time, Velocity, Heatmaps) directly from the raw ledger, ensuring 100% accuracy.
*   **Metrics**:
    *   **Activity Heatmap**: Github-style consistency tracking.
    *   **Velocity Chart**: 14-day trend analysis.
    *   **Efficiency**: Completion rates and average session duration.
    *   **Distribution**: Project-based time breakdown.

### 🌍 Localization (i18n)
*   **Multi-language Support**: Fully localized in English (`en`) and Ukrainian (`uk`).
*   **Dynamic Loading**: Locale-specific date formatting (via `date-fns` and `i18n.language` detection).
*   **Keys**: Centralized JSON translation files (`src/locales/*`).

### 💾 Data Persistence & Management
*   **Offline-First**: All data is stored locally in the browser (`localStorage`) via the `TimeLogRepository`.
*   **Data Portability**: Full JSON Export/Import capabilities (`useDataPersistence`) for backups or device migration.
*   **Safe Storage**: Sub-collection storage pattern to prevent monolithic data corruption.

### 🎨 Design System
*   **Semantic Tokens**: Styles use functional names (`bg-brand-primary`, `text-status-error`) rather than raw colors, enabling seamless theming.
*   **Dark Mode**: First-class support with automatic switching.
*   **Motion**: Framer Motion integration for smooth page transitions and micro-interactions.

---

## 🏗️ Technical Architecture

### Tech Stack
*   **Core**: React 18, TypeScript, Vite
*   **State**: React Context API (`FocusSessionContext`, `UIContext`) + Custom Hooks
*   **Styling**: Tailwind CSS (Semantic), Framer Motion, Lucide Icons
*   **Charts**: Recharts
*   **Utils**: date-fns, dnd-kit, react-i18next

### Data Flow
1.  **Session Context**: Manages the active "Live" state (ticking timer).
2.  **Flush Strategy**: When a user pauses or stops, the session duration is "flushed" to a static `TimeLog`.
3.  **Repository**: The `TimeLogRepository` writes the log to persistent storage.
4.  **Reactivity**: Listeners (`TimeLedger.subscribe`) update the UI (analytics, task totals) instantly.

### Directory Structure
```
src/
├── components/     # UI Building Blocks
│   ├── analytics/  # Charts & Stats Widgets
│   ├── focus/      # Session View & Timer Logic
│   ├── input/      # Rich Text & Forms
│   ├── layout/     # Sidebar, Nav, Modals
│   ├── playlist/   # Playlist Manager & Editors
│   └── ui/         # Atomic Primitives (Button, Badge, Card)
├── context/        # Global State (Auth, Session, UI)
├── hooks/          # Logic (useFocusSession, useTimeLedger)
├── locales/        # i18n JSON files
├── services/       # Storage Adapters & Repositories
├── types/          # TypeScript Interfaces (Task, TimeLog)
└── utils/          # Helpers (Formatters, Themes, Backup)
```

---

## 🛠️ Setup & Development

### Installation
```bash
git clone <repository-url>
cd time-tracker
npm install
```

### Commands
*   `npm run dev`: Start local development server (Port 5173).
*   `npm run build`: Compile for production.
*   `npm run preview`: Preview the production build locally.
*   `npm run lint`: Run ESLint check.

---

## 🔒 Privacy & Security
*   **Zero-Knowledge**: No data is sent to external servers. Everything resides in the user's LocalStorage.
*   **Export**: Users own their data via the JSON Export feature.

---

*Current State: Production Ready (v0.2.1)*
