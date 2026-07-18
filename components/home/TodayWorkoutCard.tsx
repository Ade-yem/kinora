import { Button } from "@/components/ui/Button";
import type { Routine, WorkoutPhase } from "@/types";
import { MessageSquare, Sun } from "lucide-react";

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
          <MessageSquare className="w-6 h-6 text-volt"/>
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

  const isRestDay = !routine.exercises || routine.exercises.length === 0;

  if (isRestDay) {
    return (
      <div className="mb-5 flex flex-col gap-2 rounded-3xl bg-surface-ink px-5 py-5 text-cream">
        {routine.dayIndex != null && routine.totalDays != null && (
          <div className="text-[11px] font-bold tracking-wide text-volt">
            DAY {routine.dayIndex} OF {routine.totalDays} · TODAY
          </div>
        )}
        <div className="font-display text-xl font-bold">{routine.title || "Rest & Recovery"}</div>
        <div className="text-[13px] text-cream/60">{routine.subtitle || "Rest day — nice. Let your muscles recover."}</div>
        <div className="mt-4 flex flex-col gap-2">
          <div className="rounded-2xl border border-cream/10 bg-cream/5 py-4 text-center font-display text-sm font-semibold text-cream/80">
            <Sun className="text-volt w-5 h-5"/> Rest Day — Enjoy the break!
          </div>
          <Button
            variant="outline-dark"
            href={`/chat?sessionId=${routine.chatSessionId || ""}&draft=I want to do a bonus workout today.`}
            className="w-full text-sm font-bold py-3.5"
          >
            Do a bonus workout anyway
          </Button>
        </div>
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
