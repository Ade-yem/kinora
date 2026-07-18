import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { Routine } from "@/types";

export function RoutinePreviewDocked({
  routine,
  onExpand,
}: {
  routine: Routine;
  onExpand: () => void;
}) {
  const forming = routine.status === "forming";

  return (
    <button
      type="button"
      onClick={onExpand}
      className="w-full text-left lg:hidden cursor-pointer block focus:outline-none mb-1 transition-all duration-200 hover:opacity-95"
      aria-label="Expand routine preview"
    >
      <Card className="border border-ink/6 px-5 pb-5 pt-3">
        <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-ink/18" />
        <div className="mb-2.5 flex items-center gap-1.5 font-display text-[13px] font-bold">
          Your routine{" "}
          <span className="text-coral-text">{forming ? "is forming…" : "is ready"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {routine.exercises.map((exercise) => (
            <Chip key={exercise.id}>{exercise.name}</Chip>
          ))}
          {forming && (
            <div className="rounded-full border-[1.5px] border-dashed border-ink/25 px-3 py-1.5 text-xs text-ink/40">
              + more…
            </div>
          )}
        </div>
        <div className="mt-2.5 text-center text-[11px] text-ink/35">▲ swipe up for full routine</div>
      </Card>
    </button>
  );
}
