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

### 🎨 Design System & Theming
> Full Specification: [**See STYLE_GUIDE.md**](docs/STYLE_GUIDE.md)

*   **Layer System**:
    *   Canvas (`bg-bg-main`): `#f8fafc` (Light) / `#020617` (Dark).
    *   Surface (`bg-bg-surface`): `#ffffff` (Light) / `#0f172a` (Dark).
*   **Tokens**: Functional naming (`bg-brand-primary`, `text-ui-disabled`) ensures automatic theme adaptation.
*   **Typography**: **Manrope** variable font. Used with strict hierarchy (H1-H4, Body, Caption).
*   **Z-Index Stack**: Explicit layering model:
    *   `z-40` (Mobile Sidebar)
    *   `z-50` (Modals)
    *   `z-[100+]` (Critical Overlays)

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
3.  **Ledger**: The `TimeLedger` service handles validation and writes the log to persistent storage (`localStorage`).
4.  **Reactivity**: Listeners (`TimeLedger.subscribe`) update the UI (analytics, task totals) instantly.

### Directory Structure
```
src/
├── components/     # Shared UI Building Blocks
│   ├── layout/     # Sidebar, BottomNav
│   ├── shared/     # Common Widgets (Modals, DatePickers)
│   └── ui/         # Atomic Primitives (Button, Input, Typography)
├── features/       # Feature Modules (Vertical Slices)
│   ├── analytics/  # Analytics View & Charts
│   ├── auth/       # Login, Profile, Datamanager
│   ├── focus/      # Focus Session Engine & View
│   ├── playlists/  # Playlist Management & Editors
│   └── tasks/      # Task Management System
├── context/        # Global State (Auth, FocusSession, Task, UI)
├── hooks/          # Logic (useFocusSession, useTimeLedger)
├── locales/        # i18n JSON files
├── services/       # Core Business Logic
├── types/          # TypeScript Interfaces
└── utils/          # Helpers
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
*   **Local-First**: By default, data resides in the user's LocalStorage.
*   **Cloud Sync (Optional)**: Users can sign in to sync preferences and data across devices via Firebase.
*   **Export**: Users own their data via the JSON Export feature.

---

*Current State: Production Ready (v0.2.1)*
