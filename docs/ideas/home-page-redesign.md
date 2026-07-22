# Home Page Redesign

## Problem Statement
How might we redesign home into an orientation hub — surfacing today's action, momentum, and unfinished work — using the app's existing visual language, instead of the current disconnected stack of a decorative streak banner, a workout card, and a bare title-only recent-routines row?

## Recommended Direction
A section-based hub, same tokens/components as the rest of the app (coral/volt/cream palette, `rounded-3xl` cards, `font-display` headers — no rebrand), restructured around "what do I do next":

1. **Header** (kept as-is) — greeting + profile avatar.
2. **Continue** (new) — surfaces anything left mid-flow: an in-progress chat session and/or an unfinalized routine. This is the direct fix for "workout hasn't been finalized but still shows as if it's today's plan" — instead of `TodayWorkoutCard` silently treating any latest routine as *the* plan regardless of status, unfinalized work moves here, explicitly labeled "pick up where you left off," and only a `finalized` routine earns the primary `TodayWorkoutCard` slot.
3. **Today** (reworked `TodayWorkoutCard`) — same three states (empty/rest/active) it already handles well, restyled for more visual weight since it's the primary action.
4. **This Week** (new) — a stat strip using data the `/api/stats` endpoint *already computes and returns* but the UI never renders: `weeklyVolume` (7-day array → small bar/sparkline), `recentPr`, `totalWorkouts`. Currently only `streakDays` is used (as its own banner); folding streak into this strip alongside the other already-available numbers is the single highest-leverage move here — it's real "missing capability" filled with zero new backend work.
5. **Recent & Saved** (restyled `RecentSavedRow`) — same data, better visual treatment than plain text tiles (thumbnail/icon per routine, clearer status chip instead of raw status string).
6. **BottomNav** (kept as-is).

## Key Assumptions to Validate
- [ ] A stat strip (weekly volume + PR + streak + total workouts) is more motivating/useful at a glance than the current single big streak banner — validate by just shipping it and watching whether users engage with "This Week" (e.g. tap into progress page) more than they did with the streak banner alone
- [ ] "Continue" as a distinct section is worth the complexity vs. just fixing the finalized-only filter on `TodayWorkoutCard` — validate by checking whether users actually have unfinished routines/chats often enough for a dedicated section to earn its place (if it's rare, it can just be a small inline banner instead of a full section)
- [ ] Restyling `RecentSavedRow` tiles (icons/thumbnails) doesn't require new data the routine model doesn't have — confirm what's actually available per routine (title, subtitle, status only, per `RoutineSummary` type) before designing richer tiles

## MVP Scope
**In:**
- `TodayWorkoutCard` / home page logic: only render a routine as "Today" if `status === "finalized"`; everything else routes to Continue
- New "This Week" stat strip component wired to existing `/api/stats` (`weeklyVolume`, `recentPr`, `totalWorkouts`, `streakDays` all already returned, just unused)
- New "Continue" section for unfinalized routines.
- Restyle `RecentSavedRow` tiles within existing design tokens

**Out (this pass):**
- Visual identity changes (palette, typography, base component style)

## Not Doing (and Why)
- **Rebuilding the visual identity** — explicitly ruled out; this is a layout/content redesign within the existing design system, not a rebrand, to stay consistent with chat/workout/profile pages.
- **New stats/metrics requiring backend work** (e.g. muscle-group breakdown, trend charts) — everything in this pass uses data `/api/stats` already computes; new metrics are a separate, later ideation topic once this baseline ships.
- **Chat-as-home** (collapsing the dual-layer chat/preview model into home) — considered and rejected; conflicts with the PRD's dual-layer chat+Preview architecture, too large a scope change for a "redesign home" ask.

## Open Questions
- Should "Continue" ever show more than one item (e.g. an unfinished routine *and* an in-progress chat simultaneously), or always collapse to a single most-recent entry?
**Yes**
- Does `RoutineSummary` need new fields (e.g. exercise count, estimated duration) to make restyled tiles richer, or is title+status genuinely enough once presented better?
**new fields**