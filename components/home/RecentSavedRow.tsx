import Link from "next/link";
import type { ProgramSummary } from "@/types";
import { Dumbbell, Clock, CheckCircle2 } from "lucide-react";

export function RecentSavedRow({ routines }: { routines: ProgramSummary[] }) {
  // Only display finalized routines under "Recent & Saved"
  const finalizedRoutines = routines.filter((r) => r.status === "finalized");

  if (finalizedRoutines.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink/50">
        Recent &amp; Saved
      </div>
      <div className="flex flex-col gap-3">
        {finalizedRoutines.map((routine) => (
          <Link
            key={routine.id}
            href={`/workout/${routine.firstRoutineId}`}
            className="flex items-center justify-between rounded-2xl border border-ink/8 bg-surface p-4 transition shadow-xs hover:border-ink/20 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-volt/10 text-volt">
                <Dumbbell className="w-5 h-5 fill-volt/10" />
              </div>
              <div>
                <div className="font-display text-sm font-bold text-ink leading-tight">
                  {routine.title}
                </div>
                {routine.subtitle && (
                  <div className="text-[11px] text-ink/40 mt-0.5 leading-snug">
                    {routine.subtitle}
                  </div>
                )}
                {/* Meta details */}
                <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-ink/50 uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ink/30" />
                    {routine.estimatedDurationMinutes} Min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5 text-ink/30" />
                    {routine.exerciseCount} {routine.exerciseCount === 1 ? "Move" : "Moves"}
                  </span>
                </div>
              </div>
            </div>

            {/* Completed badge */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-success uppercase tracking-wide bg-success/8 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
