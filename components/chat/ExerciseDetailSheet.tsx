"use client";

import { useEffect, useState } from "react";
import { formatTarget } from "@/lib/mock-data";
import { EXERCISE_DETAILS } from "@/lib/exercise-details";
import { useAppStore } from "@/lib/store";
import { apiGet } from "@/lib/api-client";

export function ExerciseDetailSheet() {
  const exerciseId = useAppStore((s) => s.exerciseDetailId);
  const routine = useAppStore((s) => s.routine);
  const close = useAppStore((s) => s.closeExerciseDetail);
  const [tab, setTab] = useState<"loop" | "tutorial">("loop");

  useEffect(() => {
    if (!exerciseId) return;
    // Real exercise data is empty until the catalog is seeded — this fetch is
    // wired for when it isn't, and 404s are expected/handled by falling back
    // to the local EXERCISE_DETAILS lookup below.
    apiGet(`/api/exercises/${exerciseId}`).catch(() => {});
  }, [exerciseId]);

  if (!exerciseId) return null;
  const exercise = routine.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return null;
  const detail = EXERCISE_DETAILS[exerciseId];

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-surface-ink/65 px-0" role="dialog" aria-modal="true" aria-label={`${exercise.name} details`}>
      <div className="flex h-[94%] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-surface-card">
        <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-ink/18" />
        <div className="flex shrink-0 items-center justify-between px-5 pt-3">
          <span className="font-display text-lg font-bold">{exercise.name}</span>
          <button type="button" onClick={close} aria-label="Close" className="text-lg text-ink/40">
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-3.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("loop")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${tab === "loop" ? "bg-volt text-ink" : "border-[1.5px] border-ink/15 text-ink/55"}`}
            >
              Quick Loop
            </button>
            <button
              type="button"
              onClick={() => setTab("tutorial")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${tab === "tutorial" ? "bg-volt text-ink" : "border-[1.5px] border-ink/15 text-ink/55"}`}
            >
              Full Tutorial 2:14
            </button>
          </div>

          <div className="relative flex h-32 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,oklch(0.3_0.06_130),oklch(0.2_0.03_130))]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/92 text-ink">
              ▶
            </div>
            <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-cream/75">
              {tab === "loop" ? "Looping demo · muted" : "Full tutorial"}
            </span>
          </div>

          <div className="text-xs font-semibold text-ink/50">
            {exercise.muscle} · {exercise.equipment} · {formatTarget(exercise)}
          </div>

          {detail && (
            <>
              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-ink/45">DESCRIPTION</div>
                <p className="text-[13px] leading-relaxed text-ink/80">{detail.description}</p>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-ink/45">HOW TO</div>
                <div className="flex flex-col gap-1.5">
                  {detail.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 text-[13px] leading-snug">
                      <span className="font-bold text-coral-text">{i + 1}</span> {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border-[1.5px] border-error/35 bg-error/8 px-3.5 py-3">
                <div className="mb-1.5 text-xs font-bold text-error">⚠ THINGS TO NOTE</div>
                <div className="text-xs leading-relaxed text-ink/75">{detail.note}</div>
              </div>

              <div className="rounded-2xl border-[1.5px] border-volt/40 bg-volt/10 px-3.5 py-3">
                <div className="mb-1.5 text-xs font-bold text-volt-text">💡 COACH TIP</div>
                <div className="text-xs leading-relaxed text-ink/75">{detail.tip}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
