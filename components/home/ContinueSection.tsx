import Link from "next/link";
import type { RoutineSummary } from "@/types";
import { MessageSquare, Sparkles, ArrowRight, Play } from "lucide-react";

export function ContinueSection({
  routines,
  sessions,
}: {
  routines: RoutineSummary[];
  sessions: { id: string; title: string | null; updatedAt: string }[];
}) {
  // Find unfinalized routines (status === 'forming' or 'ready')
  const unfinalizedRoutines = routines.filter(
    (r) => r.status === "forming" || r.status === "ready"
  );

  // If there are no unfinalized routines and no active/saved sessions, hide the section
  if (unfinalizedRoutines.length === 0 && sessions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink/50">
        Continue where you left off
      </div>
      <div className="flex flex-col gap-3">
        {/* Unfinalized routines */}
        {unfinalizedRoutines.map((routine) => {
          const isReady = routine.status === "ready";
          return (
            <Link
              key={routine.id}
              href={`/chat?sessionId=${routine.chatSessionId || ""}`}
              className="flex items-center justify-between rounded-2xl border border-coral/15 bg-coral/5 hover:bg-coral/8 p-4 transition shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/12 text-coral">
                  {isReady ? <Play className="w-5 h-5 fill-coral" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-ink">
                    {routine.title}
                  </div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    {isReady
                      ? "Routine is ready! Tap to review and finalize."
                      : "Drafting workout with coach..."}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-coral/60 shrink-0" />
            </Link>
          );
        })}

        {/* If no unfinalized routines but we have chat sessions, show the most recent session */}
        {unfinalizedRoutines.length === 0 && sessions.length > 0 && (
          <Link
            href={`/chat?sessionId=${sessions[0].id}`}
            className="flex items-center justify-between rounded-2xl border border-ink/10 bg-ink/3 hover:bg-ink/5 p-4 transition shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/8 text-ink/70">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-sm font-bold text-ink">
                  {sessions[0].title || "Active Chat Session"}
                </div>
                <div className="text-xs text-ink/50 mt-0.5">
                  Pick up your conversation with the personal trainer coach.
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-ink/40 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
