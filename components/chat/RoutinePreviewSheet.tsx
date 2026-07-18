import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatTarget } from "@/lib/utils";
import type { Routine } from "@/types";
import { ArrowUp } from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState(false);

  const sessionRoutines = useAppStore((s) => s.sessionRoutines);
  const switchDay = useAppStore((s) => s.switchDay);

  const totalDays = routine.totalDays || 0;
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const visibleExercises = isExpanded ? routine.exercises : routine.exercises.slice(0, 2);
  const remainingCount = routine.exercises.length - 2;

  return (
    <Card className="flex h-full flex-col px-5 pb-6 pt-3.5 lg:h-auto lg:sticky lg:top-6">
      {onCollapse && (
        <div className="mx-auto flex cursor-pointer flex-col justify-center items-center" role="button" onClick={onCollapse}>
          <div className="mb-2 text-center text-[11px] text-ink/30 flex space-x-2">
            Chat peeking above <ArrowUp className="h-4 w-4 text-ink/30" />
          </div>
          <button
            type="button"
            onClick={onCollapse}
            className="mx-auto mb-1.5 h-1 w-9 rounded-full bg-ink/18 cursor-pointer"
            aria-label="Collapse to docked preview"
          />
        </div>
      )}

      {/* Multi-day tab selector */}
      {totalDays > 1 && (
        <div className="mt-4 flex flex-col gap-2 shrink-0">
          <div className="text-[11px] uppercase font-bold tracking-wider text-ink/40">
            generated program · tap a day to preview
          </div>
          <div className="flex gap-2 overflow-x-auto py-1.5 hide-scrollbar">
            {daysArray.map((d) => {
              const isSelected = routine.dayIndex === d;
              const dayRoutine = sessionRoutines.find((r) => r.dayIndex === d);
              const isFinalized = dayRoutine?.status === "finalized";

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => switchDay(d)}
                  className={`flex flex-col items-center justify-center h-12 w-10 shrink-0 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-volt text-volt-text font-bold shadow-sm"
                      : isFinalized
                        ? "bg-ink/5 text-ink/75 border border-ink/10"
                        : "bg-ink/3 text-ink/40 border border-transparent hover:bg-ink/5"
                  }`}
                >
                  <span className="text-[11px] font-bold">D{d}</span>
                  {isFinalized && <span className="text-[9px] mt-0.5 font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 shrink-0">
        <h2 className="font-display text-xl font-bold">
          {totalDays > 1 ? `Day ${routine.dayIndex} — ${routine.title}` : (routine.title || "Building your routine…")}
        </h2>
        <p className="my-2 text-[13px] text-ink/50 leading-relaxed">
          {totalDays > 1
            ? `${routine.exercises.length} exercises · ~${routine.exercises.length * 6} min · ${routine.subtitle}`
            : (routine.subtitle || "Hang tight while the coach lines this up")}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-2 hide-scrollbar">
        {visibleExercises.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelectExercise?.(exercise.id)}
            className="flex items-center justify-between rounded-2xl border-[1.5px] border-ink/10 px-3.5 py-3 text-left hover:bg-ink/3 transition-colors cursor-pointer"
          >
            <div>
              <div className="font-display text-sm font-bold">{exercise.name}</div>
              <div className="text-xs text-ink/50">{exercise.muscle}</div>
            </div>
            <div className="text-sm font-bold text-coral-text">{formatTarget(exercise)}</div>
          </button>
        ))}

        {!isExpanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-center rounded-2xl border border-dashed border-ink/20 px-3.5 py-3 text-center text-xs font-bold text-ink/65 hover:bg-ink/3 transition-all cursor-pointer"
          >
            + {remainingCount} more, tap to expand
          </button>
        )}

        {isExpanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-center rounded-2xl border border-dashed border-ink/20 px-3.5 py-3 text-center text-xs font-bold text-ink/65 hover:bg-ink/3 transition-all cursor-pointer"
          >
            Show less
          </button>
        )}
      </div>

      {routine.status !== "finalized" && (
        <div className="mt-4 flex gap-2 shrink-0">
          {totalDays > 1 && (
            <button
              type="button"
              onClick={() => {
                const inputElement = document.querySelector("textarea") as HTMLTextAreaElement | null;
                if (inputElement) {
                  inputElement.value = `Adjust Day ${routine.dayIndex}: `;
                  inputElement.focus();
                }
                onCollapse?.()
              }}
              className="flex-1 rounded-2xl border-[1.5px] border-ink/20 py-3 text-center font-display text-[15px] font-bold hover:bg-ink/5 transition-colors cursor-pointer bg-transparent text-ink"
            >
              Adjust Day {routine.dayIndex}
            </button>
          )}
          <Button
            variant="primary"
            disabled={!ready}
            onClick={onFinalize}
            className={`py-3 font-display font-bold rounded-2xl flex-1 ${
              ready ? "bg-volt text-volt-text hover:bg-opacity-95" : ""
            }`}
          >
            {totalDays > 1 ? "Finalize Program" : "Finalize Workout"}
          </Button>
        </div>
      )}
    </Card>
  );
}
