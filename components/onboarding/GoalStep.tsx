import { Button } from "@/components/ui/Button";
import type { Goal } from "@/types";

const GOAL_SUGGESTIONS = ["Build Muscle", "Lose Fat", "Get Stronger", "Stay Active"];

export function GoalStep({
  goal,
  onSelect,
  onContinue,
}: {
  goal: Goal | null;
  onSelect: (goal: Goal) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-2 font-display text-2xl font-bold">What&apos;s the mission?</h1>
      <p className="mb-4 text-sm text-ink/50">Tell us in your own words — no wrong answers.</p>

      <label htmlFor="goal-input" className="sr-only">
        Fitness goal
      </label>
      <input
        id="goal-input"
        value={goal ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="e.g. Build muscle, run a 5K, feel stronger…"
        className="mb-3 w-full rounded-2xl border-[1.5px] border-ink/15 px-4 py-3.5 text-sm placeholder:text-ink/35 focus:border-ink/40 focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        {GOAL_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-2xl border-[1.5px] border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <Button variant="dark" className="mt-auto" disabled={!goal?.trim()} onClick={onContinue}>
        Next
      </Button>
    </div>
  );
}
