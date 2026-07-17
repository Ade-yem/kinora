# Remaining Backend Work

This document tracks what has been built, what's explicitly deferred, and what open questions remain for the AI Fitness Trainer MVP backend. It mirrors `Ideas/remaining-frontend.md`'s structure and is updated whenever scope shifts during implementation.

## Built (this pass: Foundation Slice)

- **Prisma schema** (`prisma/schema.prisma`) — full data model: `User`, `UserProfile`, `Exercise`, `ChatSession`, `ChatMessage`, `WorkoutRoutine`, `RoutineItem`, `WorkoutLog`, plus Auth.js adapter tables (`Account`, `Session`, `VerificationToken`) and enums (`Location`, `RoutineStatus`, `ChatRole`, `ChatMessageKind`, `BodyRegion`, `TargetMuscleGroup`, `PrimaryExerciseClassification`).
- **Database client** (`lib/db.ts`) — Prisma singleton using `PrismaPg` adapter.
- **Auth** (`auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/register/route.ts`, `lib/auth/password.ts`) — Credentials provider (register + login via email/password) fully working; Google/Apple providers declared but non-functional (require real client IDs).
- **LLM client plumbing** (`lib/llm.ts`) — configured OpenAI SDK instance pointed at DeepSeek's endpoint.
- **Shared API infrastructure** (`lib/http/errors.ts`, `lib/http/response.ts`, `lib/api/pagination.ts`, `lib/api/mappers.ts`, `lib/validation/*.ts`) — consistent error envelope, pagination for list endpoints, enum ↔ frontend-union mapping, Zod validation at boundaries.
- **CRUD routes** (`app/api/profile`, `app/api/exercises`, `app/api/routines`, `app/api/workouts`) — all read/write patterns for logged-in users and reference data, with ownership-checking and partial updates.

### Built (this pass: chat intake + wiring)

