"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Trophy, Dumbbell, Clock, Flame, Award, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import type { Routine } from "@/types";

export function CompletionCelebration({ routine }: { routine: Routine }) {
  const stats = useAppStore((s) => s.stats);
  const fetchStats = useAppStore((s) => s.fetchStats);
  const workout = useAppStore((s) => s.workout);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculate session elapsed time
  const durationSeconds = workout.startedAt
    ? Math.round((Date.now() - workout.startedAt) / 1000)
    : 0;
  const durationMin = Math.max(1, Math.round(durationSeconds / 60));

  // Calculate session volume
  const totalReps = workout.entries.reduce((sum, entry) => {
    return sum + entry.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0);
  }, 0);
  const totalSeconds = workout.entries.reduce((sum, entry) => {
    return sum + entry.sets.reduce((setSum, set) => setSum + (set.seconds || 0), 0);
  }, 0);
  const volumeKg = Math.round(totalReps * 15 + totalSeconds * 0.8);

  const prMessage = stats?.recentPr
    ? `New PR: ${stats.recentPr.exerciseName} (${stats.recentPr.value} reps) — nice work.`
    : `Completed all ${routine.exercises.length} exercises successfully — nice work.`;

  return (
    <div className="flex flex-1 flex-col px-1 text-cream">
      <div className="pt-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-volt text-volt-text">
          <Trophy className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold">Workout Crushed!</h1>
        <p className="mt-1.5 text-sm text-cream/60">{routine.title || "Today's session"}</p>
      </div>

      {/* Stats Cards Row */}
      <div className="mt-6 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-cream/6 py-3.5 text-center flex flex-col items-center justify-center border border-cream/5">
          <Dumbbell className="h-5 w-5 text-cream/40 mb-1" />
          <div className="font-display text-lg font-bold">
            {volumeKg.toLocaleString()}<span className="text-[10px] font-semibold text-cream/60 ml-0.5">kg</span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-cream/30 mt-0.5">volume</div>
        </div>
        <div className="flex-1 rounded-2xl bg-cream/6 py-3.5 text-center flex flex-col items-center justify-center border border-cream/5">
          <Clock className="h-5 w-5 text-cream/40 mb-1" />
          <div className="font-display text-lg font-bold">
            {durationMin}<span className="text-[10px] font-semibold text-cream/60 ml-0.5">min</span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-cream/30 mt-0.5">time</div>
        </div>
        <div className="flex-1 rounded-2xl border border-coral/30 bg-coral/10 py-3.5 text-center flex flex-col items-center justify-center">
          <Flame className="h-5 w-5 text-coral/80 mb-1 animate-pulse" />
          <div className="font-display text-lg font-bold text-coral-text">
            {stats?.streakDays || 1}<span className="text-[10px] font-semibold ml-0.5">days</span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-coral/40 mt-0.5">streak</div>
        </div>
      </div>

      {/* PR / Motivation Card */}
      <div className="mt-5 rounded-2xl border border-volt/20 bg-volt/5 px-4 py-3.5 text-sm leading-snug flex items-start gap-3">
        <Award className="h-5 w-5 text-volt shrink-0 mt-0.5" />
        <span className="text-cream/90">{prMessage}</span>
      </div>

      {/* CTAs */}
      <div className="mt-auto flex flex-col gap-3 pb-9">
        <Button
          variant="primary"
          href="/chat"
          className="w-full bg-volt text-volt-text font-bold hover:bg-opacity-90 active:scale-98 transition-all text-base py-3.5 rounded-2xl flex justify-center items-center gap-2 cursor-pointer shadow-md"
        >
          <MessageSquare className="h-5 w-5" />
          Tell Coach How It Felt
        </Button>
        <Link href="/home" className="text-center text-sm font-bold text-cream/40 hover:text-cream/70 transition-colors py-2">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
