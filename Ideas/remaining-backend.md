# Remaining Backend Work

This document tracks what has been built, what's explicitly deferred, and what open questions remain for the AI Fitness Trainer MVP backend. It mirrors `Ideas/remaining-frontend.md`'s structure and is updated whenever scope shifts during implementation.

## Built (this pass: Foundation Slice)

- **Prisma schema** (`prisma/schema.prisma`) — full data model: `User`, `UserProfile`, `Exercise`, `ChatSession`, `ChatMessage`, `WorkoutRoutine`, `RoutineItem`, `WorkoutLog`, plus Auth.js adapter tables (`Account`, `Session`, `VerificationToken`) and enums (`Goal`, `Location`, `EquipmentOption`, `RoutineStatus`, `ChatRole`, `ChatMessageKind`, `BodyRegion`, `TargetMuscleGroup`, `PrimaryExerciseClassification`).
- **Database client** (`lib/db.ts`) — Prisma singleton using `PrismaPg` adapter.
- **Auth** (`auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/register/route.ts`, `lib/auth/password.ts`) — Credentials provider (register + login via email/password) fully working; Google/Apple providers declared but non-functional (require real client IDs).
- **LLM client plumbing** (`lib/llm.ts`) — configured OpenAI SDK instance pointed at DeepSeek's endpoint; no routes call it yet.
- **Shared API infrastructure** (`lib/http/errors.ts`, `lib/http/response.ts`, `lib/api/pagination.ts`, `lib/api/mappers.ts`, `lib/validation/*.ts`) — consistent error envelope, pagination for list endpoints, enum ↔ frontend-union mapping, Zod validation at boundaries.
- **CRUD routes** (`app/api/profile`, `app/api/exercises`, `app/api/routines`, `app/api/workouts`) — all read/write patterns for logged-in users and reference data, with ownership-checking and partial updates.

## Explicitly deferred

- **Generator-Reviewer chat/SSE agent loop** (`app/api/chat` route, real multi-agent orchestration over DeepSeek-V4-Flash, function-calling tools `GetExercisesByParameters`/`RetrieveUserSafetyProfile`, intake-gating invariants) — entire subsystem deferred to a focused follow-up session.
- **Exercise data ingestion/seeding** (`prisma/seed.ts`, spreadsheet parsing, ~3,000-row batch insert) — deferred; the `Exercise` table stays empty until a future dedicated pass. `GET /api/exercises` correctly returns an empty paginated list.
- **Frontend wiring** (`components/onboarding/SignupStep.tsx`, `app/login/page.tsx`, etc.) — the UI still shows decorative buttons and hardcoded messages; connecting them to the real API endpoints is a separate follow-up.
- **`middleware.ts` centralized route protection** — skipped to avoid Edge/Node runtime friction; route handlers do per-route `await auth()` checks instead.
- **Rate limiting on `/api/auth/register`** — open signup endpoint with no throttling; not addressed this pass due to spam/abuse risk once deployed.
- **Real OAuth credentials** — Google/Apple provider config requires actual `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`/`AUTH_APPLE_ID`/`AUTH_APPLE_SECRET` values; schema and route support exist, but no real credentials configured yet.
- **Multi-day continuity logic** (`programId`, `dayIndex`, `totalDays` on `WorkoutRoutine`) — schema fields exist for future Epic 3.3, but nothing reads/writes them yet; completely unused this pass.

## Open design questions needing sign-off

1. **`WorkoutRoutine.userId` denormalization** — included as a convenience for queries (avoids joining through `ChatSession` every time), but data must always stay consistent with `chatSession.userId`. Currently enforced only by application code; consider whether a hand-written raw-SQL migration trigger is needed, or whether the consistency burden is acceptable.
**No need for sql trigger**

2. **`UserProfile.injuries` shape** — proposed as `{ bodyPart: string; severity?: "mild"|"moderate"|"severe"; note?: string }[]` (JSON array, Zod-validated). This shape is not specified anywhere in `Ideas/architecture.md` or the PRD; it's a proposal for how the Reviewer agent's `RetrieveUserSafetyProfile` tool would later consume injury constraints. Needs product sign-off.

