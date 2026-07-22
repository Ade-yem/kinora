"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldAlert, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Button } from "@/components/ui/Button";
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";

interface Injury {
  id: string;
  bodyPart: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  note: string | null;
  onsetDate: string | null;
  status: "ACTIVE" | "RECOVERING" | "RESOLVED";
}

const COMMON_BODY_PARTS = ["Shoulder", "Lower Back", "Knee", "Neck", "Wrist", "Ankle"];

export default function InjuriesPage() {
  useRequireAuth();
  const router = useRouter();

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [bodyPart, setBodyPart] = useState("");
  const [severity, setSeverity] = useState<"MILD" | "MODERATE" | "SEVERE">("MODERATE");
  const [note, setNote] = useState("");
  const [onsetDate, setOnsetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInjuries = async () => {
    try {
      const res = await apiGet<{ injuries: Injury[] }>("/api/injuries");
      setInjuries(res.injuries);
    } catch (error) {
      console.error("Failed to fetch injuries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInjuries();
  }, []);

  const handleAddInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bodyPart.trim()) return;

    setIsSubmitting(true);
    try {
      await apiPost("/api/injuries", {
        bodyPart: bodyPart.trim(),
        severity,
        note: note.trim() || undefined,
        onsetDate: onsetDate || undefined,
      });
      // Clear form
      setBodyPart("");
      setSeverity("MODERATE");
      setNote("");
      setOnsetDate("");
      // Refresh
      await fetchInjuries();
    } catch (error) {
      console.error("Failed to add injury:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "ACTIVE" | "RECOVERING" | "RESOLVED") => {
    try {
      await apiPatch("/api/injuries", { id, status });
      await fetchInjuries();
    } catch (error) {
      console.error("Failed to update injury status:", error);
    }
  };

  const activeOrRecovering = injuries.filter(
    (i) => i.status === "ACTIVE" || i.status === "RECOVERING"
  );
  const resolved = injuries.filter((i) => i.status === "RESOLVED");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-6 text-ink">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 hover:bg-ink/10 transition cursor-pointer"
          aria-label="Back to Profile"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </button>
        <h1 className="font-display text-xl font-bold">Injuries & Safety</h1>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Warning Alert Banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-error/8 p-4 text-error border border-error/10">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            Your coach reviews this list before routine generation. Exercises affecting active or recovering areas will be excluded or adapted.
          </div>
        </div>

        {/* Current Injuries List */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">
            Active & Recovering
          </h2>
          {isLoading ? (
            <div className="text-sm text-ink/40 py-4">Loading safety profile...</div>
          ) : activeOrRecovering.length === 0 ? (
            <div className="text-sm text-ink/40 bg-ink/3 rounded-2xl p-4 text-center">
              No active injuries recorded. Safe training!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeOrRecovering.map((inj) => (
                <div key={inj.id} className="rounded-2xl border border-ink/10 p-4 bg-surface shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-display text-sm font-bold">{inj.bodyPart}</span>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-ink/5 px-2 py-0.5 rounded-md text-ink/60">
                        {inj.status}
                      </span>
                    </div>
                    {/* Severity Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inj.severity === "SEVERE"
                          ? "bg-error/10 text-error"
                          : inj.severity === "MODERATE"
                            ? "bg-coral/10 text-coral"
                            : "bg-volt/20 text-ink/80"
                      }`}
                    >
                      {inj.severity}
                    </span>
                  </div>
                  {inj.note && <p className="text-xs text-ink/65 mb-3 leading-normal">{inj.note}</p>}
                  {inj.onsetDate && (
                    <div className="text-[10px] text-ink/40 mb-3">
                      Onset: {new Date(inj.onsetDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex justify-end gap-2 border-t border-ink/5 pt-3 mt-1">
                    {inj.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inj.id, "RECOVERING")}
                        className="text-[11px] font-bold text-ink/60 hover:text-ink cursor-pointer bg-ink/5 hover:bg-ink/10 px-2.5 py-1 rounded-lg transition"
                      >
                        Start Recovery
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(inj.id, "RESOLVED")}
                      className="text-[11px] font-bold text-success hover:underline flex items-center gap-1 cursor-pointer bg-success/8 px-2.5 py-1 rounded-lg transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Injury Form */}
        <form onSubmit={handleAddInjury} className="rounded-2xl border border-ink/10 p-5 bg-ink/3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-4 flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Report Pain or Injury
          </h2>

          <div className="flex flex-col gap-4">
            {/* Body Part */}
            <div>
              <label htmlFor="form-bodyPart" className="sr-only">Body Part</label>
              <input
                id="form-bodyPart"
                type="text"
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                placeholder="e.g. Knee, Right Shoulder, Ankle"
                required
                className="w-full rounded-xl border border-ink/15 bg-surface px-4 py-2.5 text-sm focus:border-ink/40 focus:outline-none"
              />
              {/* Quick toggles */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_BODY_PARTS.map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setBodyPart(part)}
                    className="text-[10px] font-semibold text-ink/60 bg-surface border border-ink/10 px-2 py-1 rounded-lg hover:border-ink/30 cursor-pointer"
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-2">Severity</span>
              <div className="flex gap-2">
                {(["MILD", "MODERATE", "SEVERE"] as const).map((sev) => {
                  const isSelected = severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition cursor-pointer text-center ${
                        isSelected
                          ? sev === "SEVERE"
                            ? "bg-error text-cream border-error"
                            : sev === "MODERATE"
                              ? "bg-coral text-cream border-coral"
                              : "bg-ink text-cream border-ink"
                          : "bg-surface border-ink/10 text-ink/65 hover:border-ink/30"
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="form-note" className="sr-only">Notes</label>
              <textarea
                id="form-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add details (e.g. 'Hurts when squatting past 90 degrees', 'Avoid overhead movements.')"
                className="w-full rounded-xl border border-ink/15 bg-surface px-4 py-2.5 text-sm focus:border-ink/40 focus:outline-none resize-none h-20"
              />
            </div>

            {/* Onset Date */}
            <div>
              <label htmlFor="form-onsetDate" className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-2">
                Onset Date (Optional)
              </label>
              <input
                id="form-onsetDate"
                type="date"
                value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-surface px-4 py-2.5 text-sm focus:border-ink/40 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <Button
              variant="dark"
              type="submit"
              disabled={isSubmitting || !bodyPart.trim()}
              className="w-full py-3 text-xs font-bold cursor-pointer rounded-xl flex justify-center items-center"
            >
              {isSubmitting ? "Adding..." : "Add Injury to Safety Profile"}
            </Button>
          </div>
        </form>

        {/* Resolved Injuries (History) */}
        {resolved.length > 0 && (
          <div className="border-t border-ink/10 pt-4 mt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-3">
              Injury History (Resolved)
            </h2>
            <div className="flex flex-col gap-2">
              {resolved.map((inj) => (
                <div key={inj.id} className="rounded-xl border border-ink/5 p-3 bg-ink/2 flex justify-between items-center text-ink/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold line-through">{inj.bodyPart}</span>
                    {inj.note && <span className="text-[10px] text-ink/40 mt-0.5">{inj.note}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(inj.id, "ACTIVE")}
                    className="text-[9px] font-bold bg-ink/5 hover:bg-ink/10 px-2 py-1 rounded cursor-pointer transition text-ink/80"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
