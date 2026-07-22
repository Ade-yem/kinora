import { Button } from "@/components/ui/Button";
import type { Routine, WorkoutPhase } from "@/types";
import { MessageSquare, Sun, Dumbbell } from "lucide-react";

export function TodayWorkoutCard({
  routine,
  workoutPhase,
}: {
  routine: Routine;
  workoutPhase: WorkoutPhase;
}) {
  // If the routine is not finalized, treat the day's primary slot as empty
  if (routine.status !== "finalized") {
    return (
      <div className="mb-6 flex flex-col items-center gap-3 rounded-3xl border-[1.5px] border-dashed border-ink/15 px-6 py-8 text-center bg-ink/2 shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 text-ink/70" aria-hidden>
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <div className="font-display text-lg font-bold text-ink">No workout active today</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/50 max-w-[260px] mx-auto">
            Talk to your coach to build today's plan, or select a saved routine below.
          </p>
        </div>
        <Button variant="dark" href="/chat" className="mt-2 px-6 py-2.5 font-bold rounded-xl flex items-center gap-2 justify-center">
          <MessageSquare className="w-4 h-4" /> Chat with Kinora
        </Button>
      </div>
    );
  }

  const isRestDay = !routine.exercises || routine.exercises.length === 0;

  if (isRestDay) {
    return (
      <div className="mb-6 flex flex-col gap-2 rounded-3xl bg-surface-ink px-6 py-6 text-cream shadow-md">
        {routine.dayIndex != null && routine.totalDays != null && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-volt">
            DAY {routine.dayIndex} OF {routine.totalDays} · TODAY'S REST DAY
          </div>
        )}
        <div className="font-display text-2xl font-black text-cream mt-1">{routine.title || "Rest & Recovery"}</div>
        <div className="text-sm text-cream/70 mt-0.5 leading-relaxed">{routine.subtitle || "Rest day — nice. Let your muscles recover."}</div>
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-cream/10 bg-cream/5 py-4 text-center font-display text-sm font-bold text-cream/80">
            <Sun className="text-volt w-5 h-5 animate-pulse" /> Active Recovery Day
          </div>
          <Button
            variant="outline-dark"
            href={`/chat?sessionId=${routine.chatSessionId || ""}&draft=I want to do a bonus workout today.`}
            className="w-full text-xs font-bold py-3.5 border-cream/20 hover:bg-cream/10 text-cream"
          >
            Prescribe a Bonus Workout
          </Button>
        </div>
      </div>
    );
  }

  const done = workoutPhase === "complete";

  return (
    <div className="mb-6 flex flex-col gap-2 rounded-3xl bg-surface-ink px-6 py-6 text-cream shadow-md">
      {routine.dayIndex != null && routine.totalDays != null && (
        <div className="text-[10px] font-bold uppercase tracking-wider text-volt">
          DAY {routine.dayIndex} OF {routine.totalDays} · ACTIVE WORKOUT
        </div>
      )}
      <div className="font-display text-2xl font-black text-cream mt-1 leading-tight">{routine.title}</div>
      <div className="text-sm text-cream/70 mt-0.5 leading-relaxed">{routine.subtitle}</div>
      
      {done ? (
        <div className="mt-4 rounded-2xl bg-volt/10 border border-volt/20 py-4 text-center font-display text-sm font-bold text-volt">
          ✓ Completed Today
        </div>
      ) : (
        <Button
          variant="primary"
          href="/workout/active"
          className="mt-4 w-full bg-volt text-ink hover:bg-opacity-90 py-4 text-sm font-extrabold rounded-2xl shadow-lg hover:scale-[1.01] transition-all flex justify-center items-center gap-1.5"
        >
          <Dumbbell className="w-4 h-4 fill-ink" />
          Start Active Workout
        </Button>
      )}
    </div>
  );
}
