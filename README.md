# Task Tracker

A full-stack, real-time collaborative Task Tracker application with a Kanban board, concurrent editing locks, asynchronous CSV export queues, and JWT authentication.

---

## Architecture Overview

```text
                     ┌──────────────────────────────────────────────┐
                     │          Frontend (React 19 + Vite)          │
                     │          http://localhost:5173               │
                     └───────────────┬──────────────────────────────┘
                                     │
                  HTTP REST API (JWT)│  WebSocket (Socket.IO)
                                     ▼
                     ┌──────────────────────────────────────────────┐
                     │          Backend (NestJS 12)                 │
                     │          http://localhost:3000               │
                     └───────┬──────────────────────────────┬───────┘
                             │                              │
                      Prisma │                              │ p-queue
                             ▼                              ▼
             ┌──────────────────────────────┐   ┌──────────────────────────────┐
             │    PostgreSQL 16 Database    │   │      CSV Export Worker       │
             │    localhost:5432            │   │      (data/exports/*.csv)    │
             └──────────────────────────────┘   └──────────────────────────────┘
```

- **Frontend:** React 19, TypeScript, Vite, React Router 7, Socket.IO Client, Sonner (Toasts), CSS Modules.
- **Backend:** NestJS 12, Prisma 6, PostgreSQL 16, Socket.IO, Passport JWT, p-queue (background jobs), Vitest.

---

## Fast Local Start

### 1. Launch requirements

- **Node.js:** `v24.x`
- **npm:** `v10.x`+
- **Docker & Docker Compose:** Installed and running (for PostgreSQL)

---

### 2. Quick Start Commands (Step-by-Step)

Run each step independently:

##### Step 1: Install Dependencies
```bash
npm run setup:npm
```

##### Step 2: Environment Variables Setup
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
cp backend/.env.example backend/.env
```

##### Step 3: Start Database (PostgreSQL)
```bash
npm run setup:db
```

##### Step 4: Database Push & Seed
```bash
npm run setup:backend
```

##### Step 5: Start Backend (Terminal 1)
```bash
npm run start:backend
```

##### Step 6: Start Frontend (Terminal 2)
```bash
npm run start:frontend
```

---

## Default Test Accounts

The database seed provides two pre-configured accounts to easily test multi-user real-time collaboration and concurrent editing locks:

| Username / Login | Password | Role |
| :--- | :--- | :--- |
| `Tommy` | `123` | User / Author |
| `Jerry` | `123` | User / Author |

> **Tip:** Open `http://localhost:5173` in a normal browser window as **Tommy**, and open an Incognito window as **Jerry**. When Tommy clicks to edit a task, Jerry will immediately see a real-time lock badge indicating the task is currently being edited.

---

## Application URLs & Ports

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:5173](http://localhost:5173) | Vite Single-Page Application (Kanban Board) |
| **Backend API** | [http://localhost:3000](http://localhost:3000) | NestJS REST Endpoints & Health Check |
| **WebSocket** | `ws://localhost:3000` | Socket.IO Gateway for live board sync & locks |
| **PostgreSQL** | `localhost:5432` | Database (`task_tracker` / `task_tracker`) |

---

## Project Structure

```text
task-tracker/
├── package.json            # Root workspace scripts for fast local development
├── README.md               # Main project documentation & quick start guide
├── backend/                # NestJS backend application
│   ├── README.md           # Backend-specific documentation, API reference & WS events
│   ├── docker-compose.yaml # PostgreSQL Docker configuration
│   ├── .env.example        # Environment variables template
│   ├── prisma/             # Prisma schema & database seeder
│   ├── src/                # NestJS controllers, services, gateway & auth modules
│   └── vitest.config.ts    # Backend test configuration
└── frontend/               # React + Vite frontend application
    ├── README.md           # Frontend-specific documentation & architecture
    ├── .env.example        # Environment variables template
    ├── src/                # React components, pages, services & types
    └── vite.config.ts      # Vite configuration
```

---

## Detailed Documentation

For in-depth guides and API references, check the module documentation:

- 📖 [Backend Documentation (`backend/README.md`)](./backend/README.md) — API endpoints, WebSocket events, database configuration, security, and test suites.
- 📖 [Frontend Documentation (`frontend/README.md`)](./frontend/README.md) — UI architecture, state management, components, and real-time event listeners.

---

## Testing & Quality Assurance

Run checks across the monorepo:

Backend unit tests:
```bash
npm run test:backend
```

Backend E2E tests:
```bash
npm run test:e2e
```

Lint backend:
```bash
npm run lint:backend
```

Lint frontend:
```bash
npm run lint:frontend
```

Production build verification:
```bash
npm run build
```
