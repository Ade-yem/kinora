import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatTarget } from "@/lib/utils";
import type { Routine } from "@/types";
import { ArrowRight, ArrowUp } from "lucide-react";

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
  const ready = routine.status === "ready";

  return (
    <Card className="flex h-full flex-col px-5 pb-6 pt-3.5 lg:h-auto lg:sticky lg:top-6">
      {onCollapse && (
        <div className="mx-auto flex cursor-pointer flex-col justify-center items-center" role="button" onClick={onCollapse}>
          <div className="mb-2 text-center text-[11px] text-ink/30 flex space-x-2">Chat peeking above <ArrowUp className="h-4 w-4 text-ink/30" /></div>
          <button
            type="button"
            onClick={onCollapse}
            className="mx-auto mb-1.5 h-1 w-9 rounded-full bg-ink/18"
            aria-label="Collapse to docked preview" />

        </div>
      )}


      <h2 className="font-display text-xl mt-4 font-bold">{routine.title || "Building your routine…"}</h2>
      <p className="my-3 text-[13px] text-ink/50">
        {routine.subtitle || "Hang tight while the coach lines this up"}
      </p>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-2 hide-scrollbar cursor-pointer">
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

      {routine.status !== "finalized" &&
        <Button variant="primary" disabled={!ready} onClick={onFinalize} className="mt-2">
          Finalize Workout
        </Button>
      }
    </Card>
  );
}
