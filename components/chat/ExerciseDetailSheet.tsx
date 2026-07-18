"use client";

import { useEffect, useState } from "react";
import { formatTarget, getYoutubeEmbedUrl } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiGet } from "@/lib/api-client";
import {
  X,
  Play,
  Info,
  Activity,
  Dumbbell,
  Wind,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

import type { ExerciseDetail } from "@/types";

export function ExerciseDetailSheet() {
  const exerciseId = useAppStore((s) => s.exerciseDetailId);
  const routine = useAppStore((s) => s.routine);
  const close = useAppStore((s) => s.closeExerciseDetail);
  const [tab, setTab] = useState<"loop" | "tutorial">("loop");
  const [dbExercise, setDbExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    setLoading(true);
    apiGet<ExerciseDetail>(`/api/exercises/${exerciseId}`)
      .then((data) => {
        setDbExercise(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load exercise details:", err);
        setLoading(false);
      });
  }, [exerciseId]);

  if (!exerciseId) return null;
  const exercise = routine.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return null;

  const videoUrl = tab === "loop"
    ? (dbExercise?.shortDemoVideoUrl ?? null)
    : (dbExercise?.inDepthExplanationVideoUrl ?? null);
  const embedUrl = getYoutubeEmbedUrl(videoUrl);

  let parsedInstructions: {
    setup?: {
      posture_and_alignment?: string;
      grip_and_stance?: string;
    };
    execution?: {
      phase_by_phase_steps?: string;
      range_of_motion?: string;
      tempo?: string;
    };
    breathing_technique?: {
      inhale?: string;
      exhale?: string;
      key_rule?: string;
    };
    safety_and_common_mistakes?: unknown;
  } | null = null;

  if (dbExercise?.instructions) {
    if (typeof dbExercise.instructions === "object" && dbExercise.instructions !== null) {
      parsedInstructions = dbExercise.instructions as unknown as typeof parsedInstructions;
    } else if (typeof dbExercise.instructions === "string") {
      try {
        parsedInstructions = JSON.parse(dbExercise.instructions);
      } catch (e) {
        console.error("Failed to parse instructions JSON:", e);
      }
    }
  }

  let whatToAvoid: string[] = [];
  let modifications: string[] = [];

  if (parsedInstructions?.safety_and_common_mistakes) {
    const mistakes = parsedInstructions.safety_and_common_mistakes;
    if (Array.isArray(mistakes)) {
      mistakes.forEach((item: unknown) => {
        const strItem = String(item);
        if (strItem.toLowerCase().startsWith("what to avoid:") || strItem.toLowerCase().startsWith("what to avoid")) {
          const content = strItem.replace(/^what\s+to\s+avoid:\s*/i, "");
          whatToAvoid = content.split(";").map((s) => s.trim()).filter(Boolean);
        } else if (strItem.toLowerCase().startsWith("modifications:") || strItem.toLowerCase().startsWith("modifications")) {
          const content = strItem.replace(/^modifications:\s*/i, "");
          modifications = content.split(";").map((s) => s.trim()).filter(Boolean);
        } else {
          whatToAvoid.push(strItem);
        }
      });
    } else if (mistakes && typeof mistakes === "object") {
      const mistakesObj = mistakes as { what_to_avoid?: unknown[]; modifications?: unknown[] };
      if (Array.isArray(mistakesObj.what_to_avoid)) {
        whatToAvoid = mistakesObj.what_to_avoid.map(String);
      }
      if (Array.isArray(mistakesObj.modifications)) {
        modifications = mistakesObj.modifications.map(String);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-surface-ink/65 px-0 z-100"
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.name} details`}
    >
      <div className="flex h-[94%] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-surface-card border-t border-ink/10">
        <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-ink/18" />
        <div className="flex shrink-0 items-center justify-between px-5 pt-3">
          <span className="font-display text-lg font-bold text-ink">{exercise.name}</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-full p-1.5 hover:bg-ink/5 text-ink/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-3.5 hide-scrollbar">
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTab("loop")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${tab === "loop"
                ? "bg-volt text-ink"
                : "border-[1.5px] border-ink/15 text-ink/55 hover:bg-ink/5"
                }`}
            >
              Quick Loop
            </button>
            <button
              type="button"
              onClick={() => setTab("tutorial")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${tab === "tutorial"
                ? "bg-volt text-ink"
                : "border-[1.5px] border-ink/15 text-ink/55 hover:bg-ink/5"
                }`}
            >
              Full Tutorial
            </button>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={`${exercise.name} video`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(160deg,oklch(0.3_0.06_130),oklch(0.2_0.03_130))]">
                <Play className="w-8 h-8 text-cream/90 fill-cream/90" />
                <span className="mt-2 text-xs text-cream/70">No demonstration video available</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-10">
              <Activity className="h-6 w-6 animate-spin text-volt-text" />
            </div>
          ) : (
            <>
              {/* Tags */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink/50">
                <span className="rounded-full bg-ink/5 px-2.5 py-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-ink/40" />
                  {dbExercise?.primeMoverMuscle || exercise.muscle || "General Muscle"}
                </span>
                <span className="rounded-full bg-ink/5 px-2.5 py-1 flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-ink/40" />
                  {dbExercise?.primaryEquipment || exercise.equipment || "Bodyweight"}
                </span>
                <span className="rounded-full bg-ink/5 px-2.5 py-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-ink/40" />
                  {formatTarget(exercise)}
                </span>
              </div>

              {/* Description */}
              {dbExercise?.difficultyLevel && (
                <div className="text-[13px] text-ink/75 leading-relaxed">
                  <span className="font-bold text-ink">Difficulty:</span> {dbExercise.difficultyLevel}
                </div>
              )}

              {/* Setup */}
              {parsedInstructions?.setup && (
                <div className="rounded-2xl border border-ink/8 bg-ink/2 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-ink/40" />
                    <span>Setup & Alignment</span>
                  </div>
                  <div className="text-[13px] leading-relaxed text-ink/80 flex flex-col gap-2">
                    {parsedInstructions.setup.posture_and_alignment && (
                      <p>{parsedInstructions.setup.posture_and_alignment}</p>
                    )}
                    {parsedInstructions.setup.grip_and_stance && (
                      <p>{parsedInstructions.setup.grip_and_stance}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Execution steps */}
              {parsedInstructions?.execution && (
                <div className="rounded-2xl border border-ink/8 bg-ink/2 p-4">
                  <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink/45 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-ink/40" />
                    <span>Execution Steps</span>
                  </div>
                  <div className="text-[13px] leading-relaxed text-ink/80 flex flex-col gap-2.5">
                    {parsedInstructions.execution.phase_by_phase_steps && (
                      <div className="whitespace-pre-line">
                        {parsedInstructions.execution.phase_by_phase_steps}
                      </div>
                    )}
                    {parsedInstructions.execution.range_of_motion && (
                      <p className="text-xs text-ink/65 border-t border-ink/5 pt-2 mt-1">
                        <strong>Range of Motion:</strong> {parsedInstructions.execution.range_of_motion}
                      </p>
                    )}
                    {parsedInstructions.execution.tempo && (
                      <p className="text-xs text-ink/65">
                        <strong>Tempo:</strong> {parsedInstructions.execution.tempo}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Breathing */}
              {parsedInstructions?.breathing_technique && (
                <div className="rounded-2xl border border-ink/8 bg-ink/2 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-ink/40" />
                    <span>Breathing Technique</span>
                  </div>
                  <div className="text-[13px] leading-relaxed text-ink/80 flex flex-col gap-1.5">
                    {parsedInstructions.breathing_technique.inhale && (
                      <p>{parsedInstructions.breathing_technique.inhale}</p>
                    )}
                    {parsedInstructions.breathing_technique.exhale && (
                      <p>{parsedInstructions.breathing_technique.exhale}</p>
                    )}
                    {parsedInstructions.breathing_technique.key_rule && (
                      <p className="text-xs text-ink/60 italic border-t border-ink/5 pt-1.5">
                        {parsedInstructions.breathing_technique.key_rule}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Safety */}
              {whatToAvoid.length > 0 && (
                <div className="rounded-2xl border border-coral/25 bg-coral/6 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-coral-text flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Mistakes to Avoid</span>
                  </div>
                  <ul className="list-disc pl-5 text-[13px] leading-relaxed text-ink/80 flex flex-col gap-1">
                    {whatToAvoid.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modifications */}
              {modifications.length > 0 && (
                <div className="rounded-2xl border border-volt/25 bg-volt/6 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-volt-text flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Modifications & Progressions</span>
                  </div>
                  <ul className="list-disc pl-5 text-[13px] leading-relaxed text-ink/80 flex flex-col gap-1">
                    {modifications.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
