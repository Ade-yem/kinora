import { Button } from "@/components/ui/Button";
import type { Routine, WorkoutPhase } from "@/lib/types";

export function TodayWorkoutCard({
  routine,
  workoutPhase,
}: {
  routine: Routine;
  workoutPhase: WorkoutPhase;
}) {
  if (routine.status === "empty") {
    return (
      <div className="mb-5 flex flex-col items-center gap-3 rounded-3xl border-[1.5px] border-dashed border-ink/15 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-volt/18 text-2xl" aria-hidden>
          💬
        </div>
        <div>
          <div className="font-display text-lg font-bold">No routine yet</div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
            Chat with your coach to build your first workout
          </p>
        </div>
        <Button variant="primary" href="/chat">
          Start Chatting →
        </Button>
      </div>
    );
  }

  const done = workoutPhase === "complete";

  return (
    <div className="mb-5 flex flex-col gap-2 rounded-3xl bg-surface-ink px-5 py-5 text-cream">
      {routine.dayIndex != null && routine.totalDays != null && (
        <div className="text-[11px] font-bold tracking-wide text-volt">
          DAY {routine.dayIndex} OF {routine.totalDays} · TODAY
        </div>
      )}
      <div className="font-display text-xl font-bold">{routine.title}</div>
      <div className="text-[13px] text-cream/60">{routine.subtitle}</div>
      {done ? (
        <div className="mt-2 rounded-xl bg-cream/10 py-3 text-center font-display text-sm font-bold text-cream">
          ✓ Completed today
        </div>
      ) : (
        <Button variant="primary" href="/workout/active" className="mt-2">
          Start Workout →
        </Button>
      )}
    </div>
  );
}
