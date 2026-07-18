"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Button } from "@/components/ui/Button";

interface InjuryEntry {
  bodyPart: string;
  severity?: "mild" | "moderate" | "severe";
  note?: string;
}

const COMMON_BODY_PARTS = ["Shoulder", "Lower Back", "Knee", "Neck", "Wrist", "Ankle"];

export default function InjuriesPage() {
  useRequireAuth();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const fetchProfile = useAppStore((s) => s.fetchProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [injuriesNotes, setInjuriesNotes] = useState("");
  const [structuredInjuries, setStructuredInjuries] = useState<InjuryEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setInjuriesNotes(profile.injuriesNotes || "");
      // Map unknown Prisma Json value safely to InjuryEntry[]
      const parsedInjuries = Array.isArray(profile.injuries)
        ? (profile.injuries as unknown as InjuryEntry[])
        : [];
      setStructuredInjuries(parsedInjuries);
    }
  }, [profile]);

  const handleToggleBodyPart = (part: string) => {
    setStructuredInjuries((prev) => {
      const exists = prev.find((i) => i.bodyPart === part);
      if (exists) {
        return prev.filter((i) => i.bodyPart !== part);
      } else {
        return [...prev, { bodyPart: part, severity: "moderate" }];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        injuriesNotes,
        injuries: structuredInjuries,
      });
      router.push("/profile");
    } catch (error) {
      console.error("Failed to save injuries:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="font-display text-xl font-bold">Injuries & Limitations</h1>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Warning Alert Banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-error/8 p-4 text-error border border-error/10">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            Your coach uses this information to filter out exercises that could aggravate your injuries. Keep it up to date!
          </div>
        </div>

        {/* Quick Toggles */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">
            Sensitive Areas
          </h2>
          <div className="flex flex-wrap gap-2">
            {COMMON_BODY_PARTS.map((part) => {
              const isSelected = structuredInjuries.some((i) => i.bodyPart === part);
              return (
                <button
                  key={part}
                  onClick={() => handleToggleBodyPart(part)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    isSelected
                      ? "bg-coral text-cream border-coral"
                      : "bg-ink/3 border-ink/8 text-ink/75 hover:bg-ink/5"
                  }`}
                >
                  {part}
                </button>
              );
            })}
          </div>
        </div>

        {/* Freeform Notes */}
        <div className="flex flex-col flex-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-2">
            Freeform Details & Notes
          </h2>
          <textarea
            value={injuriesNotes}
            onChange={(e) => setInjuriesNotes(e.target.value)}
            placeholder="Describe any pain, injuries, or exercise preferences (e.g. 'Lower back pain during deadlifts. Avoid overhead pressing due to rotator cuff stiffness.')"
            className="w-full flex-1 min-h-[160px] p-4 rounded-2xl border border-ink/10 bg-surface text-sm focus:outline-none focus:border-volt/80 font-sans leading-relaxed resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="mt-auto pt-6">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-volt text-ink font-bold hover:bg-opacity-90 py-4 cursor-pointer rounded-2xl flex justify-center items-center"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </main>
  );
}
