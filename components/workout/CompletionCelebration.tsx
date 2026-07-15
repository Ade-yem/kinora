import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Routine } from "@/lib/types";

export function CompletionCelebration({ routine }: { routine: Routine }) {
  return (
    <div className="flex flex-1 flex-col px-1">
      <div className="pt-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-volt text-4xl">
          🏆
        </div>
        <h1 className="font-display text-2xl font-bold">Workout Crushed!</h1>
        <p className="mt-1.5 text-sm text-cream/60">{routine.title || "Today's session"}</p>
      </div>

      <div className="mt-6 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-cream/6 py-3.5 text-center">
          <div className="font-display text-xl font-bold">
            2,340<span className="text-[11px] font-semibold">kg</span>
          </div>
          <div className="mt-0.5 text-[11px] text-cream/50">volume</div>
        </div>
        <div className="flex-1 rounded-2xl bg-cream/6 py-3.5 text-center">
          <div className="font-display text-xl font-bold">
            28<span className="text-[11px] font-semibold">min</span>
          </div>
          <div className="mt-0.5 text-[11px] text-cream/50">time</div>
        </div>
        <div className="flex-1 rounded-2xl border border-coral/40 bg-coral/16 py-3.5 text-center">
          <div className="font-display text-xl font-bold">🔥7</div>
          <div className="mt-0.5 text-[11px] text-cream/65">day streak</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-volt/35 bg-volt/12 px-4 py-3.5 text-sm leading-snug">
        🎉 New PR on {routine.exercises[0]?.name ?? "your lift"} — nice work.
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-9">
        <Button variant="primary" href="/feedback">
          Tell Coach How It Felt →
        </Button>
        <Link href="/home" className="text-center text-sm font-bold text-cream/50">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
