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
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-2 font-display text-2xl font-bold">Customize Your Profile</h1>
      <p className="mb-6 text-sm text-ink/50">These settings form the durable baseline of your personal training profile.</p>

      {/* Experience Level */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink/40">Experience Level</h2>
        <div className="flex flex-col gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onSelectExperience(level.value)}
              className={`flex flex-col rounded-2xl border-[1.5px] p-4 text-left transition-all ${
                experienceLevel === level.value
                  ? "border-volt bg-volt/5 text-ink font-semibold"
                  : "border-ink/15 hover:border-ink/30 text-ink/80"
              }`}
            >
              <span className="text-sm font-bold">{level.label}</span>
              <span className="text-xs text-ink/50 mt-1">{level.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Location */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink/40">Preferred Location</h2>
        <div className="grid grid-cols-2 gap-3">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={() => onSelectLocation(loc.value as Location)}
              className={`flex flex-col rounded-2xl border-[1.5px] p-4 text-left transition-all ${
                preferredLocation === loc.value
                  ? "border-volt bg-volt/5 text-ink font-semibold"
                  : "border-ink/15 hover:border-ink/30 text-ink/80"
              }`}
            >
              <span className="text-sm font-bold">{loc.label}</span>
              <span className="text-xs text-ink/50 mt-1">{loc.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="dark"
        className="mt-auto"
        disabled={!experienceLevel || !preferredLocation}
        onClick={onContinue}
      >
        Finish Setup
      </Button>
    </div>
  );
}
