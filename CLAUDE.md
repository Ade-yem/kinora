# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**Frontend**: Fully built. All screens exist (`app/{page,onboarding,chat,workout/active,home,login,progress,profile,routine/push-day,feedback}`), with a Zustand store (`lib/store.ts`) managing in-memory state and a scripted mock chat brain (`lib/conversation-script.ts`). The UI is production-quality but wired to local mock data.

**Backend**: Foundation slice complete (as of this session). Full Prisma schema with Auth.js v4 Credentials + OAuth providers (Google, GitHub), database client, LLM plumbing (DeepSeek OpenAI-compatible), validation schemas, and CRUD API routes for profiles, exercises, routines, and workouts. Exercise table is schema-only (empty until future seeding pass). Generator-Reviewer chat/SSE loop is deferred. See `Ideas/remaining-backend.md` for scope.

The real product is specified in `Ideas/Specification and User Story.txt` (full PRD) and categorized exercises in `Ideas/Categories of exercises.txt`. Read the PRD for context. Project architecture is in `Ideas/architecture.md`, exercise schema details in `Ideas/data.md`.
### Product summary (from the PRD)

An AI fitness trainer app with a **dual-layer interface**: a conversational chat pane plus a **Live Routine Preview Component** that renders the workout as structured UI (not chat text). Key architectural implications for whatever gets built:

- **Bi-directional state sync** — chat-driven changes must mutate the same routine data model the Preview reads, and manual edits in the Preview must be injected back into chat context so the agent stays aware. Whatever state layer is introduced should be designed around this from the start.
- **Safety intake gating** — the agent must not generate a routine until Location, Equipment, and Session Duration are confirmed, and must trigger a clarification loop on any mention of pain/injury before proceeding.
- **Patch-based modification** — chat edits to an existing routine (e.g. "swap the rows") should apply as patches to the Preview's data model, not full regeneration.
- **Multi-day persistence** — program state tracks `program_id`, `current_day_index`, `total_days` so a multi-day routine resumes on return.
- **Post-workout feedback loop** — free-text feedback after a workout should adjust difficulty/volume parameters used when generating subsequent days.

`AI Fitness Trainer MVP Design-handoff.zip` and `exercise_database.ods` at the repo root are design/data source files, not build inputs — nothing currently loads them programmatically.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml` present) — use `pnpm`, not `npm`/`yarn`.

- `pnpm dev` — start the Next.js dev server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`'s core-web-vitals + typescript rulesets)

There is no test runner configured yet.

## Architecture

### Frontend
- **Next.js 16 App Router**, React 19, TypeScript (strict mode), Tailwind CSS v4.
- App code lives under `app/`. Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Tailwind v4 is configured via `@import "tailwindcss"` and `@theme inline` in `app/globals.css` (no `tailwind.config.js` — theme tokens/colors are defined directly in CSS).
- Client state: Zustand store (`lib/store.ts`) — in-memory only, no persistence yet (PWA features, Dexie/IndexedDB deferred).
- Components: `components/{ui,onboarding,chat,workout,home,progress}` — production-quality UI wired to mock data.

### Backend (Foundation slice)
- **Prisma 7** + PostgreSQL with `@prisma/adapter-pg` driver adapter (no Rust engine binary).
- **Schema** (`prisma/schema.prisma`): `User`, `UserProfile`, `Exercise` (empty, no seeding yet), `ChatSession`, `ChatMessage` (schema-ready, no API yet), `WorkoutRoutine`, `RoutineItem`, `WorkoutLog`. Auth.js adapter tables: `Account`, `Session`, `VerificationToken`.
- **Auth** (`lib/auth.ts`, `app/api/auth/*`): NextAuth v4, Credentials provider (register + login via email/password) fully working; Google/GitHub/Apple providers declared but unconfigured (requires real client IDs).
- **Database client** (`lib/db.ts`): Prisma singleton with `PrismaPg` adapter, hot-reload-safe for Next.js dev.
- **LLM plumbing** (`lib/llm.ts`): OpenAI SDK configured for DeepSeek's endpoint; no routes call it yet.
- **API infrastructure**:
  - Error handling (`lib/http/errors.ts`, `lib/http/response.ts`): consistent `{ error: { code, message, details? } }` envelope across all endpoints.
  - Pagination (`lib/api/pagination.ts`): `{ data: T[], pagination: { page, pageSize, totalItems, totalPages } }` for all list endpoints.
  - Validation (`lib/validation/*.ts`): Zod schemas for all input (request bodies, query params) — validated at boundaries only.
  - Mappers (`lib/api/mappers.ts`): DB enum ↔ frontend union conversions (Goal, Location, Equipment); `RoutineStatus` reconciliation (DB agent-lifecycle enum → frontend UI status).
- **CRUD Routes** (`app/api/{auth,profile,exercises,routines,workouts}`):
  - `POST /api/auth/register`: Create user + empty profile in one transaction.
  - `GET/PATCH /api/profile`: Fetch/update user profile with safety-gating fields (goal, location, equipment, session duration, injuries).
  - `GET /api/exercises` + `GET /api/exercises/:id`: Reference data (public, no auth), empty list until seeding.
  - `GET /api/routines` + `GET /api/routines/:id` + `PATCH /api/routines/:id`: List, fetch, finalize routines (authenticated, ownership-checked).
  - `GET/POST /api/workouts` + `GET /api/workouts/:id`: List and log workouts (authenticated, ownership-checked).
- **Deferred**:
  - Chat/agent endpoint (`app/api/chat`): Generator-Reviewer SSE loop, intake gating, function-calling tools.
  - Exercise seeding: `prisma/seed.ts`, spreadsheet parsing, ~3,000-row batch insert (deferred until seeding-focused pass).
  - Frontend wiring: pages still use mock data; integrating them with real API is a follow-up.
  - `middleware.ts`: Skipped to avoid Edge/Node runtime friction with Prisma `pg` adapter; routes do per-route `await auth()` checks instead.

