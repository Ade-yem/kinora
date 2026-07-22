import type { StatsData } from "@/types";
import { Flame, Trophy, Activity, Award } from "lucide-react";

export function ThisWeekStatStrip({ stats }: { stats: StatsData | null }) {
  if (!stats) return null;

  const { totalWorkouts, streakDays, weeklyVolume, recentPr } = stats;

  const maxVolume = Math.max(...(weeklyVolume || []), 1);

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-ink/8 bg-ink/2 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
        This Week Overview
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Streak Stat */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink/40 uppercase">
            <Flame className="w-3.5 h-3.5 text-coral fill-coral/10" />
            Streak
          </div>
          <div className="mt-2 font-display text-lg font-black text-ink">
            {streakDays} {streakDays === 1 ? "Day" : "Days"}
          </div>
        </div>

        {/* Workouts Stat */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink/40 uppercase">
            <Trophy className="w-3.5 h-3.5 text-volt" />
            Total
          </div>
          <div className="mt-2 font-display text-lg font-black text-ink">
            {totalWorkouts} {totalWorkouts === 1 ? "Session" : "Sessions"}
          </div>
        </div>

        {/* Volume Stat with Sparkline */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink/40 uppercase">
            <Activity className="w-3.5 h-3.5 text-ink/40" />
            Volume
          </div>
          <div className="flex items-end gap-[3px] h-6 mt-2 justify-center">
            {weeklyVolume.map((vol, idx) => {
              const heightPercent = maxVolume > 0 ? (vol / maxVolume) * 100 : 0;
              return (
                <div
                  key={idx}
                  style={{ height: `${Math.max(15, heightPercent)}%` }}
                  className={`w-[4px] rounded-t-sm transition-all ${
                    vol > 0 ? "bg-volt" : "bg-ink/10"
                  }`}
                  title={`${vol} kg`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent PR Banner */}
      {recentPr && (
        <div className="flex items-center gap-2 rounded-xl bg-volt/8 px-3 py-2 text-[11px] font-semibold text-ink/80 border border-volt/10">
          <Award className="w-4 h-4 text-volt shrink-0" />
          <span>
            Recent PR: <strong className="text-ink">{recentPr.value} {recentPr.unit}</strong> on {recentPr.exerciseName}
          </span>
        </div>
      )}
    </div>
  );
}
