# Remaining Frontend Work

What's left after the golden-path pass (Welcome → Onboarding → Chat/Preview → Active Workout → Home) and the follow-up pass (Login, Progress, Profile, saved-routine detail, exercise-detail sheet, post-workout feedback). Cross-referenced against the full design handoff (`AI Fitness Trainer MVP Design-handoff.zip`) and `architecture.md`.

## Screens & states not yet built

- **Rest-day empty state** — "Rest day — nice." card with "Do a bonus workout anyway" fallback, for days a multi-day split marks as recovery.
- **Exit-confirm modal** — "End workout early?" / "Keep Going" / "End & Save Progress" dialog. Currently the ✕ and ← on the active workout screen navigate straight to `/home` with no confirmation, so in-progress sets are silently discarded.
- **AI-thinking skeleton** — the dedicated shimmering-skeleton loading state for chat (we only built the three-dot typing indicator, which covers the same need more simply — revisit only if a slower/richer loading moment is wanted).
- **Multi-day continuity / day-transition screen** — "7-Day Home Split," day-progress bar, "Day 4 · auto-scaled from your feedback," "Preview Day 4 →." Nothing in the app currently models more than a single day's routine; Home's "DAY 3 OF 7" label is hardcoded copy, not real state.
- **Animated splash + logo-direction exploration** — intentionally excluded (design-exploration artifact, not a finished screen); revisit only if the product wants a real boot animation.

## Wired but non-functional (decorative pending backend)

These render and are reachable, but don't do anything yet — expected, since there's no backend, but worth tracking so they don't get mistaken for done:

- Profile's settings rows (Equipment & Location, Injuries & Limitations, Units, Notifications) are inert — no detail screens behind them.
- Signup step's "Continue with Google / Apple" buttons and Login's "Forgot password?" are decorative.
- Exercise-detail sheet's "Full Tutorial" tab only swaps a label — there's no real video, quick-loop vs. tutorial content is identical.
- Active-workout "⏸ Pause" button doesn't pause the countdown.
- Progress tab, Home's streak banner, and the completion-screen stats (volume/time/streak/PR) are all static mock numbers — none of it is computed from actual logged sets.
- Chat-driven routine edits (swap, guardrail, finalize) don't persist anywhere or feed into Progress/Home — each `/chat` visit starts the scripted conversation over.

## Frontend infrastructure from `architecture.md` not started

- **PWA installability** — manifest, install prompt handling.
- **Service worker** (`sw.js`) — cache-first for shell/assets, network-first for data.
- **Local persistence (Dexie/IndexedDB)** — so an active routine/workout survives a refresh or network drop. Right now all state lives in an in-memory Zustand store and resets on reload.
- **Screen Wake Lock API** — keep the screen on during active workout tracking.
- **SSE plumbing on the client** — the chat is fully scripted client-side today; once a real backend exists, `sendMessage` needs to switch from the local script to consuming a Server-Sent Events stream (Generator/Reviewer reasoning steps, then the final routine).

## Polish / verification gaps

- Desktop layout has only been eyeballed for `/chat`'s side-by-side mode; Home, Progress, Profile, onboarding, active workout, and feedback all use a centered max-width column that hasn't been stress-tested at wide viewports beyond a quick look.
- No systematic keyboard-only (Tab-through) pass across the full app — individual components have aria-labels and semantic elements, but nothing end-to-end.
- No automated test coverage (unit or e2e) anywhere yet — all verification so far has been manual/browser-driven.
