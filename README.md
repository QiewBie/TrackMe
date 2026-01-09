'# ⚡ Deep Flow: Time Tracker (V2)

A premium, offline-first productivity workspace designed for deep work. Built with a robust **Ledger-Based Architecture** and **Versioned Sync System**, it prioritizes data integrity, immersive focus, and strict local privacy.

## ✨ Core Features

### 🧠 Focus & Flow
*   **Immersive Session Engine**: A dedicated `FocusView` overlay that blocks distractions and manages cognitive load.
*   **Smart Pomodoro Logic**: Automatically transitions between Focus, Short Break, and Long Break (after 4 sets).
*   **Dual Timer System**: Focus Timer (Pomodoro countdown) + Simple Timer (Dashboard stopwatch).
*   **Timer Orchestrator**: `useGlobalTimer` ensures only one timer type is active, preventing data conflicts.
*   **Drift-Proof Timing**: Uses target-time calculation instead of interval counting for accurate sessions.
*   **Task Queue**: Auto-advancing playlist system with "Universal Sync" across devices.

### 📊 Analytics & Data (Ledger V2)
*   **Immutable Logging**: Time stored as `TimeLog` entries (`startTime`, `duration`, `projectId`).
*   **Source of Truth**: Dashboards derive metrics directly from the raw ledger.
*   **Metrics**:
    *   **Activity Heatmap**: GitHub-style consistency tracking.
    *   **Velocity Chart**: 14-day trend analysis.
    *   **Efficiency**: Completion rates and average session duration.
    *   **Distribution**: Project-based time breakdown.

### 🌍 Localization (i18n)
*   **Multi-language Support**: Fully localized in English (`en`) and Ukrainian (`uk`).
*   **Dynamic Loading**: Locale-specific date formatting via `date-fns`.
*   **Keys**: Centralized JSON translation files (`src/locales/*`).

### 💾 Data Persistence & Management
*   **Offline-First**: All data stored locally in browser via `TimeLedgerService`.
*   **Pending Queue**: Logs saved even when offline, synced when connection restored.
*   **Data Portability**: Full JSON Export/Import for backups or device migration.
*   **Safe Storage**: Sub-collection storage pattern prevents monolithic corruption.

### ☁️ Cloud Sync (Optional)
*   **Firebase Integration**: Sign in with Google for multi-device sync.
*   **Real-Time Updates**: Tasks, sessions, and preferences sync instantly.
*   **Versioned Sync (v4.1)**: Version-based conflict resolution via `VersionManager`.
*   **Server Time Sync**: `TimeService` maintains clock accuracy across devices.
*   **UI Lockout**: 300ms lockout after local actions prevents UI flash.
*   **Zombie Detection**: Stale sessions (>24h) auto-purged.

### 🎨 Design System & Theming
> Full Specification: [**See STYLE_GUIDE.md**](docs/STYLE_GUIDE.md)

*   **6 Themes**: Default (Blue), Serenity, Amber, Rose, Sage, Monochrome.
*   **Layer System**:
    *   Canvas (`bg-bg-main`): `#f8fafc` (Light) / `#020617` (Dark).
    *   Surface (`bg-bg-surface`): `#ffffff` (Light) / `#0f172a` (Dark).
*   **Tokens**: Functional naming (`bg-brand-primary`, `text-ui-disabled`).
*   **Typography**: **Manrope** variable font with strict hierarchy.
*   **Z-Index Stack**: `z-40` (Sidebar) → `z-50` (Modals) → `z-[100+]` (Overlays).

---

## 🏗️ Technical Architecture

### Tech Stack
*   **Core**: React 18, TypeScript, Vite
*   **State**: React Context API (Split Pattern) + Custom Hooks
*   **Styling**: Tailwind CSS (Semantic), Framer Motion, Lucide Icons
*   **Charts**: Recharts
*   **Utils**: date-fns, dnd-kit, react-i18next
*   **Cloud**: Firebase Auth + Firestore (optional)

### Time System
```
┌─────────────────────────────────────────────────────────────────┐
│                          TimeService                            │
│   Maintains trusted time via probe sync + piggyback updates     │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ FocusSession  │  │  ActiveTimer    │  │    TimeLedger       │
│   Context     │  │    Context      │  │     Service         │
│ (Pomodoro)    │  │  (Stopwatch)    │  │ (Log Persistence)   │
└───────┬───────┘  └────────┬────────┘  └──────────┬──────────┘
        │                   │                      │
        └───────────────────┼──────────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  useGlobalTimer │
                   │  (Orchestrator) │
                   └─────────────────┘
```

### Data Flow
1.  **TimeService**: Syncs clock on login, maintains offset.
2.  **Session Context**: Manages active "Live" state (ticking timer).
3.  **Flush Strategy**: On pause/stop, duration "flushed" to `TimeLog`.
4.  **TimeLedger**: Writes log to localStorage + pending queue + cloud.
5.  **Reactivity**: `TimeLedger.subscribe()` updates UI instantly.

### Directory Structure
```
src/
├── components/     # Shared UI Building Blocks
├── context/        # Global State (Auth, FocusSession, Task, UI)
├── features/       # Feature Modules (Vertical Slices)
│   ├── analytics/  # Charts & Metrics
│   ├── auth/       # Login, Profile
│   ├── focus/      # Focus Timer & View
│   ├── playlists/  # Playlist Management
│   └── tasks/      # Task Management
├── hooks/          # Custom Hooks (useFocusSession, useGlobalTimer)
├── services/       # Core Business Logic
│   ├── storage/    # TimeLedger, FirestoreAdapter, LocalStorageAdapter
│   ├── sync/       # VersionManager (conflict resolution)
│   └── time/       # TimeService
├── types/          # TypeScript Definitions (incl. sync.ts)
└── utils/          # Helper Functions
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
*   `npm run test`: Run Vitest tests.

### Environment Variables
Create `.env` from `.env.example`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
# ... other Firebase config
```

---

## 📚 Documentation

| Document | Purpose |
|:---------|:--------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, context patterns |
| [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | File organization, module breakdown |
| [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) | How to add features, best practices |
| [STYLE_GUIDE.md](docs/STYLE_GUIDE.md) | Design system, colors, typography |
| [PROJECT_STATE.md](docs/PROJECT_STATE.md) | Current features, roadmap |
| [GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md) | Technical debt, test coverage |

---

## 🔒 Privacy & Security
*   **Local-First**: By default, data resides in LocalStorage.
*   **Cloud Sync (Optional)**: Sign in to sync across devices via Firebase.
*   **Export**: Users own their data via JSON Export feature.
*   **No Tracking**: Zero analytics or telemetry collected.

---

*Current State: Production Ready (v0.2.2 - Versioned Sync)*

