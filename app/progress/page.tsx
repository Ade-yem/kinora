"use client";

import { useEffect } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { WeeklyVolumeChart } from "@/components/progress/WeeklyVolumeChart";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function ProgressPage() {
  useRequireAuth();
  const stats = useAppStore((s) => s.stats);
  const fetchStats = useAppStore((s) => s.fetchStats);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statTiles = [
    { label: "streak", value: `🔥${stats?.streakDays ?? 0}`, tone: "coral" as const },
    { label: "workouts", value: String(stats?.totalWorkouts ?? 0), tone: "neutral" as const },
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-5 py-6">
      <h1 className="mb-5 font-display text-xl font-bold">Progress</h1>

      <div className="mb-5 flex gap-2">
        {statTiles.map((stat) => (
          <div
            key={stat.label}
            className={`flex-1 rounded-2xl py-3 text-center ${
              stat.tone === "coral" ? "border border-coral/35 bg-coral/14" : "bg-ink/5"
            }`}
          >
            <div className="font-display text-lg font-bold">{stat.value}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-ink/55">{stat.label}</div>
          </div>
        ))}
      </div>

      <WeeklyVolumeChart data={stats?.weeklyVolume ?? [0, 0, 0, 0, 0, 0, 0]} />

      <div className="mb-2.5 text-[13px] font-bold text-ink/55">Recent PR</div>
      {stats?.recentPr ? (
        <div className="rounded-2xl border-[1.5px] border-volt/40 bg-volt/10 px-3.5 py-3 text-sm font-semibold">
          {stats.recentPr.exerciseName} — {stats.recentPr.value} {stats.recentPr.unit}
        </div>
      ) : (
        <div className="rounded-2xl border-[1.5px] border-ink/10 px-3.5 py-3 text-sm text-ink/50">
          Log a workout to see your first PR here.
        </div>
      )}

      <div className="mt-auto pt-6">
        <BottomNav active="progress" />
      </div>
    </main>
  );
}
