# ⚡ Time Tracker "Deep Flow"

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/typescript-5-3178C6.svg?logo=typescript)
![Tailwind](https://img.shields.io/badge/tailwind-3-38B2AC.svg?logo=tailwindcss)

A premium, offline-first productivity tool designed to help you enter and sustain deep work states. Built with modern web technologies and a focus on aesthetics and performance.

**Live Demo:** [https://trackme-0001.web.app/](https://trackme-0001.web.app/)

---

## 🚀 Features

*   **Focus Timer**: Customizable Pomodoro/Flow timer with "Deep Flow" mode.
*   **Task Management**: Drag-and-drop organization, subtasks, and priority levels.
*   **Ambience**: Integrated soundscapes (Rain, Forest, Café, Night) to mask distractions.
*   **Playlists**: Create reusable task routines (e.g., "Morning Standup", "Coding Session").
*   **Analytics**: Visualize your productivity with Heatmaps and Velocity Charts.
*   **Offline First**: All data is stored locally in your browser. Privacy by design.
*   **Internationalization**: Fully localized in English and Ukrainian (🇺🇦).

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js v18+
*   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/time-tracker.git
    cd time-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

4.  **Build for Production**
    ```bash
    npm run build
    ```

---

## 📚 Documentation

*   [**Architecture**](./docs/ARCHITECTURE.md): Understanding the "Context Forest" pattern and state management.
*   [**Development Guide**](./docs/DEVELOPMENT_GUIDE.md): How to add new features and workflows.
*   [**Design System**](./docs/DESIGN_SYSTEM.md): Colors, Typography, and UI Primitives.
*   [**Project State**](./docs/PROJECT_STATE.md): Current feature status and roadmap.

---

## 🏗️ Tech Stack
*   **Core**: React 18, TypeScript, Vite
*   **Backend**: Firebase (Firestore, Auth, Analytics) + LocalStorage Fallback
*   **Styling**: Tailwind CSS (Semantic Tokens), Framer Motion
*   **State**: Context API + Hooks (Granular Architecture)
*   **Utils**: date-fns, i18next, @dnd-kit/core, Tiptap, Recharts

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

*2025 Deep Flow Tracker. Built with focus.*