3. **`RoutineStatus` reconciliation rule** — the DB stores an agent-lifecycle enum (`PENDING_GENERATION|PENDING_REVIEW|REJECTED|APPROVED`), but the frontend expects `"empty"|"forming"|"ready"|"finalized"`. The reconciliation rule (e.g. "zero items + any lifecycle status = empty") is documented in `lib/api/mappers.ts` once only. Confirm this mapping is the right one.
**These states in between the agents when they are reviewing each other should only be mentioned as reviewing state for the user not. The user does not care too much about the internal state of things. He just wants to know that you are working and he gets the result - There should be some clues though with animations so that it will not be too bland**

4. **`GET /api/exercises*` auth requirement** — currently public (no auth check), treating exercise data as reference data anyone can access. Confirm this is desired vs. requiring login for consistency.
**Open - We got it for free, we are sharing it for free**

5. **`finalizedAt` vs. inferring finalization from WorkoutLog** — the schema adds an explicit `finalizedAt DateTime?` column to distinguish "ready" (approved, not finalized) from "finalized" (approved + user locked it in). Alternative considered: infer "finalized" from the existence of any `WorkoutLog` referencing the routine. The `finalizedAt` approach was chosen because finalization (locking the routine state) should happen at tap-time before any workout is logged, per PRD 3.1. Confirm this is the right invariant.
**confirmed**
## Wired but not yet implemented

These are schema-ready (tables exist) but have zero API surface this pass, waiting for the deferred chat/agent session:

- `ChatSession` / `ChatMessage` — tables exist, no `app/api/chat*` routes yet.
- Agent lifecycle (`RoutineStatus` enum values `PENDING_GENERATION|PENDING_REVIEW|REJECTED`) — no endpoint writes these states yet (agent loop is deferred).
- `WorkoutRoutine.reviewNotes` — Reviewer feedback column exists but nothing populates it yet.
- `RoutineItem` full mutation via API — only readable via `GET /api/routines/:id`; no PATCH per-item or reordering endpoint yet.

## Infrastructure gaps

- **PWA installability** — manifest, install prompt handling (frontend only, not backend).
- **Service worker** (`sw.js`) — cache-first for assets, network-first for data (frontend only).
- **Local persistence (Dexie/IndexedDB)** — client-side only; backend doesn't need to know.
- **Screen Wake Lock API** — client-side only (during active workout tracking).
- **SSE plumbing on the client** — currently scripted client-side; once the real chat endpoint exists, `lib/store.ts`'s `sendMessage` needs to switch from the local script to consuming an SSE stream (Generator reasoning → Reviewer reasoning → final Routine).

## Polish / verification gaps

- No automated test coverage (unit or e2e) yet for the backend API routes — all verification so far is manual (`curl`, Prisma Studio).
- No systematic auth flow verification (full register → login → API call → logout cycle).
- Error handling for edge cases (e.g. trying to finalize a routine that's not APPROVED, trying to log a workout for someone else's routine) exists at the code level but hasn't been end-to-end tested.

## Next pass checklist (deferred)

- [ ] Exercise data ingestion: parse `.ods`, validate against `Ideas/data.md` schema, batch-insert ~3,000 rows via `prisma/seed.ts`.
- [ ] Frontend wiring: wire SignupStep/Login/Profile/Routines/Workouts pages to real API endpoints.
- [ ] Generator-Reviewer chat loop: `app/api/chat` SSE endpoint, multi-agent orchestration, function-calling tool implementations, intake-gating logic.
- [ ] `middleware.ts` with split `auth.config.ts`/`auth.ts` for centralized route protection (if desired).
- [ ] Rate limiting on `/api/auth/register` (e.g. via `express-rate-limit` or Upstash).
- [ ] Real OAuth provider credentials (Google).
- [ ] Multi-day continuity logic (read/write `programId`, auto-increment `dayIndex`, handle day transitions).
