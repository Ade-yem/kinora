"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Home, Dumbbell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Button } from "@/components/ui/Button";

const AVAILABLE_EQUIPMENT = [
  "Dumbbell",
  "Barbell",
  "Kettlebell",
  "Pull-up Bar",
  "Resistance Band",
  "Bodyweight",
];

export default function EquipmentPage() {
  useRequireAuth();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const fetchProfile = useAppStore((s) => s.fetchProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [location, setLocation] = useState<"home" | "gym">("home");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setLocation(profile.location === "gym" ? "gym" : "home");
      setSelectedEquipment(profile.equipment || []);
    }
  }, [profile]);

  const handleToggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        location,
        equipment: selectedEquipment,
      });
      router.push("/profile");
    } catch (error) {
      console.error("Failed to save profile:", error);
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
        <h1 className="font-display text-xl font-bold">Equipment & Location</h1>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Workout Location Selector */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">
            Workout Location
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLocation("home")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-[2px] transition cursor-pointer text-center ${
                location === "home"
                  ? "border-coral bg-surface shadow-sm"
                  : "border-ink/5 bg-ink/3 hover:bg-ink/5 opacity-80"
              }`}
            >
              <Home className={`h-6 w-6 ${location === "home" ? "text-coral" : "text-ink/60"}`} />
              <div className="font-display text-sm font-bold">Home</div>
              <div className="text-[11px] text-ink/50 leading-tight">Bodyweight & simple gear</div>
            </button>

            <button
              onClick={() => setLocation("gym")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-[2px] transition cursor-pointer text-center ${
                location === "gym"
                  ? "border-coral bg-surface shadow-sm"
                  : "border-ink/5 bg-ink/3 hover:bg-ink/5 opacity-80"
              }`}
            >
              <Dumbbell className={`h-6 w-6 ${location === "gym" ? "text-coral" : "text-ink/60"}`} />
              <div className="font-display text-sm font-bold">Gym</div>
              <div className="text-[11px] text-ink/50 leading-tight">Access to full equipment</div>
            </button>
          </div>
        </div>

        {/* Available Equipment Multi-Select */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">
            Available Equipment
          </h2>
          <div className="flex flex-col gap-2">
            {AVAILABLE_EQUIPMENT.map((eq) => {
              const isSelected = selectedEquipment.includes(eq);
              return (
                <button
                  key={eq}
                  onClick={() => handleToggleEquipment(eq)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? "border-volt bg-volt/5 text-ink font-bold"
                      : "border-ink/8 hover:bg-ink/3 text-ink/80"
                  }`}
                >
                  <span className="text-sm font-semibold">{eq}</span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      isSelected
                        ? "bg-volt border-volt text-ink"
                        : "border-ink/20"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
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
