# User Profile Model Redesign

## Problem Statement
How might we give the agent a real, structured, persistent health record — biodata plus a dated injury history — so it can make informed, safety-aware training decisions, instead of a single `injuriesNotes` free-text string layered on top of a `UserProfile` model that conflates "who the user is" with "what they want this session"?

## Context: what's actually broken today
- `injuries Json?` exists on `UserProfile` and `ProfileUpdateSchema` already validates a structured shape (`bodyPart`, `severity`, `note`) — but it's dead. `updateUserProfile` (`lib/chat/tools.ts`) parses it and then never writes it to Prisma, and the `update_user_profile` tool's exposed JSON schema doesn't even include `injuries` as a callable param. The agent has no way to write structured injury data at all — only `injuriesNotes`, a string it appends vague context to (e.g. *"Recovering from kidney biopsy (4 days ago)"*) with no onset date, no status, and no way to mark it resolved.
- `UserProfile` mixes two different kinds of truth: biological/durable facts (currently: none — no weight, height, age, sex, experience level) and session-scoped logistics (`goal`, `location`, `equipment`, `sessionDurationMinutes`) that realistically change trip-to-trip (home today, gym on vacation next week).

## Recommended Direction
Three-way split, replacing the current single `UserProfile` blob:

**1. `UserProfile` narrows to biodata only** — the durable, biological facts a trainer needs: weight, height, age/date of birth, biological sex, training experience level. Keeps `unitsPreference` (governs how weight/height display) and `logoStyle` (unrelated cosmetic setting, stays for lack of a better home). Drops `goal`, `location`, `equipment`, `sessionDurationMinutes`.

**2. `injuries` becomes a real relational `Injury` model**, replacing the dead `Json?` field:
```prisma
model Injury {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  bodyPart   String
  severity   String?  // mild | moderate | severe
  note       String?
  onsetDate  DateTime? @map("onset_date")
  status     String    @default("active") // active | recovering | resolved
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}
```
The agent gets real tool coverage: `add_injury` (create a row when the user first mentions something), `update_injury_status` (mark recovering/resolved as it comes up in conversation), and `retrieve_user_safety_profile` (`lib/chat/tools.ts`) queries `status IN (active, recovering)` instead of reading a static note. This also lets the Tier 1 safety-filter mapping from [[exercise-search-tool-redesign]] (injury → excluded movement pattern) work off structured `bodyPart`/`status` instead of re-parsing free text every generation.

**Onboarding page should let the user be able to fill their profile biodata after registration**
**Users sould be able to update their injuries, biodata manually from their profile page**

## Key Assumptions to Validate
- [ ] The agent reliably calls `add_injury`/`update_injury_status` instead of just writing prose into chat — needs explicit system-prompt instruction and probably a few-shot example, since right now it has no structured-write habit to begin with
- [ ] Re-collecting goal/location/equipment/duration every new session isn't annoying for users whose situation genuinely doesn't change often (e.g. always trains at the same home gym) — worth a lightweight mitigation: pre-fill intake questions with "last time you said X, same today?" using the *previous* session's values as a suggestion, without persisting them as ground truth.

**We can provide a way for users to add preferences for where they prefer to train whether home or gym. This should only serve as context for the trainer. He should still ask the user the location where he wants to exercise**

- [ ] Biodata (weight/height/age/sex/experience) is something users will actually volunteer through conversation, or whether it needs a dedicated onboarding step rather than relying on the chat intake flow to surface it naturally

## MVP Scope
**In:**
- Schema: narrow `UserProfile` to biodata fields; add `goal`/`location`/`equipment`/`sessionDurationMinutes` to `ChatSession`; new `Injury` model
- `lib/chat/tools.ts`: replace `update_user_profile` with session-scoped intake update + biodata update; add `add_injury`/`update_injury_status`; rewrite `retrieve_user_safety_profile` to query `Injury`
- `lib/chat/generator.ts` / Reviewer prompt construction: pull goal/location/equipment/duration from the active `ChatSession`, injuries from `Injury`, biodata from `UserProfile`
- `app/api/profile/route.ts`: narrow to biodata-only GET/PATCH
- Migration: existing `UserProfile.goal/location/equipment/sessionDurationMinutes/injuries` data backfilled into one `ChatSession` row + `Injury` rows per user before columns are dropped
- Onboarding flow redesign beyond the minimal change of seeding first-session intake instead of a permanent field

**Out (this pass):**
- Any UI for users to browse/edit their injury history directly (agent-driven only, for now)
- Biodata-driven load/volume calculations (weight-adjusted programming) — this pass is about capturing the data, not yet using it in generation logic

## Not Doing (and Why)
- **Keeping goal/location/equipment/duration as a persistent profile with per-session overrides** — considered, rejected in favor of full re-collection; adds a "which value wins" ambiguity (profile default vs. session override) for data that's explicitly supposed to be current, not remembered.
- **Free-text injuries with better prompting alone** (no schema change) — rejected; free text is exactly the failure mode reported (vague, stale, unqueryable, and currently not even reliably captured since the write path is broken).
- **User-facing injury editing UI in this pass** — real value eventually, but the immediate problem is the agent's write path being broken, not the lack of manual UI; sequencing the agent-driven fix first keeps this pass scoped.

## Open Questions
- Should `Injury.severity`/`status` be Prisma enums instead of strings, for the same reason `Location` already is an enum on the old `UserProfile`?
**Severity should be an enum**

- Does dropping `goal` from `UserProfile` conflict with anything reading it outside chat (e.g. `/api/stats`, progress page)? Worth a repo-wide check for `profile.goal`/`profile.location`/`profile.equipment`/`profile.sessionDurationMinutes` reads before removing the columns.
**I do not think so. Goal is useless in this context, we can remove this.**

