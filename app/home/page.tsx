"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StreakBanner } from "@/components/home/StreakBanner";
import { TodayWorkoutCard } from "@/components/home/TodayWorkoutCard";
import { RecentSavedRow } from "@/components/home/RecentSavedRow";
import { BottomNav } from "@/components/ui/BottomNav";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function HomePage() {
  const { data: session } = useRequireAuth();
  const routines = useAppStore((s) => s.routines);
  const routine = useAppStore((s) => s.routine);
  const workoutPhase = useAppStore((s) => s.workout.phase);
  const stats = useAppStore((s) => s.stats);
  const fetchRoutines = useAppStore((s) => s.fetchRoutines);
  const fetchLatestRoutine = useAppStore((s) => s.fetchLatestRoutine);
  const fetchStats = useAppStore((s) => s.fetchStats);

  useEffect(() => {
    fetchRoutines({ pageSize: 5 });
    fetchLatestRoutine();
    fetchStats();
  }, [fetchRoutines, fetchLatestRoutine, fetchStats]);

  const displayName = session?.user?.name ?? "there";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-5 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Hey {displayName} 👋</h1>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:opacity-85 transition cursor-pointer"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "Profile"}
              className="h-9 w-9 rounded-full object-cover border border-ink/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/25 text-base">
              👤
            </div>
          )}
        </Link>
      </div>

      <StreakBanner days={stats?.streakDays ?? 0} />
      <TodayWorkoutCard routine={routine} workoutPhase={workoutPhase} />
      <RecentSavedRow routines={routines} />

      <div className="mt-auto pt-6">
        <BottomNav active="home" />
      </div>
    </main>
  );
}
