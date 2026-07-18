import { getYoutubeEmbedUrl } from "@/lib/utils";
import { Play } from "lucide-react";

export function ExerciseVisual({
  exercise,
  tone,
}: {
  exercise: { name: string; shortDemoVideoUrl?: string | null };
  tone: "volt" | "coral";
}) {
  const gradient =
    tone === "volt"
      ? "bg-[linear-gradient(160deg,oklch(0.3_0.06_130),oklch(0.2_0.03_130))]"
      : "bg-[linear-gradient(160deg,oklch(0.32_0.07_35),oklch(0.22_0.04_35))]";
  const embedUrl = getYoutubeEmbedUrl(exercise.shortDemoVideoUrl || null);
  return (
    <div className={`relative flex h-48 w-full items-center justify-center rounded-3xl overflow-hidden bg-black ${gradient}`}>
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
  );
}
