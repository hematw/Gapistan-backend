# Gapistan

A real-time chat application with 1-to-1 and group messaging, end-to-end encryption (E2EE), file sharing, voice/video calls (LiveKit), and an admin dashboard.

This is a **monorepo** — frontend and backend live in one repository:

```
Gapistan/
├── frontend/           # React + Vite client
├── backend/            # Express API + Socket.IO
├── docker-compose.yml  # MongoDB, LiveKit, MailHog, app services
└── README.md
```

Previously `Gapistan-frontend` and `Gapistan-backend` were separate repos. They are now combined here. Do **not** add a `.git` folder inside `frontend/` or `backend/` — that breaks GitHub and turns folders into submodules.

## Features

- **Messaging** — Real-time chat over WebSockets (Socket.IO)
- **1-to-1 & group chats** — Create groups, add/remove members, admin roles
- **End-to-end encryption** — AES-GCM + ECDH for direct chats; RSA-OAEP for group keys
- **Per-chat E2EE toggle** — Enable or disable encryption per conversation from the chat header
- **File sharing** — Images, video, audio, and PDF (up to 5 MB)
- **Voice & video calls** — Powered by LiveKit
- **User auth** — Sign up, sign in, OTP verification, JWT sessions
- **Admin dashboard** — User management and reports

## Tech stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite, Tailwind, HeroUI    |
| Backend    | Node.js, Express 5, Socket.IO       |
| Database   | MongoDB (Mongoose)                  |
| Calls      | LiveKit                             |
| Crypto     | Web Crypto API (ECDH, AES-GCM, RSA) |

## Project structure

```
Gapistan/
├── README.md
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    ├── Dockerfile
    └── .env.example
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended)
- Or, for local dev without Docker:
  - Node.js 20+
  - MongoDB 7+

## Clone

```bash
git clone git@github.com:hematw/Gapistan-backend.git Gapistan
cd Gapistan
```

You can rename the GitHub repo to `Gapistan` in **Settings → General → Repository name**; then update your local remote:

```bash
git remote set-url origin git@github.com:hematw/Gapistan.git
```

## Quick start (Docker)

1. **Clone and configure env files**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Start all services**

   ```bash
   docker compose up -d
   ```

3. **Seed demo users**

   ```bash
   docker compose exec backend node ./src/utils/seed.js
   ```

4. **Open the app**

   - App: http://localhost:4173
   - API: http://localhost:3000
   - MailHog (email UI): http://localhost:8025

5. **Sign in** with any demo account (password for all: `password123`):

   | Username | Email                    | Role  |
   |----------|--------------------------|-------|
   | admin    | admin@gapistan.local     | Admin |
   | alice    | alice@gapistan.local     | User  |
   | bob      | bob@gapistan.local       | User  |
   | charlie  | charlie@gapistan.local   | User  |
   | diana    | diana@gapistan.local     | User  |

## Services & ports

| Service   | URL / connection string              | Notes                          |
|-----------|--------------------------------------|--------------------------------|
| Frontend  | http://localhost:4173                | Nginx + production build       |
| Backend   | http://localhost:3000                | REST API + Socket.IO           |
| MongoDB   | `mongodb://localhost:27017/gapistan` | Persistent volume `mongo_data` |
| LiveKit   | `ws://localhost:7880`                | Dev keys: `devkey` / `secret`  |
| MailHog   | http://localhost:8025 (SMTP: 1025)   | Captures outbound email locally|

### Docker-only infra (run frontend/backend locally)

If you prefer Vite hot-reload during development:

```bash
docker compose up -d mongo livekit mailhog backend
```

Then run the frontend separately (see below). Point `MONGO_URI` in `backend/.env` to `mongodb://localhost:27017/gapistan` when running the backend on your machine.

## Local development (without Docker)

### Backend

```bash
cd backend
cp .env.example .env
# Set MONGO_URI=mongodb://localhost:27017/gapistan in .env
npm install
npm run dev
```

API runs at http://localhost:3000.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at http://localhost:5173 (Vite default).

### Seed users

```bash
cd backend
MONGO_URI=mongodb://localhost:27017/gapistan npm run seed
```

Or inside Docker:

```bash
docker compose exec backend node ./src/utils/seed.js
```

The seed script skips users that already exist. Edit `backend/src/utils/seed.js` to add more demo accounts.

