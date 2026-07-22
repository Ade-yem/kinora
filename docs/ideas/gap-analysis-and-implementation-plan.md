# Gap Analysis & Implementation Plan

Date: 2026-07-18
Scope: consolidates the July 18 design/PRD review with a live re-check of navigation, and lays out a concrete plan for everything currently known to be missing or broken — the five items requested this session (logo system, splash screen, PWA, navigation fix, feedback-to-chat migration) plus the backlog carried over from the earlier review (exit-confirm modal, rest-day state, day-transition screen, profile settings sub-screens, pause button, password reset, test coverage). Every item below is now a phase with concrete steps, not just a list.

---

## Product details to update 
- Product name: `Kinora`
- Product tag line: `The Coach That Evolves With You.`

## 1. What's actually not built or not working

### 1.1 New findings this session

| Area | Finding |
|---|---|
| **Navigation — Chat page** | `app/chat/page.tsx` has no link back to Home/Progress/Profile anywhere. The header only has a hamburger (mobile-only, opens the sessions drawer) and the session title. The sessions drawer (`ChatSessionsDrawer.tsx`) only lists chat sessions — no Home link inside it either. On desktop, the drawer replaces the hamburger but still has no way out. Once a user is in `/chat`, the only way back is the browser back button. |
| **Navigation — Profile page** | `app/profile/page.tsx` has no `BottomNav`, no back arrow, no link anywhere except "Log out." It's a dead end once you land on it from Home's avatar icon. |
| **Navigation — inconsistent overall** | `components/ui/BottomNav.tsx` exists and works, but is only mounted on `/home` and `/progress`. Chat and Profile — two of the app's primary destinations — don't have it or any equivalent. |
| **Logo** | Only one hardcoded `⚡` emoji is used as the logo mark, in exactly two places (`app/page.tsx`, `app/chat/page.tsx`). None of the three logo directions from the design (`AI Fitness App.dc.html` §2: Pulse Bubble / Rep Loop / Signal Bars) exist as real assets or components. There's no user preference for it anywhere in the schema or store. |
| **Splash screen** | Does not exist. `app/page.tsx` is the static "Get Started" welcome screen from the design — a different artifact from the *animated* boot splash (dark background, pulsing icon, letter-by-letter "RepRally," progress bar, "warming up your coach…") which was explicitly called out in `remaining-frontend.md` as excluded and has never been built. |
| **PWA** | No `app/manifest.ts`, no `public/sw.js`, no icon assets beyond the default Next.js starter SVGs, no service worker registration, no `viewport`/`theme-color` metadata. App is not installable. |
| **Feedback page** | `app/feedback/page.tsx` duplicates the chat UI (its own `ChatThread`/`ChatInput`, its own `initChat()` call with no session scoping) instead of reusing the real chat session. It's reachable only from `CompletionCelebration`'s "Tell Coach How It Felt" button. No other file references `/feedback` — safe to delete cleanly. |

### 1.2 Carried over from the July 18 review (re-verified, still true)

- **Exit-confirm modal missing** on active workout — `ExerciseHeader`'s back chevron calls `router.back()` directly; no "End workout early? Progress will be saved" dialog exists anywhere in the codebase.
- **Rest-day empty state missing** — no "Rest day — nice." screen or logic (`grep` for `rest.?day` returns nothing).
- **Day-transition / multi-day continuity screen missing** — the backend now genuinely tracks `programId`/`dayIndex`/`totalDays` (this part of the July 18 review turned out to be more built than the stale docs claimed), but no UI reads that state as a "your next day is ready" flow. `CompletionCelebration` doesn't know if the finished routine was part of a multi-day program.
- **Profile settings rows are dead** — "Equipment & Location," "Injuries & Limitations," "Units (kg / lb)," "Notifications" render but have no `onClick`/navigation.
- **Pause button decorative** on `TimedHold.tsx` — no handler, countdown keeps running.
- **"Forgot password?"** on login is decorative.
- **No automated tests** anywhere (no `*.test.ts`, no test runner configured). `scripts/test-generation.ts` is a manual smoke script, not a test suite.
- ~~Exercise seeding not run~~ — confirmed done; removed from the backlog.

---

## 2. Implementation Plan

Twelve phases, A-L. A-E were requested explicitly this session; F-L fold in the rest of §1.2's backlog at the same level of detail. Ordering/dependencies are called out per phase and summarized in §3.

