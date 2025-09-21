# Litmus AI

## Overview
Litmus AI is a fact-checking assistant that lets users submit claims, runs them through queued AI analysis, and returns credibility insights with supporting context.

## Features
- Authentication via Clerk with email/password sign-in
- Next.js dashboard showing chat history and job status
- Express + BullMQ backend that queues long-running analyses
- AI pipeline integrating Google AI, LangChain, Pinecone, and Exa web search
- Redis-backed worker with monitoring and queue management endpoints
- PostgreSQL persistence via Prisma ORM

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix UI, Clerk SDK, Sonner
- **Backend:** Node.js 20, Express 5, BullMQ, Prisma, Zod, Axios, Morgan, CORS
- **AI & Data Services:** Google AI SDK, Vercel AI (`ai`), LangChain, Pinecone, Exa API, Playwright, Cheerio
- **Infrastructure:** PostgreSQL, Redis, Docker Compose, pnpm workspace tooling

## Getting Started
### Prerequisites
- Node.js 20+
- pnpm 9 (or npm 10)
- Docker Desktop (or Docker Engine) with Compose
- Clerk application set up with email/password authentication enabled (disable OTP)
- API keys for Google AI, Pinecone, and Exa (create accounts on respective dashboards)

### Clone the Repository
```bash
git clone https://github.com/<your-org>/Litmus-AI.git
cd Litmus-AI
```

### Environment Variables
Create the following files before running the stack.

**`backend/.env`**
| Variable | Description | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | Use values from `docker-compose.yml` or your managed DB |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` for local Docker |
| `PORT` | API port | Defaults to 4000 |
| `ALLOWED_ORIGINS` | Comma-separated client origins | e.g. `http://localhost:3000` |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | Clerk Dashboard ? Webhooks |
| `GOOGLE_API_KEY` | Google AI Studio key | Google AI Studio |
| `PINECONE_API_KEY` | Pinecone key | Pinecone Console |
| `EXA_API_KEY` | Exa search API key | Exa Dashboard |
| `WORKER_CONCURRENCY`, `MAX_QUEUE_SIZE`, `JOB_TIMEOUT` | Optional queue tuning | Set if you need overrides |
| `WHATSAPP_*` (optional) | WhatsApp bot credentials | Meta Developer Console |

**`frontend/.env.local`**
| Variable | Description | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL for backend | `http://localhost:4000` locally |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk Dashboard ? API Keys |
| `CLERK_SECRET_KEY` | Server-side Clerk key (for Next.js middleware) | Clerk Dashboard ? API Keys |
| Additional `NEXT_PUBLIC_*` | Any browser-exposed keys | Configure as needed |

### Local Deployment
1. **Start infrastructure**
   ```bash
   docker compose up -d
   ```
2. **Install & migrate backend**
   ```bash
   cd backend
   pnpm install
   pnpm dlx prisma migrate deploy
   pnpm dev
   ```
3. **Install & run frontend** (new terminal)
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
4. Visit `http://localhost:3000` and sign in with a Clerk user (after setting up the webhook below).

5. **Clerk webhook**
   - Clerk Dashboard ? Webhooks ? “Add Endpoint”
   - URL: `http://localhost:4000/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret into `backend/.env` as `CLERK_WEBHOOK_SECRET`

## Project Structure
```
Litmus-AI/
+-- backend/
¦   +-- prisma/            # Prisma schema & migrations
¦   +-- src/
¦   ¦   +-- bots/          # WhatsApp integration
¦   ¦   +-- lib/           # Redis, Pinecone helpers
¦   ¦   +-- routes/        # Express route handlers
¦   ¦   +-- services/      # Queue, AI, scraping services
¦   ¦   +-- workers/       # Background job definitions
¦   ¦   +-- index.ts       # Express entry point
¦   +-- package.json
+-- frontend/
¦   +-- src/
¦   ¦   +-- app/           # Next.js routes
¦   ¦   +-- components/    # UI and sidebar/chat components
¦   ¦   +-- helpers/       # API helpers, configs
¦   ¦   +-- types/         # TypeScript interfaces
¦   +-- package.json
+-- docker-compose.yml
+-- README.md
```

## Development Workflow
1. Create a feature branch: `git checkout -b feat/xyz`
2. Make changes in backend and/or frontend
3. Run lint/tests (`pnpm lint` or custom scripts)
4. Verify queue jobs by running the backend worker and submitting analyses
5. Commit with a descriptive message and open a PR

## Database Operations
- Apply migrations: `pnpm dlx prisma migrate deploy`
- Create new migration: `pnpm dlx prisma migrate dev --name <migration-name>`
- Inspect database: `pnpm dlx prisma studio`
- Reset local DB (dangerous): `pnpm dlx prisma migrate reset`

## Useful Commands
| Area | Command | Description |
| --- | --- | --- |
| Backend | `pnpm dev` | Start Express API + worker via tsx |
| Backend | `pnpm build && pnpm start` | Production build and run |
| Backend | `pnpm run resume-queue` | Resume BullMQ queue if paused |
| Frontend | `pnpm dev` | Next.js dev server |
| Frontend | `pnpm build && pnpm start` | Production build and serve |
| Root | `docker compose up -d` | Start Postgres + Redis |
| Root | `docker compose down` | Stop infrastructure |

## Troubleshooting
- **Webhook 400 errors:** Ensure `CLERK_WEBHOOK_SECRET` matches Clerk’s endpoint secret and that the `Content-Type` header is preserved (`application/clerk+json`).
- **Users not appearing in DB:** Confirm the webhook is active and reachable from Clerk. Check backend logs for verification failures.
- **Queue not processing:** Verify Redis is running and the backend worker started without errors; see `/api/queue/stats`.
- **CORS/401 issues:** Ensure `ALLOWED_ORIGINS` includes the frontend URL and `NEXT_PUBLIC_API_URL` matches the backend host.
- **Database connection failures:** Confirm Docker containers are healthy or update `DATABASE_URL` for managed instances.

## Contributing
1. Fork the repository (or create a branch if you have access).
2. Implement your changes following the development workflow above.
3. Ensure linting and builds pass.
4. Create a pull request describing the change and testing steps.
5. Respond to feedback promptly.

Happy building!