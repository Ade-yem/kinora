"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Location } from "@/types";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Just starting out or returning after a break" },
  { value: "intermediate", label: "Intermediate", desc: "Know the basics and train regularly" },
  { value: "advanced", label: "Advanced", desc: "Years of consistent training and solid technique" },
];

const LOCATIONS = [
  { value: "home", label: "Home", desc: "Train with bodyweight, bands, or dumbbells" },
  { value: "gym", label: "Gym", desc: "Access to barbells, cables, and machines" },
];

interface OnboardBiodata {
  weight: number | null;
  height: number | null;
  dateOfBirth: string | null;
  biologicalSex: string | null;
  unitsPreference: string;
}

export function BiodataStep({
  experienceLevel,
  preferredLocation,
  onSelectExperience,
  onSelectLocation,
  onContinue,
}: {
  experienceLevel: string | null;
  preferredLocation: Location | null;
  onSelectExperience: (level: string) => void;
  onSelectLocation: (loc: Location) => void;
  onContinue: (data: OnboardBiodata) => void;
}) {
  const [unitsPreference, setUnitsPreference] = useState<"lb" | "kg">("lb");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [biologicalSex, setBiologicalSex] = useState<string | null>(null);

  const handleFinish = () => {
    onContinue({
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      dateOfBirth: dateOfBirth || null,
      biologicalSex: biologicalSex || null,
      unitsPreference,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="mb-2 font-display text-2xl font-bold">Customize Your Profile</h1>
        <p className="text-sm text-ink/50">These settings form the baseline of your personal training profile.</p>
      </div>

      {/* Part 1: Biodata Fields */}
      <div className="flex flex-col gap-4 border border-ink/10 rounded-2xl p-5 bg-surface-card/30">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/60 mb-1">Personal Details</h2>

        {/* Units Preference */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">Units Preference</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-card rounded-xl border border-ink/10">
            <button
              type="button"
              onClick={() => setUnitsPreference("lb")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                unitsPreference === "lb"
                  ? "bg-ink text-cream"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              Imperial (lb / in)
            </button>
            <button
              type="button"
              onClick={() => setUnitsPreference("kg")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                unitsPreference === "kg"
                  ? "bg-ink text-cream"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              Metric (kg / cm)
            </button>
          </div>
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">
              Weight ({unitsPreference === "lb" ? "lb" : "kg"})
            </label>
            <input
              id="weight"
              type="number"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unitsPreference === "lb" ? "e.g. 165" : "e.g. 75"}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-volt focus:outline-none transition-all bg-surface-card text-ink"
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">
              Height ({unitsPreference === "lb" ? "in" : "cm"})
            </label>
            <input
              id="height"
              type="number"
              step="any"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={unitsPreference === "lb" ? "e.g. 70" : "e.g. 175"}
              className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-volt focus:outline-none transition-all bg-surface-card text-ink"
            />
          </div>
        </div>

        {/* Biological Sex */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">Biological Sex</label>
          <div className="grid grid-cols-3 gap-2">
            {["Male", "Female", "Other"].map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() => setBiologicalSex(sex)}
                className={`py-2.5 rounded-xl border transition-all text-sm font-semibold cursor-pointer ${
                  biologicalSex === sex
                    ? "border-volt bg-volt/5 text-ink font-semibold"
                    : "border-ink/15 hover:border-ink/30 text-ink/65 bg-surface-card"
                }`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm focus:border-volt focus:outline-none transition-all bg-surface-card text-ink"
          />
        </div>
      </div>

      {/* Part 2: Training Profile */}
      <div className="flex flex-col gap-4">
        {/* Experience Level */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/40">Experience Level</h2>
          <div className="flex flex-col gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onSelectExperience(level.value)}
                className={`flex flex-col rounded-2xl border-[1.5px] p-4 text-left transition-all cursor-pointer ${
                  experienceLevel === level.value
                    ? "border-volt bg-volt/5 text-ink font-semibold"
                    : "border-ink/15 hover:border-ink/30 text-ink/80 bg-surface-card"
                }`}
              >
                <span className="text-sm font-bold">{level.label}</span>
                <span className="text-xs text-ink/50 mt-1">{level.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Location */}
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink/40">Preferred Location</h2>
          <div className="grid grid-cols-2 gap-3">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                type="button"
                onClick={() => onSelectLocation(loc.value as Location)}
                className={`flex flex-col rounded-2xl border-[1.5px] p-4 text-left transition-all cursor-pointer ${
                  preferredLocation === loc.value
                    ? "border-volt bg-volt/5 text-ink font-semibold"
                    : "border-ink/15 hover:border-ink/30 text-ink/80 bg-surface-card"
                }`}
              >
                <span className="text-sm font-bold">{loc.label}</span>
                <span className="text-xs text-ink/50 mt-1">{loc.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="dark"
        className="mt-4 mb-8 cursor-pointer"
        disabled={!experienceLevel || !preferredLocation}
        onClick={handleFinish}
      >
        Finish Setup
      </Button>
    </div>
  );
}
