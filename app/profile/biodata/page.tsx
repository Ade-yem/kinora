"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Home, Dumbbell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Button } from "@/components/ui/Button";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function BiodataPage() {
  useRequireAuth();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const fetchProfile = useAppStore((s) => s.fetchProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [preferredLocation, setPreferredLocation] = useState<"home" | "gym">("home");
  const [experienceLevel, setExperienceLevel] = useState<string>("beginner");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [biologicalSex, setBiologicalSex] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setPreferredLocation(profile.preferredLocation === "gym" ? "gym" : "home");
      setExperienceLevel(profile.experienceLevel || "beginner");
      setWeight(profile.weight ? profile.weight.toString() : "");
      setHeight(profile.height ? profile.height.toString() : "");
      setBiologicalSex(profile.biologicalSex || "");
      setDateOfBirth(profile.dateOfBirth || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        preferredLocation,
        experienceLevel,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        biologicalSex: biologicalSex || null,
        dateOfBirth: dateOfBirth || null,
      });
      router.push("/profile");
    } catch (error) {
      console.error("Failed to save biodata:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-6 text-ink">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 hover:bg-ink/10 transition cursor-pointer"
          aria-label="Back to Profile"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </button>
        <h1 className="font-display text-xl font-bold">Biodata & Preferences</h1>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Experience Level */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">
            Training Experience
          </h2>
          <div className="flex gap-2">
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = experienceLevel === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setExperienceLevel(level.value)}
                  className={`flex-1 py-3 px-1 rounded-xl border text-center transition cursor-pointer text-xs font-semibold ${
                    isSelected
                      ? "border-volt bg-volt/5 text-ink font-bold"
                      : "border-ink/8 hover:bg-ink/3 text-ink/65"
                  }`}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Preference */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">
            Location Preference
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPreferredLocation("home")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-[2px] transition cursor-pointer text-center ${
                preferredLocation === "home"
                  ? "border-coral bg-surface shadow-sm"
                  : "border-ink/5 bg-ink/3 hover:bg-ink/5 opacity-80"
              }`}
            >
              <Home className={`h-5 w-5 ${preferredLocation === "home" ? "text-coral" : "text-ink/60"}`} />
              <div className="font-display text-sm font-bold">Home</div>
            </button>

            <button
              onClick={() => setPreferredLocation("gym")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-[2px] transition cursor-pointer text-center ${
                preferredLocation === "gym"
                  ? "border-coral bg-surface shadow-sm"
                  : "border-ink/5 bg-ink/3 hover:bg-ink/5 opacity-80"
              }`}
            >
              <Dumbbell className={`h-5 w-5 ${preferredLocation === "gym" ? "text-coral" : "text-ink/60"}`} />
              <div className="font-display text-sm font-bold">Gym</div>
            </button>
          </div>
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="block text-xs font-bold uppercase tracking-wider text-ink/50 mb-2">
              Weight ({profile?.unitsPreference || "lb"})
            </label>
            <input
              id="weight"
              type="number"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 165"
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-xs font-bold uppercase tracking-wider text-ink/50 mb-2">
              Height ({profile?.unitsPreference === "lb" ? "in" : "cm"})
            </label>
            <input
              id="height"
              type="number"
              step="any"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 70"
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Biological Sex & Birthdate */}
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="biologicalSex" className="block text-xs font-bold uppercase tracking-wider text-ink/50 mb-2">
              Biological Sex
            </label>
            <input
              id="biologicalSex"
              type="text"
              value={biologicalSex}
              onChange={(e) => setBiologicalSex(e.target.value)}
              placeholder="e.g. Male, Female"
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-ink/40 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-xs font-bold uppercase tracking-wider text-ink/50 mb-2">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-ink/40 focus:outline-none bg-surface text-ink"
            />
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
