# Task Tracker — Backend Service

A robust, real-time REST and WebSocket API for the Task Tracker collaborative application, built with **NestJS**, **Prisma ORM**, **PostgreSQL**, and **Socket.IO**.

---

## Features

- **Authentication & Authorization:** JWT-based stateless authentication with bcrypt password hashing (`/auth/login`, `/auth/register`).
- **Task Management (CRUD):** Full task lifecycle management (`TODO`, `IN_PROGRESS`, `DONE`) with author and updater tracking.
- **Real-Time Synchronization & Concurrency Locks:** Socket.IO gateway broadcasting live task changes (`created`, `updated`, `deleted`) and active task editing locks to prevent race conditions during concurrent editing.
- **Asynchronous CSV Export:** Queue-based task export to CSV powered by `p-queue` with real-time WebSocket progress notifications and automatic disk cleanup of expired export files.
- **Database & Migrations:** PostgreSQL managed via Prisma ORM with automated seeding.
- **Testing:** Comprehensive unit and E2E test suites with Vitest.

---

## Tech Stack

- **Framework:** [NestJS 12](https://nestjs.com/) (Express HTTP adapter)
- **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/)
- **Real-Time:** [Socket.IO](https://socket.io/) (`@nestjs/platform-socket.io`)
- **Authentication:** [Passport JWT](http://www.passportjs.org/) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **Background Queue:** [p-queue](https://github.com/sindresorhus/p-queue)
- **Testing:** [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest)
- **Linter & Formatter:** [Oxlint](https://oxc.rs/) + [Prettier](https://prettier.io/)

---

## Getting Started

### Launch requirements

- **Node.js:** `v24.x`
- **npm:** `v10.x`+
- **Docker & Docker Compose:** (for local PostgreSQL instance) or an existing PostgreSQL database

---

### Environment Variables

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://task_tracker:task_tracker@localhost:5432/task_tracker?schema=public` |
| `PORT` | HTTP server listening port | `3000` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `jwt-secret-task-tracker-default` *(set a secure secret in production)* |

---

### Installation & Database Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start PostgreSQL via Docker Compose:**
   ```bash
   docker compose up -d
   ```

3. **Apply Prisma schema to the database:**
   ```bash
   npx prisma db push
   ```

4. **Seed database with test users and sample tasks:**
   ```bash
   npm run seed
   ```

#### Default Test Accounts

After running the seed script, the following demo accounts are available:

| Login | Password | Role |
| :--- | :--- | :--- |
| `Tommy` | `123` | User / Author |
| `Jerry` | `123` | User / Author |

---

## Running the Application

Development mode with hot-reload (watch mode):
```bash
npm run start:dev
```

Standard start:
```bash
npm run start
```

Production build & start:
```bash
npm run build
```

```bash
npm run start:prod
```

The backend server will start at `http://localhost:3000` (or the port configured in `PORT`).

---

## API Reference

### Authentication (`/auth`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | No | Register a new user (`{ login, password }`) |
| `POST` | `/auth/login` | No | Login and receive a JWT Bearer token |

### Tasks (`/tasks`)

*All task endpoints require a valid JWT Bearer token in the `Authorization: Bearer <token>` header.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks |
| `POST` | `/tasks` | Create a new task (`{ title, text, status? }`) |
| `GET` | `/tasks/:id` | Get details of a single task |
| `PATCH` | `/tasks/:id` | Update task fields / status (`{ title?, text?, status? }`) |
| `DELETE` | `/tasks/:id` | Delete a task |
| `POST` | `/tasks/export/csv` | Queue a background task export to CSV |
| `GET` | `/tasks/export/:fileId` | Download generated CSV export file |

### Users (`/users`)

*Protected by JWT Guard.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | List all users (excluding password hashes) |
| `GET` | `/users/:id` | Get a specific user by ID |
| `PATCH` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Delete user |

---

## WebSocket Events (Socket.IO)

Clients connect to `ws://localhost:3000` with JWT authentication passed in the connection payload:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Client-to-Server Events

- `task:lock` — Payload: `{ taskId: number }` (requests an exclusive edit lock on a task)
- `task:unlock` — Payload: `{ taskId: number }` (releases the edit lock)

### Server-to-Client Events

- `task:created` — Emitted when a new task is created
- `task:updated` — Emitted when a task is updated or moved across columns
- `task:deleted` — Emitted when a task is removed
- `activeLocks` — List of all currently active task locks sent upon connection
- `task:locked` — Broadcast when a user locks a task for editing
- `task:unlocked` — Broadcast when a task edit lock is released
- `tasks:export:progress` — CSV export progress update (`{ jobId, progress, total }`)
- `tasks:export:completed` — CSV export completed (`{ jobId, fileId, downloadUrl, fileName }`)
- `tasks:export:failed` — CSV export error notification

---

## Testing & Quality

Run unit tests:
```bash
npm run test
```

Run unit tests with watch mode:
```bash
npm run test:watch
```

Run unit tests with coverage:
```bash
npm run test:cov
```

Run End-to-End (E2E) tests:
```bash
npm run test:e2e
```

Run linter:
```bash
npm run lint
```

Format code with Prettier:
```bash
npm run format
```

---

## Project Structure

```text
backend/
├── docker-compose.yaml     # PostgreSQL Docker configuration
├── prisma/
│   ├── schema.prisma       # Database models and relations
│   └── seed.ts             # Database seeder (Tommy & Jerry users + default tasks)
├── src/
│   ├── auth/               # JWT authentication, guards, strategy, decorators
│   ├── tasks/              # Task CRUD, WebSocket gateway, CSV export queue
│   │   ├── dto/            # Task DTOs
│   │   ├── export/         # CSV export service, worker queue, file download
│   │   ├── tasks.controller.ts
│   │   ├── tasks.gateway.ts
│   │   └── tasks.service.ts
│   ├── users/              # User management
│   ├── prisma/             # Prisma service provider
│   ├── app.module.ts       # Main NestJS module
│   └── main.ts             # Application entry point & global pipes
└── vitest.config.ts        # Vitest test configuration
```
