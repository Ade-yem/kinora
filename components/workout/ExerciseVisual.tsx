export function ExerciseVisual({
  tone,
  icon,
  onInfoClick,
}: {
  tone: "volt" | "coral";
  icon: string;
  onInfoClick?: () => void;
}) {
  const gradient =
    tone === "volt"
      ? "bg-[linear-gradient(160deg,oklch(0.3_0.06_130),oklch(0.2_0.03_130))]"
      : "bg-[linear-gradient(160deg,oklch(0.32_0.07_35),oklch(0.22_0.04_35))]";

  return (
    <div className={`relative flex h-48 items-center justify-center rounded-3xl ${gradient}`}>
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      {onInfoClick && (
        <button
          type="button"
          onClick={onInfoClick}
          aria-label="View exercise details"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-xl bg-cream/12 text-sm"
        >
          ❓
        </button>
      )}
    </div>
  );
}