## End-to-end encryption (E2EE)

### Per-chat toggle

- Open any chat and use the **lock switch** in the header.
- When enabled, an **Encrypted** chip appears next to the chat name.
- **1-to-1 chats:** either participant can toggle.
- **Group chats:** only group admins can toggle.
- Turning E2EE off sends new messages as plaintext; older encrypted messages stay encrypted.

### Global disable (development)

Useful when debugging message flow without crypto:

**Backend** (`backend/.env` or `docker-compose.yml`):

```env
E2EE_ENABLED=false
```

**Frontend** (`frontend/.env` or build args):

```env
VITE_E2EE_ENABLED=false
```

When disabled globally, the per-chat toggle is hidden and all messages are plaintext.

### API

```http
PUT /api/v1/chats/:chatId/e2ee
Authorization: Bearer <token>
Content-Type: application/json

{ "e2eeEnabled": true }
```

## Environment variables

### Backend (`backend/.env`)

| Variable              | Description                                      | Default                          |
|-----------------------|--------------------------------------------------|----------------------------------|
| `PORT`                | HTTP server port                                 | `3000`                           |
| `MONGO_URI`           | MongoDB connection string                        | `mongodb://localhost:27017/gapistan` |
| `JWT_SECRET`          | Secret for JWT signing                           | —                                |
| `ALLOWED_ORIGINS`     | CORS origins (comma-separated)                   | `http://localhost:5173`          |
| `E2EE_ENABLED`        | Global E2EE kill switch                          | `true`                           |
| `E2EE_DEFAULT_ENABLED`| Default E2EE for new chats                       | `true`                           |
| `LIVEKIT_API_KEY`     | LiveKit API key                                  | `devkey` (Docker dev)            |
| `LIVEKIT_API_SECRET`  | LiveKit API secret                               | `secret` (Docker dev)            |
| `MY_EMAIL`            | SMTP sender email                                | —                                |
| `EMAIL_APP_PASS`      | SMTP / app password                              | —                                |

### Frontend (`frontend/.env`)

| Variable                   | Description              | Default                          |
|----------------------------|--------------------------|----------------------------------|
| `VITE_API_URL`             | REST API base URL        | `http://localhost:3000/api/v1`   |
| `VITE_SOCKET_URL`          | Socket.IO server URL     | `http://localhost:3000`          |
| `VITE_FILES_URL`           | Base URL for uploads     | `http://localhost:3000`          |
| `VITE_LIVEKIT_SERVER_URL`  | LiveKit WebSocket URL    | `ws://localhost:7880`            |
| `VITE_E2EE_ENABLED`        | Global E2EE kill switch  | `true`                           |

## Common commands

```bash
# Start stack
docker compose up -d

# Stop stack
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View logs
docker compose logs -f backend

# Seed database
docker compose exec backend node ./src/utils/seed.js

# MongoDB shell
docker compose exec mongo mongosh gapistan
```

## API overview

Base path: `/api/v1`

| Route prefix   | Purpose                          |
|----------------|----------------------------------|
| `/auth`        | Sign up, sign in, OTP, logout    |
| `/chats`       | Chats, messages, groups, uploads |
| `/users`       | Profiles, public keys            |
| `/keys`        | Group AES key distribution       |
| `/livekit`     | Video call tokens                |
| `/reports`     | User reports                     |

WebSocket events include `send-message`, `message-received`, `typing`, `incoming-call`, and `e2ee-updated`.

## Troubleshooting

**Cannot sign in after sign up**

New registrations require OTP verification. Seeded demo users are pre-verified. For manual sign-ups, check MailHog at http://localhost:8025 for the OTP email (when SMTP is configured).

**Encryption errors in chat**

Ensure both users have registered public keys (happens automatically on first login). If E2EE was toggled mid-chat, older messages may show `[Decryption Failed]` — that is expected for mixed encryption states.

**LiveKit calls not connecting**

Confirm LiveKit is running (`docker compose ps`) and `VITE_LIVEKIT_SERVER_URL` matches `ws://localhost:7880`. Docker dev keys must match `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`.

**Frontend cannot reach API**

Check `ALLOWED_ORIGINS` includes your frontend URL (`http://localhost:5173` or `http://localhost:4173`).

## License

ISC
