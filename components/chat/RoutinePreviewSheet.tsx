import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatTarget } from "@/lib/mock-data";
import type { Routine } from "@/lib/types";

export function RoutinePreviewSheet({
  routine,
  onCollapse,
  onFinalize,
  onSelectExercise,
}: {
  routine: Routine;
  onCollapse?: () => void;
  onFinalize: () => void;
  onSelectExercise?: (id: string) => void;
}) {
  const ready = routine.status === "ready" || routine.status === "finalized";

  return (
    <Card className="flex h-full flex-col px-5 pb-6 pt-3.5 lg:h-auto lg:sticky lg:top-6">
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          className="mx-auto mb-1.5 h-1 w-9 rounded-full bg-ink/18"
          aria-label="Collapse to docked preview"
        />
      )}
      {onCollapse && (
        <div className="mb-3.5 text-center text-[11px] text-ink/30">chat peeking above ▲</div>
      )}

      <h2 className="font-display text-xl font-bold">{routine.title || "Building your routine…"}</h2>
      <p className="my-1 text-[13px] text-ink/50">
        {routine.subtitle || "Hang tight while the coach lines this up"}
      </p>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-2">
        {routine.exercises.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelectExercise?.(exercise.id)}
            className="flex items-center justify-between rounded-2xl border-[1.5px] border-ink/10 px-3.5 py-3 text-left"
          >
            <div>
              <div className="font-display text-sm font-bold">{exercise.name}</div>
              <div className="text-xs text-ink/50">{exercise.muscle}</div>
            </div>
            <div className="text-sm font-bold text-coral-text">{formatTarget(exercise)}</div>
          </button>
        ))}
      </div>

      <Button variant="primary" disabled={!ready} onClick={onFinalize} className="mt-2">
        Finalize Workout
      </Button>
    </Card>
  );
}
