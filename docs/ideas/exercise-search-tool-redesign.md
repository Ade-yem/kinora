# Exercise Search Tool Redesign

## Problem Statement
How might we let the Generator find safe, appropriate exercises using precise structured filters instead of free-text `search`, while cutting the number of tool round-trips per routine generation?

## Recommended Direction
Two changes to `get_exercises_by_parameters` (defined in both `lib/chat/tools.ts` and duplicated inline in `lib/chat/generator.ts`'s `runGenerator` — worth deduping while touching this):

**1. Enum-constrained structured filters.** 
- Add `posture`, `movementPattern` (matches any of `movementPattern1/2/3`), `laterality`, and `difficultyLevel` as tool parameters, each with a JSON schema `enum` listing the exact DB values from `Ideas/tools.md` (e.g. `posture: ["Supine","Standing","Seated",...]`). These columns already exist on `Exercise` as plain strings — `getExercisesByParametersInternal` (`lib/chat/generator.ts:66`) just needs new `andConditions` branches mirroring the existing `muscles`/`equipment` pattern. No schema/migration work. `search` will be removed.
- Add explanation for the enum values in the tool definition so that the models can know which parameters and filters are available.

**2. Batch multiple filter-sets into one call.** Change the tool signature from a single filter object to `{ slots: FilterSet[] }`, where each slot represents one exercise "role" in the routine (e.g. one per muscle group/movement the Generator needs to fill). The tool runs one Prisma query per slot server-side and returns `{ slotResults: [{ slotLabel, exercises }] }`. This lets a 5-6-slot routine resolve in one tool call instead of one per turn. Reasonable to also lower `runGenerator`'s turn cap (`lib/chat/generator.ts:238`, currently `turn < 5`) once batching is in, since most generations should now need 1-2 turns instead of hitting the ceiling.

**3. Safety mapping stays in the prompt, not code.** `GENERATOR_SYSTEM_PROMPT` gets the Tier 1 table from `Ideas/tools.md` (injury → excluded movement pattern / preferred posture) as reasoning guidance, not a hardcoded server-side rule table. Keeps it flexible for injury phrasing the table doesn't enumerate, consistent with how `injuriesNotes` is already free text end-to-end.

## Key Assumptions to Validate
- [ ] The model reliably picks correct enum values across ~30-value lists (e.g. `movementPattern` has 37 values) without hallucinating near-misses — validate with a handful of real generation runs, check tool-call args against the actual enum
- [ ] One batched call per generation is enough — validate that slot count (routine length) doesn't regularly exceed what one call comfortably returns; if routines are long, may need slot-count limits
- [ ] Prompt-based safety reasoning is consistent enough without a code-level backstop — validate by testing a few known injury phrasings (lower back pain, knee pain, shoulder impingement) and checking the filters the model actually applies

## MVP Scope
**In:**
- `posture`, `movementPattern`, `laterality`, `difficultyLevel` enum params added to both tool definitions (dedupe the two copies while at it)
- New `andConditions` branches in `getExercisesByParametersInternal` for each
- `slots` array batching on the tool schema + Prisma query loop
- Tier 1 safety table added to `GENERATOR_SYSTEM_PROMPT`
- Turn cap re-tuned downward if batching holds up in practice
- **Deprecating `search` entirely**

**Out (this pass):**
- Hardcoded server-side safety rule table (deferred — only revisit if prompt-based reasoning proves unreliable in practice)
- Changes to the Reviewer agent's own tool access (out of scope, only the Generator's search path)
- Exercise seeding/spreadsheet import (separate, already-tracked TODO in CLAUDE.md) - already done

## Not Doing (and Why)
- **Server-side deterministic injury→filter rule table** — rejected for now in favor of prompt-based reasoning; adding it later as a safety backstop is still on the table if real usage shows the LLM missing obvious exclusions, but building it preemptively is solving a problem not yet observed.

## Open Questions
- Does the DeepSeek model handle large multi-value JSON schema enums well, or does it degrade with ~30+ option lists per param? Worth a quick empirical check before committing to enum-everywhere over "documented free text." **- Those schemas will be provided as prompt. Deepseek model does not handle large multi-value JSON schema enums well. I suggest we provide it as context prompt and let the model figure out the best way to use it** 
- Should `slots` have a hard max (e.g. 8) to bound one call's Prisma query cost? **Yes, a hard max of 8 slots should be sufficient to cover most routines.**
