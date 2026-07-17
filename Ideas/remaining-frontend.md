# Remaining Frontend Work

What's left after the golden-path pass (Welcome → Onboarding → Chat/Preview → Active Workout → Home), the follow-up pass (Login, Progress, Profile, saved-routine detail, exercise-detail sheet, post-workout feedback), and the backend-wiring + chat-intake pass. Cross-referenced against the full design handoff (`AI Fitness Trainer MVP Design-handoff.zip`) and `architecture.md`.

## Built (this pass: backend wiring + chat intake)

- **Onboarding collapsed to Signup + Goal** (`app/onboarding/page.tsx`) — Location, Equipment, Session Duration, and injury checks all moved into the chat conversation per product decision (the old `EquipmentStep` component is deleted). `SignupStep` now really calls `POST /api/auth/register` then `signIn()`; `GoalStep` is a free-text input (goal is no longer a fixed enum).
- **Real chat, not scripted** — `lib/store/chatSlice.ts` consumes the `/api/chat` SSE stream directly (manual `ReadableStream` parsing, since `EventSource` can't POST a body); `lib/conversation-script.ts` and the old mock routine data (`LOWER_BODY_BURNER`/`SWAP_EXERCISE`) are deleted. The feedback page (`app/feedback/page.tsx`) now sends messages through the same chat store/session instead of its own standalone scripted `coachReply()`.
- **Store split into slices** (`lib/store/*Slice.ts`, combined in `lib/store/index.ts`) to keep any one file under the project's 600-line cap, and so every server-fetched entity (profile, routines, stats, chat, workout) has a store action rather than page-local fetch state.
- **Login/logout wired** — `app/login/page.tsx` calls `signIn("credentials", ...)`; `app/profile/page.tsx` logout calls `signOut()`. A shared `useRequireAuth()` hook (`lib/useRequireAuth.ts`) guards every session-gated page.
- **Profile, routine list/detail, workout logging, stats all wired** — `app/profile`, `app/home`, `app/routine/[id]` (replaces the old static `app/routine/push-day`), `app/progress`, and `app/workout/active` all read/write through the store's API-backed actions instead of mock data. `RepsCounter`/`TimedHold` now report what was actually performed so a real `WorkoutLog` can be submitted on completion.
- **Exercise-detail sheet** fetches `GET /api/exercises/:id`; since the exercise table is still empty, this correctly 404s and falls back to the existing local `EXERCISE_DETAILS` content — expected, not a bug.

## Screens & states not yet built

- **Rest-day empty state** — "Rest day — nice." card with "Do a bonus workout anyway" fallback, for days a multi-day split marks as recovery.
- **Exit-confirm modal** — "End workout early?" / "Keep Going" / "End & Save Progress" dialog. Currently the ✕ and ← on the active workout screen navigate straight to `/home` with no confirmation, so in-progress sets are silently discarded.
- **AI-thinking skeleton** — the dedicated shimmering-skeleton loading state for chat (we only built the three-dot typing indicator, which covers the same need more simply — revisit only if a slower/richer loading moment is wanted).
- **Multi-day continuity / day-transition screen** — "7-Day Home Split," day-progress bar, "Day 4 · auto-scaled from your feedback," "Preview Day 4 →." Nothing in the app currently models more than a single day's routine; Home's "DAY 3 OF 7" label is hardcoded copy, not real state.
- **Animated splash + logo-direction exploration** — intentionally excluded (design-exploration artifact, not a finished screen); revisit only if the product wants a real boot animation.

## Wired but non-functional (decorative pending backend)

These render and are reachable, but don't do anything yet — worth tracking so they don't get mistaken for done:

- Profile's settings rows (Equipment & Location, Injuries & Limitations, Units, Notifications) are inert — no detail screens behind them.
- Exercise-detail sheet's "Full Tutorial" tab only swaps a label — there's no real video, quick-loop vs. tutorial content is identical.
- Active-workout "⏸ Pause" button doesn't pause the countdown.
- **Routine generation itself still doesn't exist** — the chat agent now really gathers and persists Location/Equipment/Session Duration/injuries (see Built, above), but there's no Generator/Reviewer loop behind it, so the Preview pane stays in its empty state for the whole conversation; the agent says so explicitly rather than fabricating a routine. Chat-driven routine *edits* (swap, guardrail, finalize) have no routine to act on yet for the same reason.
- Login's "Forgot password?" is decorative (no reset flow).

## Frontend infrastructure from `architecture.md` not started

- **PWA installability** — manifest, install prompt handling.
- **Service worker** (`sw.js`) — cache-first for shell/assets, network-first for data.
- **Local persistence (Dexie/IndexedDB)** — so an active routine/workout survives a refresh or network drop. Right now all state lives in an in-memory Zustand store and resets on reload.
- **Screen Wake Lock API** — keep the screen on during active workout tracking.
- **SSE plumbing on the client** — done for single-turn chat (see Built, above). Still open: once a real Generator/Reviewer loop exists, the client will need to render intermediate reasoning-step events ahead of the final routine, not just one streamed reply.

## Polish / verification gaps

- Desktop layout has only been eyeballed for `/chat`'s side-by-side mode; Home, Progress, Profile, onboarding, active workout, and feedback all use a centered max-width column that hasn't been stress-tested at wide viewports beyond a quick look.
- No systematic keyboard-only (Tab-through) pass across the full app — individual components have aria-labels and semantic elements, but nothing end-to-end.
- No automated test coverage (unit or e2e) anywhere yet.
- **This pass's wiring was verified via `tsc --noEmit`, `pnpm lint`, and `pnpm build` only** — not yet exercised live in a browser (register → onboard → chat intake → workout → stats). Do that pass before considering this done.