### Phase A — Global navigation fix

**Goal:** every primary screen has a consistent, obvious way to move between Home / Chat / Progress / Profile; every stacked/detail screen has a clear way back.

1. **Extend `BottomNav`** (`components/ui/BottomNav.tsx`): add a fourth `"profile"` entry (`👤` icon, `/profile`) to the `ITEMS` array and the `NavKey` union.
2. **Mount `BottomNav` on `/profile`** (`app/profile/page.tsx`) with `active="profile"`, same pattern as `app/progress/page.tsx:55`.
3. **Chat page gets an explicit way out.** Chat's layout is intentionally immersive (dual-pane chat + preview) and a full bottom tab bar would compete with the pinned `ChatInput` and the docked preview sheet, so don't force `BottomNav` in there. Instead, add a small Home icon-button into the header row next to the hamburger/session title in `app/chat/page.tsx` (~line 95-109), linking to `/home`. This mirrors how `/workout/[id]` already solves the same problem with its `←` button (`app/workout/[id]/page.tsx:68`).
4. **Active workout stays immersive** (this is correct per the PRD's "distraction-free tracking" requirement) — but pair `ExerciseHeader`'s back chevron with the exit-confirm modal from Phase 2 rather than leaving it as a silent `router.back()`. Not required for this pass, flagged here so it isn't re-broken.
5. **Standardize the rule going forward:** every page reachable from more than one place gets `BottomNav`; every page reached by drilling into something (routine detail, exercise detail sheet) gets a `←` back button; only onboarding/login (strictly linear) get neither.

Files touched: `components/ui/BottomNav.tsx`, `app/profile/page.tsx`, `app/chat/page.tsx`.

---

### Phase B — Logo system (3 selectable variants)

**Goal:** all three design directions exist as real, crisp, resizable components; users can pick one; the choice applies everywhere the mark is shown.

1. **Build `components/ui/Logo.tsx`** — an SVG-based component (not the current `⚡` emoji box) with `variant: "pulse-bubble" | "rep-loop" | "signal-bars"` and a `size` prop. Recreate each mark from the design's own shapes (not screenshots):
   - `pulse-bubble` (2a): rounded-square tile, volt→coral diagonal gradient, the clip-path heartbeat/chat-tail glyph + trailing dot from `AI Fitness App.dc.html:49-52`.
   - `rep-loop` (2b): dark tile, open ring (rotated border trick) + coral accent dot, from lines 59-62.
   - `signal-bars` (2c): cream tile with border, four bars (coral/ink/volt/faint-ink) from lines 69-74.
2. **Schema:** add `UserProfile.logoStyle String @default("pulse-bubble")` to `prisma/schema.prisma` (same pattern as the existing `unitsPreference` field), migrate with `pnpm prisma migrate dev --name add_logo_style_preference`.
3. **Validation/API:** add `logoStyle: z.enum(["pulse-bubble", "rep-loop", "signal-bars"]).optional()` to `lib/validation/profile.ts`'s `ProfileUpdateSchema`; it flows through the existing `PATCH /api/profile` route and `profileSlice.updateProfile()` with no new endpoint needed.
4. **Pre-auth availability:** the welcome screen (`app/page.tsx`) and the splash screen (Phase C) render before any authenticated API call can resolve a preference, so the source of truth for *rendering* is `localStorage` (`reprally:logoStyle`), written whenever `profileSlice.fetchProfile()`/`updateProfile()` resolves a value, and read synchronously (via a tiny hook, e.g. `useLogoStyle()`) wherever `Logo` is rendered. This keeps it instant and avoids a flash of the wrong icon; logged-in changes still round-trip through the server so the choice follows the account across devices.
5. **New Profile settings section:** add an "App Icon" row to `app/profile/page.tsx` (alongside — not replacing — the existing dead settings rows) that shows all three `Logo` swatches; tapping one calls `updateProfile({ logoStyle })`.
6. **Swap every hardcoded `⚡`** for `<Logo variant={logoStyle} />`: `app/page.tsx:12`, `app/chat/page.tsx:103-105`, plus the new splash screen from Phase C.

Files touched: `components/ui/Logo.tsx` (new), `prisma/schema.prisma` + migration, `lib/validation/profile.ts`, `app/profile/page.tsx`, `app/page.tsx`, `app/chat/page.tsx`, a small `lib/useLogoStyle.ts` hook (new).

---

### Phase C — Animated splash screen

**Goal:** the boot animation from the design (`AI Fitness App.dc.html:80-109`) actually plays, using whichever logo the user has picked.

1. **Build `components/SplashScreen.tsx`** (client component): fixed full-screen overlay, dark background (`oklch(0.16 0.02 60)`), renders `<Logo variant={logoStyle} size="lg" />` with the design's `splashIconIn`/`splashIconPulse` keyframes, "RepRally" lettered fade-in, "warming up your coach…" subtext, and the progress-bar fill animation — ported directly from the CSS keyframes already fully spelled out in the design file (`splashIconIn`, `splashIconPulse`, `splashFadeUp`, `splashBarFill`).
2. **Mount it in `app/layout.tsx`** as a sibling of `{children}`, controlled by local state: visible on first client mount, auto-dismisses after a minimum ~1.8s **or** once fonts + (if a session cookie exists) the initial `/api/auth/session` check resolve — whichever is later. This makes it a real loading gate, not just decoration.
3. **Show once per app load**, not on every client-side route change — guard with a module-level flag (or `sessionStorage.getItem("splash_shown")`) so navigating between `/home` → `/chat` doesn't replay it.
4. **Respect `prefers-reduced-motion`**: skip straight to a static (non-animated) 400ms flash instead of the full sequence.

Files touched: `components/SplashScreen.tsx` (new), `app/layout.tsx`.

Depends on Phase B (`Logo` component + `useLogoStyle`).

---

### Phase D — PWA configuration

**Goal:** the app is installable, has a real manifest and icon set, and works offline for the static shell.

1. **`app/manifest.ts`** (Next.js native metadata route): `name: "RepRally"`, `short_name: "RepRally"`, `start_url: "/"`, `display: "standalone"`, `background_color`/`theme_color` matching the cream/ink tokens in `globals.css`, `icons: [...]`.
2. **Icon assets:** generate 192×192, 512×512, and a 512×512 maskable PNG from the **default** logo mark (Pulse Bubble — the design doc itself calls this "the lead option," line 42) into `public/icons/`. This is the one part of this plan that needs an actual raster-export step (e.g. a small `sharp`-based Node script that rasterizes the `Logo` SVG markup at build time, or a one-time manual export) — it can't be done by writing app code alone.
3. **`public/sw.js`** — a minimal hand-written service worker (no third-party plugin; `next-pwa`-style packages have inconsistent support for Next 16 + Turbopack, not worth the dependency risk): cache-first for `_next/static/*` and `/icons/*`, network-first-with-cache-fallback for navigations and `/api/*`, and a standard `activate` handler that purges old cache versions.
4. **`components/pwa/ServiceWorkerRegistration.tsx`** — client component, registers `/sw.js` in a `useEffect` guarded by `'serviceWorker' in navigator`, mounted once in `app/layout.tsx`.
5. **Metadata/viewport:** add a `viewport` export to `app/layout.tsx` with `themeColor` and `viewportFit: "cover"` (for iOS notch safety in standalone mode), and `icons`/`appleWebApp` fields on the existing `metadata` export.

**Known limitation to flag explicitly:** the OS home-screen icon (from the manifest) is fixed at install time and can't dynamically follow the in-app logo preference — that's a platform constraint, not a scoping shortcut. The in-app logo (header, splash, welcome screen) fully respects the user's choice; only the installed-icon-on-your-phone's-home-screen stays fixed to the default. Worth saying out loud to the user rather than discovering it after install.

Files touched: `app/manifest.ts` (new), `public/icons/*` (new), `public/sw.js` (new), `components/pwa/ServiceWorkerRegistration.tsx` (new), `app/layout.tsx`.

Depends on Phase B (default icon needs the `Logo` component to exist first) and benefits from Phase C being done (splash + PWA install feel like one cohesive "app boot" moment).

---

### Phase E — Feedback flow → chat draft prefill (delete the feedback page)

**Goal:** "Tell Coach How It Felt" drops the user into the real chat with an editable draft message already in the input, instead of a separate scripted feedback screen.

1. **Delete `app/feedback/page.tsx`.** Confirmed via grep: no other file links to `/feedback`, so this is a clean removal.
2. **`components/chat/ChatInput.tsx`:** accept an optional `initialValue?: string` prop. On mount (or when the prop changes while the field is still empty), seed local `value` state from it and focus the textarea — fully editable, never auto-sent.
3. **`app/chat/page.tsx`:** extend the existing query-param handling (it already does exactly this for `sessionId`, lines 40-58) to also read a `draft` param, pass it to `<ChatInput initialValue={draft} onSend={sendMessage} />`, and strip it from the URL via the same `router.replace("/chat")` cleanup already in place.
4. **`components/workout/CompletionCelebration.tsx`:** change the "Tell Coach How It Felt" button (currently `href="/chat"`, line 83) to `href={\`/chat?sessionId=${routine.chatSessionId}&draft=${encodeURIComponent(draftText)}\`}`, where `draftText` is generated from the just-finished routine, e.g. `"Just finished ${routine.title}. Here's how it felt: "` — an incomplete sentence the user finishes before sending. Passing `sessionId` alongside fixes the session-scoping gap flagged in the July 18 review (feedback landing in the wrong chat session).
5. **Stretch:** the three quick-reply chips ("Too easy" / "Just right" / "Too hard") from the old feedback page are otherwise lost. Render them as one-tap suggestion chips above `ChatInput` specifically when a `draft` param is present, each appending its text to the draft rather than sending immediately.

Files touched: `app/feedback/page.tsx` (deleted), `components/chat/ChatInput.tsx`, `app/chat/page.tsx`, `components/workout/CompletionCelebration.tsx`.

Independent of Phases A-D — can be built in parallel by someone else. **Decided:** quick-reply chips (step 5) are kept, and only rendered when the user is actually in a feedback-draft flow (i.e. `draft` param present and originating from `CompletionCelebration`) — not on every chat visit.

---

### Phase F — Exit-confirm modal on active workout

**Goal:** leaving an in-progress workout via the back chevron or a close button asks first, instead of silently discarding progress.

1. **Build `components/workout/ExitConfirmModal.tsx`** — no generic `Modal` primitive exists yet in `components/ui/`, so this is the first one; keep it purpose-built rather than over-abstracting for a single use. Centered card over a dimmed/blurred backdrop, matching the design (`AI Fitness App.dc.html:709-717`): "End workout early?", "You've done X of Y exercises. Progress will be saved.", primary "Keep Going" button, secondary "End & Save Progress" button.
2. **Wire it into `components/workout/ExerciseHeader.tsx`** (currently line 18: back chevron calls `router.back()` directly). Replace with local `isConfirmOpen` state; the chevron opens the modal instead of navigating immediately. "Keep Going" closes it; "End & Save Progress" calls `router.push("/home")`.
3. **"Save progress" needs something to actually save.** Right now `submitWorkout()` (`lib/store/workoutSlice.ts:96-125`) only fires when `workout.phase === "complete"` (i.e., every set of every exercise is done) — there's no partial-completion save path. Add a `saveProgress: () => Promise<void>` action to `workoutSlice.ts` that POSTs the same `/api/workouts` payload but with whatever's in `workout.entries` so far (the backend route already accepts arbitrary `entries`; no API change needed, just calling it earlier with partial data). Call this from the modal's "End & Save Progress" button before navigating home.
4. Also add a close (`✕`) affordance next to the back chevron in `ExerciseHeader.tsx`, matching the design's two-icon header (`←` and `✕`) — both open the same confirm modal.

Files touched: `components/workout/ExitConfirmModal.tsx` (new), `components/workout/ExerciseHeader.tsx`, `lib/store/workoutSlice.ts`.

No dependency on A-E — can be built any time.

---

### Phase G — Rest-day empty state

**Goal:** a day in a multi-day program with no exercises renders as "Rest day — nice." instead of an empty or broken workout card.

1. **The concept doesn't exist server-side today.** `GENERATOR_SYSTEM_PROMPT` (`lib/chat/generator.ts:144-176`) never tells the LLM it's allowed to emit a zero-exercise day. Extend rule 5 to explicitly permit a day object with `"exercises": []` and a `title`/`subtitle` like `"Rest Day"` / `"Recovery — nice work this week"` when the user's requested split logically includes recovery days (e.g. a 7-day split shouldn't train 7/7 days hard). `saveRoutineToDb()` (`lib/chat/generator.ts:373-489`) already handles an empty `exercises` array without changes — the `for` loop over `rData.exercises` simply does zero iterations, so the `WorkoutRoutine` row is created with no `RoutineItem` children.
2. **Client-side, treat `exercises.length === 0` on a `"ready"`/`"finalized"` routine as a rest day** — this needs no schema change since `Routine.exercises` is already on the type.
3. **`components/home/TodayWorkoutCard.tsx`**: add a branch between the existing `empty` check (line 11) and the normal card (line 32) — when `routine.status !== "empty" && routine.exercises.length === 0`, render the rest-day card from the design (`AI Fitness App.dc.html:685-690`): "🌿 Rest day — nice.", "Day N of your split is a scheduled recovery day", and a "Do a bonus workout anyway" button.
4. **"Do a bonus workout anyway" reuses Phase E's draft-prefill mechanism** — link to `/chat?draft=${encodeURIComponent("Today's a rest day but I want to train anyway — give me a light bonus workout")}` rather than building a separate flow.
5. Apply the same `exercises.length === 0` check anywhere else a routine card renders a day (e.g. the multi-day tab selector in `RoutinePreviewSheet.tsx`) so a rest day gets a distinct "rest" tab style instead of looking like an empty/broken day (the design's dashed-border "D6 rest" tab, `AI Fitness App.dc.html:756`).

Files touched: `lib/chat/generator.ts` (prompt only), `components/home/TodayWorkoutCard.tsx`, `components/chat/RoutinePreviewSheet.tsx`.

Depends on Phase E for the "bonus workout" link (or ship without it and hardcode a plain link to `/chat` first, upgrade later).

---

### Phase H — Day-transition / multi-day continuity screen

**Goal:** opening the app on day N of a program you're partway through shows day N's routine, not always the same fixed routine — and gives you a "your next day is ready" moment matching the design (`AI Fitness App.dc.html:550-570`).

This is the most involved backlog item because the "which day am I on" query doesn't exist anywhere yet.

1. **`GET /api/routines` doesn't expose `programId` today** — `ROUTINE_SUMMARY_SELECT` (`app/api/routines/route.ts:27-37`) and `RoutineSummary` (lines 17-25) select/return `dayIndex`/`totalDays` but not `programId`. Add it — cheap, same pattern as the existing fields.
2. **Add a "current day in program" resolver.** The cleanest home for this is a small addition to `routinesSlice.ts`: a `fetchCurrentProgramDay(programId)` action that fetches all routines for that `programId` (reuse the existing `chatSessionId`-filtered query pattern in `fetchSessionRoutine`, but filter by `programId` instead — needs a matching `programId` query param added to `RoutineListQuerySchema` in `lib/validation/routine.ts` and the `where` clause in `app/api/routines/route.ts:79-82`), cross-references against `WorkoutLog` to find the first day with no log, and calls `fetchRoutineById` on it. Simplest correctness check for "has this day been logged": add `logged: boolean` to `RoutineSummary`/`ROUTINE_SUMMARY_SELECT` via a `logs: { select: { id: true }, take: 1 }` include, mapped to `logs.length > 0`.
3. **Wire it into `/home`.** Today `app/home/page.tsx` calls `fetchLatestRoutine()`, which just grabs whichever routine row is most recently `updatedAt` — fine for single-day routines but wrong for "day 3 of 7, day 1-2 already logged." Change Home's effect to: fetch the latest routine as today, and if it has a `programId` and `totalDays > 1`, call `fetchCurrentProgramDay(programId)` instead to land on the correct unfinished day.
4. **Build the day-transition card** as a variant surfaced on `/home` (not a separate route — the design's mockup is really "Home, but for a program mid-stream") — reuse `TodayWorkoutCard.tsx`'s dark card styling, add the day-progress bar (`AI Fitness App.dc.html:554-562`, one segment per day, volt for completed, coral for today, faint for future/rest) and, when the previous day's `WorkoutLog` feedback triggered a `modify_workout_routine` adjustment, a small "🛠️ Overhead volume trimmed −20%" note — this data isn't tracked anywhere yet, so either surface `routine.subtitle` if the Generator already writes an adjustment summary there, or skip the note for v1 and just show the day-progress bar + title (cut this specific sub-feature if it's not worth the added Generator-prompt complexity).
5. Once a program is fully completed (every day logged), fall back to the existing "No routine yet" / start-a-new-chat empty state.

Files touched: `app/api/routines/route.ts`, `lib/validation/routine.ts`, `lib/store/routinesSlice.ts`, `app/home/page.tsx`, `components/home/TodayWorkoutCard.tsx`.

No hard dependency on other phases, but do it after Phase G since both touch `TodayWorkoutCard.tsx` and the multi-day tab selector — easier to land as one coherent pass over "what does a day in a program render as" than two separate diffs.

---

### Phase I — Profile settings sub-screens

**Goal:** the four dead rows on `/profile` ("Equipment & Location," "Injuries & Limitations," "Units (kg / lb)," "Notifications") actually do something.

1. **Equipment & Location** — the data already lives on `UserProfile` (`location`, `equipment`) and is fully wired via `PATCH /api/profile` (used today by the chat intake tools). Build `app/profile/equipment/page.tsx`: same Home/Gym + equipment-chip picker UI as the original onboarding design (`AI Fitness App.dc.html:163-184`), pre-filled from `profileSlice.profile`, saving via `updateProfile()`.
2. **Injuries & Limitations** — `UserProfile.injuriesNotes` (free text, already used by the chat safety tools) plus the still-unresolved `UserProfile.injuries` JSON shape flagged as an open question in the original `remaining-backend.md` (`{bodyPart, severity?, note?}[]`). For this pass, ship a simple free-text editor bound to `injuriesNotes` only — defer the structured `injuries` array editor until that shape gets product sign-off (it's still marked open in the original docs).
3. **Units (kg / lb)** — `UserProfile.unitsPreference` already exists and already has a default (`"lb"`) and a Zod enum (`z.enum(["lb", "kg"])` in `ProfileUpdateSchema`) — this is the cheapest of the four. A two-option toggle row is enough; no new page needed, can be inline on `/profile` itself.
4. **Notifications** — no backend concept exists at all (no field, no push infrastructure, no service worker to receive a push event before Phase D). Real push notifications are a separate, much larger effort (requires `web-push`/VAPID keys, a `PushSubscription` model, and Phase D's service worker as a prerequisite). For this pass, either (a) cut this row until push infra exists, or (b) ship it as a single "Workout reminders" on/off toggle stored as a new `UserProfile.notificationsEnabled Boolean @default(false)` field with no actual delivery yet — visibly a preference, honestly not yet wired to anything. Recommend (a): don't ship a setting that lies about what it does.
5. Update `app/profile/page.tsx`'s `SETTINGS_ROWS` mapping (line 8) to route each row to its real destination instead of a static array of strings with no `onClick`.

Files touched: `app/profile/equipment/page.tsx` (new), `app/profile/injuries/page.tsx` (new), `app/profile/page.tsx`.

Depends on Phase A (Profile needs to be a real, navigable destination before it's worth investing in sub-screens).

---

### Phase J — Timed-hold pause button

**Goal:** the ⏸ button on `TimedHold.tsx` actually pauses the countdown.

1. **`components/workout/TimedHold.tsx`**: add `const [isPaused, setIsPaused] = useState(false)`. The countdown `useEffect` (starting ~line 34) ticks `remaining` down on a `setInterval`; guard the tick with `if (isPaused) return` (or clear/restart the interval on pause toggle — either works, guarding is simpler and avoids interval-lifecycle bugs).
2. Wire the existing ⏸ button (line 84-90, currently no `onClick`) to `() => setIsPaused((p) => !p)`, swap the icon to `▶` and dim the countdown color while paused so it's visually obvious nothing's ticking.
3. **`components/workout/RestTimer.tsx`** almost certainly has the identical interval pattern for the rest countdown — check whether it needs the same treatment while in there; the design doesn't show a pause control on the rest timer (only "+15s" and "Skip Rest"), so this is likely TimedHold-only, but worth a quick look since it's the same file family.

Files touched: `components/workout/TimedHold.tsx`.

Trivial, no dependencies — good candidate to knock out first if someone wants a quick win.

---
### Phase L — Automated test coverage

**Goal:** stop relying entirely on manual `curl`/Prisma Studio/browser verification (which both `remaining-backend.md` and `remaining-frontend.md` explicitly flagged as the only verification method used so far).

1. **Unit tests (Vitest)** — add `vitest` as a dev dependency (nothing test-related is installed today). Highest-value first targets, none of which need a live DB:
   - `lib/chat/generator.ts`'s `extractJson()` (lines 353-371) — pure function, handles malformed/partial JSON from the LLM, currently has zero coverage for its fallback brace-matching path.
   - `lib/api/mappers.ts`'s `routineStatusToApi()` — the DB-lifecycle-enum → frontend-status reconciliation rule flagged as an open design question in the original `remaining-backend.md`; a test suite is the right place to pin down its exact behavior now that it's "confirmed," per that doc's own sign-off notes.
   - Zod schemas in `lib/validation/*.ts` — cheap, high-signal, catches accidental breaking changes to API contracts.
2. **Integration tests against a real (test) database** — Prisma's recommended pattern is a separate `DATABASE_URL` pointed at a disposable Postgres (docker-compose or a Testcontainers setup), migrated fresh per run. Cover: `saveRoutineToDb()`'s transaction (multi-day upsert + stale-day cleanup, `lib/chat/generator.ts:373-489` — this has real edge-case logic worth pinning down), and the `/api/routines/:id` finalize cascade added this session (finalizing one day finalizes the whole `programId`).
3. **E2E (Playwright)** — one golden-path test matching the exact manual checklist both docs called out as never having been run systematically: register → onboard → chat intake → routine generation → finalize → active workout → completion → stats. This is the test that would have caught the feedback-page session-scoping issue and the chat-page navigation dead-end flagged in this document, had it existed earlier.
4. **`package.json` scripts**: add `"test": "vitest run"`, `"test:e2e": "playwright test"`.

Files touched: `package.json`, `vitest.config.ts` (new), `playwright.config.ts` (new), `tests/` or `__tests__/` directories (new).

No dependency on other phases, but naturally most valuable once A-K land — testing a moving target is less useful than testing where things settle. Reasonable to treat as ongoing/parallel rather than a single discrete milestone.

---

## 3. Suggested build order

- **A (navigation)** first — cheapest, highest immediate user-facing pain (this is what prompted this doc), and unblocks discoverability of everything else being built, including Phase I (profile sub-screens need Profile to be reachable first).
- **J (pause button)** — trivial, no dependencies, good quick win alongside A.
- **B (logo)** next — foundational asset needed by both C and D.
- **C (splash)** depends on B.
- **D (PWA)** depends on B, benefits from C being done first so install feels like one polished moment rather than two separate launches.
- **E (feedback→chat)** independent of A-D, can run in parallel. G's "bonus workout" link benefits from E existing first but can ship without it.
- **G (rest day) → H (day transition)** — do these together; both touch `TodayWorkoutCard.tsx` and the multi-day tab selector, and H's "current day" logic needs to already understand G's rest-day rows to skip them correctly when picking the next unfinished day.
- **F (exit-confirm modal)** — independent, any time.
- **I (profile sub-screens)** — after A.
- **L (tests)** — start the unit-test slice (step 1) any time; treat integration/e2e as ongoing, ideally covering each phase above as it lands rather than as one final pass.

---

## 4. Open questions needing a decision before/while building

1. **Default PWA icon** — **Decided: Pulse Bubble (2a)**, matching the design doc's own "lead option" framing.
2. **Logo preference storage** — confirmed plan is localStorage (instant, pre-auth) + server sync via `UserProfile.logoStyle` once logged in. Flag now if a different approach (e.g. account-only, no local fallback) is preferred. **Proceed**
3. **Feedback quick-reply chips** — **Decided: keep them**, shown only when the user is actually in a feedback-draft flow (see Phase E, step 5).
4. **Rest-day generation** — should the Generator be allowed to insert rest days automatically (Phase G, step 1), or should rest days only appear when the user explicitly asks for e.g. "a 5-on-2-off split"? Affects how aggressively to change `GENERATOR_SYSTEM_PROMPT`. **Generator should insert rest days when necessary**
5. **Day-transition adjustment note** (Phase H, step 4) — worth the added Generator-prompt complexity to track "what changed since last time" per day, or ship the day-progress bar without it for v1? **Ship progress bar without it**
6. **Injuries structured data** (Phase I, step 2) — this was already an open question in the original `remaining-backend.md` and remains unresolved; free-text-only for this pass unless product signs off on the `{bodyPart, severity?, note?}[]` shape now.
7. **Notifications row** (Phase I, step 4) — cut it entirely for this pass, or ship an honest no-op toggle? Real push notifications are out of scope until Phase D's service worker exists and someone commits to `web-push`/VAPID setup. **Skip**
8. **Email provider for password reset** (Phase K, step 1) — needs a choice (Resend, Postmark, SES, etc.) and API keys before that phase can start; blocking, not just a preference. **We are going to remove the email and password login totally and only stick with login with google** This applies to the registration too. After that page will be onboarding if the user does not exist otherwise, to the home page.
