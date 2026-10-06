# Task Tracker — Frontend Client

A modern, real-time collaborative Kanban board built with **React 19**, **TypeScript**, **Vite**, **React Router 7**, and **Socket.IO Client**.

---

## Features

- **Interactive Kanban Board:** Visualize tasks organized by columns (`TODO`, `IN_PROGRESS`, `DONE`).
- **Drag & Drop / Quick Move:** Intuitive drag-and-drop task movement between columns and inline editing.
- **Real-Time Collaboration:** Instant board synchronization across multiple connected users via WebSockets.
- **Concurrent Editing Locks:** Real-time visual lock indicator showing which user is currently editing a task, preventing conflicting concurrent edits.
- **Asynchronous CSV Export & Notifications:** One-click CSV export with real-time toast status updates (`Sonner`) and automatic file download upon completion.
- **Authentication:** Protected routing, JWT session persistence (`localStorage`), login and registration forms.
- **Optimistic UI Updates:** Instant UI feedback on task actions with error rollback.

---

## Tech Stack

- **UI Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Language:** [TypeScript 6](https://www.typescriptlang.org/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Real-Time:** [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- **Notifications / Toasts:** [Sonner](https://sonner.emilkowal.ski/)
- **Styling:** CSS Modules
- **Linting:** ESLint 10 + TypeScript-ESLint

---

## Getting Started

### Prerequisites

- **Node.js:** `v20.x` or `v22.x`+
- **npm:** `v10.x`+
- Running **Backend Service** (default: `http://localhost:3000`)

---

### Environment Variables

Create a `.env` file in the `frontend/` directory (or use default fallback `http://localhost:3000`):

```bash
cp .env.example .env
```

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for Backend REST API and WebSocket connection | `http://localhost:3000` |

---

### Installation & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will run at `http://localhost:5173`.

---

## Available Scripts

```bash
# Start development server with HMR
npm run dev

# Type-check and build for production
npm run build

# Preview production build locally
npm run preview

# Lint source files
npm run lint
```

---

## Application Architecture

```text
frontend/
├── src/
│   ├── components/
│   │   ├── column/         # TaskColumn component & column styles
│   │   ├── header/         # AppHeader with user info, export button, and logout
│   │   ├── modal/          # Task creation modal
│   │   ├── task/           # TaskItem card with inline edit, lock badges, drag handlers
│   │   └── ProtectedRoute.tsx # Route guard for authenticated pages
│   ├── pages/
│   │   ├── login/          # Login page
│   │   ├── register/       # User registration page
│   │   └── tasks/          # Main Kanban board page & WebSocket event listeners
│   ├── services/
│   │   ├── apiClient.ts    # Reusable HTTP client with JWT injection & error handling
│   │   ├── authService.ts  # Login, register, token, and user session management
│   │   ├── socketService.ts# Socket.IO connection manager & event emitters
│   │   └── taskService.ts  # Task API endpoints wrapper
│   ├── types/
│   │   ├── index.ts        # Barrel exports
│   │   ├── task.ts         # Task, Status, Lock, and Export event types
│   │   └── user.ts         # User model & credentials types
│   ├── App.tsx             # Route configuration & global toast provider
│   └── main.tsx            # Entry point
├── index.html
├── vite.config.ts
└── tsconfig.json
```

---

## Default Test Credentials

Use these pre-seeded accounts to test multi-user real-time interaction (open two browser windows/incognito sessions):

| User | Password |
| :--- | :--- |
| `Tommy` | `123` |
| `Jerry` | `123` |
