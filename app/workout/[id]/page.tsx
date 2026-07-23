"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Menu, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { FinalizedRoutinesSidebar } from "@/components/workout/FinalizedRoutinesSidebar";
import { getEquipmentSummary, formatTarget } from "@/lib/utils";

export default function RoutineDetailPage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Local UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Store actions & state
  const routine = useAppStore((s) => s.routine);
  const routineStatus = useAppStore((s) => s.routineStatus);
  const fetchRoutineById = useAppStore((s) => s.fetchRoutineById);
  const fetchRoutines = useAppStore((s) => s.fetchRoutines);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);
  const resetWorkout = useAppStore((s) => s.resetWorkout);
  const finalizedRoutines = useAppStore((s) => s.routines);

  useEffect(() => {
    fetchRoutineById(params.id);
    fetchRoutines({ status: "finalized" });
  }, [params.id, fetchRoutineById, fetchRoutines]);

  if (routineStatus === "not-found" || routineStatus === "error") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-6 text-center">
        <div className="font-display text-lg font-bold">Routine not found</div>
        <Link href="/home" className="flex items-center justify-center gap-2 font-semibold text-coral-text">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
      </main>
    );
  }

  if (routineStatus !== "loaded") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-6 text-sm text-ink/50">
        Loading…
      </main>
    );
  }

  // Determine exercises to display (limited to 2 unless toggled)
  const displayedExercises = showAllExercises ? routine.exercises : routine.exercises.slice(0, 2);

  const handleStartWorkout = () => {
    resetWorkout();
    router.push("/workout/active");
  };

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-surface relative px-6 py-6 justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/5 hover:bg-ink/10 text-ink cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open routines menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/5 hover:bg-ink/10 text-ink cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto mt-6 space-y-5 hide-scrollbar">
        {/* Title and Metadata */}
        <div>
          <h1 className="font-display text-2xl font-bold text-ink leading-tight">{routine.title}</h1>
          <p className="mt-1.5 text-xs text-ink/50 font-semibold">
            {routine.exercises.length} exercises · ~{Math.max(15, routine.exercises.length * 7)} min · {getEquipmentSummary(routine.exercises)}
          </p>
        </div>

        {/* View Source Chat Row (only if session id exists) */}
        {routine.chatSessionId && (
          <Link
            href={`/chat?sessionId=${routine.chatSessionId}`}
            className="flex items-center justify-between rounded-2xl border border-ink/8 p-4 bg-surface-card hover:bg-ink/4 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/65">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-bold text-ink">View Chat</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-ink/40">
              <span className="truncate max-w-[120px]">{routine.chatSessionTitle}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        )}

        {/* Exercises List */}
        <div className="space-y-3">
          {displayedExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="flex items-center justify-between border border-ink/8 p-4 bg-surface-card rounded-2xl"
            >
              <div>
                <h3 className="font-display text-sm font-bold text-ink">{exercise.name}</h3>
                <p className="text-xs text-ink/40 mt-0.5 capitalize">{exercise.muscle.toLowerCase()}</p>
              </div>
              <div className="font-display text-sm font-bold text-volt-text">
                {formatTarget(exercise)}
              </div>
            </Card>
          ))}

          {/* Dotted Expand/Collapse Card */}
          {routine.exercises.length > 2 && (
            <button
              onClick={() => setShowAllExercises(!showAllExercises)}
              className="w-full border border-dashed border-ink/15 rounded-2xl py-3.5 text-xs font-semibold text-ink/45 hover:bg-ink/4 hover:border-ink/25 transition-all text-center cursor-pointer"
            >
              {showAllExercises ? "Show less" : `+ ${routine.exercises.length - 2} more`}
            </button>
          )}
        </div>
      </div>

      {/* Large Bottom Pinned CTA */}
      <div className="shrink-0 mt-5 pt-3 border-t border-ink/5">
        <Button
          variant="primary"
          onClick={handleStartWorkout}
          className="w-full bg-volt text-volt-text font-bold hover:bg-opacity-90 active:scale-98 transition-all text-base py-3.5 rounded-2xl flex justify-center items-center gap-2 cursor-pointer shadow-md"
        >
          Start Workout <ChevronRight className="w-4 h-4"/>
        </Button>
      </div>

      {/* Sidebar Overlay */}
      <FinalizedRoutinesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        routines={finalizedRoutines}
        activeProgramId={routine.programId || routine.id}
        onDeleteRoutine={deleteRoutine}
      />
    </main>
  );
}
