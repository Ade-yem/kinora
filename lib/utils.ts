import type { RoutineExercise } from "../types";

export function formatTarget(exercise: RoutineExercise): string {
  const { target, sets } = exercise;
  if ("seconds" in target) return `${sets}×${target.seconds}s`;
  return target.side ? `${sets}×${target.reps}/side` : `${sets}×${target.reps}`;
}

export const getEquipmentSummary = (exercises: RoutineExercise[]): string => {
  if (!exercises || exercises.length === 0) return "bodyweight";

  const equipments = new Set<string>();

  exercises.forEach((ex) => {
    if (ex.equipment) {
      equipments.add(ex.equipment.toLowerCase().trim());
    }
  });

  // Clean up common variants
  if (equipments.has("body weight")) equipments.delete("body weight");
  if (equipments.has("bodyweight")) equipments.delete("bodyweight");

  if (equipments.size === 0) return "bodyweight";
  return Array.from(equipments).join(" + ");
};

export function getYoutubeEmbedUrl(url: string | null) {
  if (!url) return null;
  // Handle short URLs: https://youtu.be/abc
  let match = url.match(/youtu\.be\/([^?#]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0&loop=1&playlist=${match[1]}`;
  // Handle watch/embed URLs
  match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0&loop=1&playlist=${match[1]}`;
  return url;
}