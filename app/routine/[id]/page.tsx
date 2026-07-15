"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatTarget } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function RoutineDetailPage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const routine = useAppStore((s) => s.routine);
  const routineStatus = useAppStore((s) => s.routineStatus);
  const fetchRoutineById = useAppStore((s) => s.fetchRoutineById);

  useEffect(() => {
    fetchRoutineById(params.id);
  }, [params.id, fetchRoutineById]);

  if (routineStatus === "not-found" || routineStatus === "error") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-6 text-center">
        <div className="font-display text-lg font-bold">Routine not found</div>
        <Link href="/home" className="text-sm font-semibold text-coral-text">
          ← Back to Home
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-6">
      <div className="flex items-center gap-2">
        <Link href="/home" aria-label="Back to Home" className="text-lg">
          ←
        </Link>
      </div>

      <h1 className="mt-5 font-display text-xl font-bold">{routine.title}</h1>
      <p className="mb-4 mt-1 text-[13px] text-ink/50">{routine.subtitle}</p>

      <div className="flex flex-1 flex-col gap-2">
        {routine.exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center justify-between rounded-2xl border-[1.5px] border-ink/10 px-3.5 py-2.5 text-sm font-semibold"
          >
            {exercise.name} <span className="text-coral-text">{formatTarget(exercise)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
        <Button variant="outline" href="/chat" className="flex-1">
          Repeat
        </Button>
        <Button variant="primary" href="/chat" className="flex-1">
          Edit w/ AI
        </Button>
      </div>
    </main>
  );
}