- **`Goal`/`Equipment` migrated off fixed enums to free text** (per `Ideas/review.md`) — `UserProfile.goal` is now `String?`, `UserProfile.equipment` is `String[]`. `Location` remains an enum. `ProfileUpdateSchema`, `lib/api/mappers.ts`, and `lib/types.ts` updated accordingly; onboarding's Goal step is now a free-text input and equipment/location collection moved into chat (see below).
- **`app/api/chat` GET/POST** (`lib/chat/session.ts`, `lib/chat/stream.ts`, `lib/chat/tools.ts`, `lib/chat/prompt.ts`) — a real, LLM-backed, SSE-streaming chat endpoint. One `ChatSession` per user, reused indefinitely. `POST` streams the assistant's reply token-by-token over SSE (`delta`/`done`/`error` events), persists both the user's message and the final assistant message as `ChatMessage` rows. The agent conversationally gathers Goal, Location, Equipment, and Session Duration, and checks for injuries — the PRD's full intake-gating flow — using two function-calling tools (`get_user_profile`, `update_user_profile`) that read/write `UserProfile` directly. Injury/pain mentions and emergency-sounding language get a `<<GUARDRAIL>>`-marked reply (mapped to `ChatMessageKind.GUARDRAIL`). **This is single-turn tool-calling intake, not the Actor-Critic Generator/Reviewer loop** — see "Explicitly deferred" below for what that still excludes.
- **`GET /api/stats`** (`app/api/stats/route.ts`) — session-gated aggregation endpoint over `WorkoutLog`: streak (consecutive-day walk), weekly volume (day-of-week bucketed `totalVolumeKg`), and a "most reps in a single set from the most recent log" PR stand-in (no weight is captured yet, so a true weight PR isn't computable). Powers Progress and Home's streak banner.
- **`/api/routines` pagination bug fixed** — when a `status` filter was passed, `skip`/`take` were applied at the Prisma level *before* the JS-side derived-status filter, giving wrong page contents and wrong `totalItems`/`totalPages`. Now: filtering by status fetches all rows, filters, then paginates the filtered set.
- **`dayIndex`/`totalDays` now selected and returned** by `GET /api/routines` and `GET /api/routines/:id` (columns existed on `WorkoutRoutine` but were unselected).
- **Frontend fully wired to the above** — see `Ideas/remaining-frontend.md` for the frontend-side detail.

## Todo

- **Actor-Critic Generator/Reviewer routine-generation loop** — `GetExercisesByParameters` tool, actual `WorkoutRoutine`/`RoutineItem` creation, the Reviewer agent, and `PENDING_REVIEW`/`REJECTED`/`APPROVED` status transitions are all still unimplemented. The chat agent can gather and persist intake data (see above) but explicitly tells the user routine-building isn't available yet — there remains **no way to create a `WorkoutRoutine` via the API**, chat-driven or otherwise.
- **Exercise data ingestion/seeding** (`scripts/seed-exercises.ts`, spreadsheet parsing, ~3,000-row batch insert) — deferred; the `Exercise` table stays empty until a future dedicated pass. `GET /api/exercises` correctly returns an empty paginated list, and real exercise-id lookups (e.g. from chat's exercise-detail sheet) correctly 404. - **Seeding has been completed, refer to `scripts/seed-exercises.ts`**
- **`middleware.ts` centralized route protection** — skipped to avoid Edge/Node runtime friction; route handlers do per-route `await auth()` checks (frontend pages use a shared `useRequireAuth()` hook wrapping `useSession({required:true})` instead).
- **Rate limiting on `/api/auth/register`** — open signup endpoint with no throttling; not addressed this pass due to spam/abuse risk once deployed.
- **Real OAuth credentials** — Google/Apple provider config requires actual `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`/`AUTH_APPLE_ID`/`AUTH_APPLE_SECRET` values; schema and route support exist, but no real credentials configured yet.
- **Multi-day continuity writes** (`programId`, `dayIndex`, `totalDays` on `WorkoutRoutine`) — these columns are now read and rendered (Home's day-index label), but nothing writes them yet; unused until the generation loop exists.

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

These are schema-ready (tables exist) but still have no API surface, waiting for the deferred generation-loop session:

- Agent lifecycle (`RoutineStatus` enum values `PENDING_GENERATION|PENDING_REVIEW|REJECTED`) — no endpoint writes these states yet (generation loop is deferred). `ChatSession`/`ChatMessage` themselves are now fully wired (see Built, above).
- `WorkoutRoutine.reviewNotes` — Reviewer feedback column exists but nothing populates it yet.
- `RoutineItem` full mutation via API — only readable via `GET /api/routines/:id`; no PATCH per-item or reordering endpoint yet.

## Infrastructure gaps

- **PWA installability** — manifest, install prompt handling (frontend only, not backend).
- **Service worker** (`sw.js`) — cache-first for assets, network-first for data (frontend only).
- **Local persistence (Dexie/IndexedDB)** — client-side only; backend doesn't need to know.
- **Screen Wake Lock API** — client-side only (during active workout tracking).
- **SSE plumbing on the client** — done for single-turn chat (`lib/store/chatSlice.ts` parses the `/api/chat` SSE stream directly). Still open: once a real generation loop exists, the stream format will need additional event types for Generator/Reviewer reasoning steps ahead of the final routine.

## Polish / verification gaps

- No automated test coverage (unit or e2e) yet for the backend API routes — all verification so far is manual (`curl`, Prisma Studio, `pnpm build`/`tsc`/`lint`).
- No systematic auth flow verification (full register → login → API call → logout cycle) has been run end-to-end this pass — build/typecheck/lint are clean, but the actual chat/register/login flow hasn't been exercised live yet.
- Error handling for edge cases (e.g. trying to finalize a routine that's not APPROVED, trying to log a workout for someone else's routine) exists at the code level but hasn't been end-to-end tested.
- **Found and fixed while verifying this pass**: `lib/db.ts` imported `PrismaClient` from the `@prisma/client` package, but the schema's custom generator `output` (`app/generated/prisma`) means the real client lives there instead — every API route 500'd until the import was corrected to `@/app/generated/prisma/client`. This predates this pass's changes; worth double-checking after any future `prisma generate` or generator-config change.

## Next pass checklist (deferred)

- [ ] Exercise data ingestion: parse `.ods`, validate against `Ideas/data.md` schema, batch-insert ~3,000 rows via `prisma/seed.ts`.
- [ ] Actor-Critic Generator/Reviewer routine-generation loop: `GetExercisesByParameters` tool, actual `WorkoutRoutine`/`RoutineItem` creation, Reviewer agent, `PENDING_REVIEW`/`REJECTED`/`APPROVED` transitions.
- [ ] `middleware.ts` with split `auth.config.ts`/`auth.ts` for centralized route protection (if desired).
- [ ] Rate limiting on `/api/auth/register` (e.g. via `express-rate-limit` or Upstash).
- [ ] Real OAuth provider credentials (Google).
- [ ] Multi-day continuity writes (auto-increment `dayIndex`, handle day transitions) — reads are wired.
- [ ] Live end-to-end verification of the new chat/auth flow (this pass verified via typecheck/lint/build only).
