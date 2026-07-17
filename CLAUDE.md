# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**Frontend**: Fully built and wired to the real backend. All screens exist (`app/{page,onboarding,chat,workout/active,home,login,progress,profile,routine/[id],feedback}`), with a Zustand store split into per-slice files (`lib/store/*Slice.ts`, combined in `lib/store/index.ts`) instead of one monolithic store — each slice owns its own server-fetched state (profile, routines, stats, chat, workout) plus the async actions that fetch/mutate it. The old scripted mock chat brain (`lib/conversation-script.ts`) and mock routine data are gone; chat is now a real SSE-streamed conversation against `app/api/chat`.

**Backend**: Foundation slice plus a chat-intake pass complete (as of this session). Full Prisma schema with Auth.js v4 Credentials + OAuth providers (Google, GitHub), database client, LLM plumbing (DeepSeek OpenAI-compatible), validation schemas, CRUD API routes for profiles, exercises, routines, and workouts, a stats-aggregation endpoint, and a real `app/api/chat` GET/POST endpoint (SSE streaming, function-calling tools for profile intake). `Goal`/`Equipment` are free-text now, not fixed enums (per `Ideas/review.md`). Exercise table is still schema-only (empty until future seeding pass). The Actor-Critic Generator/Reviewer routine-generation loop is still deferred — the chat agent gathers and persists intake data but cannot create a `WorkoutRoutine` yet. See `Ideas/remaining-backend.md` and `Ideas/remaining-frontend.md` for full scope.

### Standing conventions (apply to all future work in this repo)

- **600-line file cap** — no component/page/module file should exceed ~600 lines. Decompose before it does (see `lib/store/`'s per-slice split for the pattern).
- **Zustand-centralized server state** — any data fetched from an API endpoint lives in a Zustand store slice with an async fetch/mutate action; pages call the store action (typically in `useEffect`) and render from store state, not page-local `useState` holding fetched data.

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
- Client state: Zustand store split into slices under `lib/store/` (`onboardingSlice`, `profileSlice`, `chatSlice`, `routinesSlice`, `workoutSlice`, `statsSlice`, `exerciseDetailSlice`, combined in `lib/store/index.ts`) — in-memory only, no persistence yet (PWA features, Dexie/IndexedDB deferred). Every slice that talks to the API does so through `lib/api-client.ts` (`apiGet`/`apiPost`/`apiPatch`, throwing a typed `ApiClientError` on the `{error:{code,message,details}}` envelope) — `chatSlice.sendMessage` is the one exception, since it needs manual SSE stream parsing.
- Session/auth: `next-auth/react`'s `SessionProvider` wraps the app in `app/layout.tsx`; session-gated pages call the shared `useRequireAuth()` hook (`lib/useRequireAuth.ts`), which redirects unauthenticated visitors to `/login`.
- Components: `components/{ui,onboarding,chat,workout,home,progress}` — production-quality UI wired to the real API.

### Backend
- **Prisma 7** + PostgreSQL with `@prisma/adapter-pg` driver adapter (no Rust engine binary). The generator's custom `output` path is `app/generated/prisma` — import the client from `@/app/generated/prisma/client`, not the `@prisma/client` package (that package's default export doesn't exist for a custom output path).
- **Schema** (`prisma/schema.prisma`): `User`, `UserProfile` (`goal`/`equipment` are free-text `String`/`String[]`, not enums — `Location` is still an enum), `Exercise` (empty, no seeding yet), `ChatSession`, `ChatMessage`, `WorkoutRoutine`, `RoutineItem`, `WorkoutLog`. Auth.js adapter tables: `Account`, `Session`, `VerificationToken`.
- **Auth** (`lib/auth.ts`, `app/api/auth/*`): NextAuth v4, Credentials provider (register + login via email/password) fully working; Google/GitHub/Apple providers declared but unconfigured (requires real client IDs).
- **Database client** (`lib/db.ts`): Prisma singleton with `PrismaPg` adapter, hot-reload-safe for Next.js dev.
- **LLM plumbing** (`lib/llm.ts`): OpenAI SDK configured for DeepSeek's endpoint, used by `lib/chat/stream.ts` for the chat endpoint.
- **Chat** (`lib/chat/{session,stream,tools,prompt}.ts`, `app/api/chat/route.ts`): one `ChatSession` per user, reused indefinitely (`resolveChatSession`). `POST /api/chat` streams an SSE response (`delta`/`done`/`error` events) built from `llmClient.chat.completions.create({stream:true, tools:...})`, executing `get_user_profile`/`update_user_profile` tool calls server-side (Prisma direct, not an HTTP round-trip) before continuing the model's turn. `<<GUARDRAIL>>`-prefixed replies map to `ChatMessageKind.GUARDRAIL`. No routine-generation tooling exists yet — see `Ideas/remaining-backend.md`.
- **API infrastructure**:
  - Error handling (`lib/http/errors.ts`, `lib/http/response.ts`): consistent `{ error: { code, message, details? } }` envelope across all endpoints.
  - Pagination (`lib/api/pagination.ts`): `{ data: T[], pagination: { page, pageSize, totalItems, totalPages } }` for all list endpoints.
  - Validation (`lib/validation/*.ts`): Zod schemas for all input (request bodies, query params) — validated at boundaries only.
  - Mappers (`lib/api/mappers.ts`): `Location` DB enum ↔ frontend union conversion, `chatRoleToApi`/`chatMessageKindToApi`; `RoutineStatus` reconciliation (DB agent-lifecycle enum → frontend UI status). Goal/equipment no longer need mapping — they're free text end to end.
- **Routes** (`app/api/{auth,profile,exercises,routines,workouts,chat,stats}`):
  - `POST /api/auth/register`: Create user + empty profile in one transaction.
  - `GET/PATCH /api/profile`: Fetch/update user profile with safety-gating fields (goal, location, equipment, session duration, injuries).
  - `GET /api/exercises` + `GET /api/exercises/:id`: Reference data (public, no auth), empty list until seeding.
  - `GET /api/routines` + `GET /api/routines/:id` + `PATCH /api/routines/:id`: List, fetch, finalize routines (authenticated, ownership-checked). List correctly re-derives pagination totals when filtering by `status` (a derived, non-column value).
  - `GET/POST /api/workouts` + `GET /api/workouts/:id`: List and log workouts (authenticated, ownership-checked).
  - `GET/POST /api/chat`: Resolve-or-create the user's chat session, list history, or send a message and stream back the agent's reply (see Chat, above).
  - `GET /api/stats`: Session-gated aggregation over `WorkoutLog` — streak, weekly volume, a rep-count PR stand-in.
- **Todo**:
  - Actor-Critic Generator/Reviewer routine-generation loop: `GetExercisesByParameters` tool, actual `WorkoutRoutine`/`RoutineItem` creation, Reviewer agent, status transitions beyond intake.
  - Exercise seeding: `prisma/seed.ts`, spreadsheet parsing, ~3,000-row batch insert (deferred until seeding-focused pass).
  - `middleware.ts`: Skipped to avoid Edge/Node runtime friction with Prisma `pg` adapter; routes do per-route `await auth()` checks instead (frontend mirrors this with `useRequireAuth()`).

