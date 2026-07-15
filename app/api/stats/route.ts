import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeStreakDays(performedAtDates: Date[]): number {
  if (performedAtDates.length === 0) return 0;

  const uniqueDays = Array.from(new Set(performedAtDates.map(dateKey))).sort().reverse();
  const todayKey = dateKey(new Date());
  const diffFromToday = Math.round((Date.parse(todayKey) - Date.parse(uniqueDays[0])) / DAY_MS);

  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = Math.round((Date.parse(uniqueDays[i - 1]) - Date.parse(uniqueDays[i])) / DAY_MS);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeWeeklyVolume(logs: { performedAt: Date; totalVolumeKg: number | null }[]): number[] {
  const days = new Array(7).fill(0) as number[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const log of logs) {
    const performedDay = new Date(log.performedAt);
    performedDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - performedDay.getTime()) / DAY_MS);

    if (diffDays >= 0 && diffDays < 7) {
      days[6 - diffDays] += log.totalVolumeKg ?? 0;
    }
  }

  return days;
}

interface RecentPr {
  exerciseName: string;
  value: number;
  unit: "reps";
}

async function computeRecentPr(mostRecentLog: { entries: unknown } | undefined): Promise<RecentPr | null> {
  if (!mostRecentLog) return null;

  const entries = mostRecentLog.entries as
    | { exerciseId: string; sets: { reps?: number }[] }[]
    | null;

  if (!Array.isArray(entries) || entries.length === 0) return null;

  let best: { exerciseId: string; reps: number } | null = null;
  for (const entry of entries) {
    for (const set of entry.sets ?? []) {
      if (typeof set.reps === "number" && (!best || set.reps > best.reps)) {
        best = { exerciseId: entry.exerciseId, reps: set.reps };
      }
    }
  }

  if (!best) return null;

  const exercise = await prisma.exercise.findUnique({
    where: { id: best.exerciseId },
    select: { name: true },
  });

  return { exerciseName: exercise?.name ?? "Exercise", value: best.reps, unit: "reps" };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const logs = await prisma.workoutLog.findMany({
      where: { userId: session.user.id },
      select: { performedAt: true, totalVolumeKg: true, entries: true },
      orderBy: { performedAt: "desc" },
    });

    const totalWorkouts = logs.length;
    const streakDays = computeStreakDays(logs.map((l: (typeof logs)[number]) => l.performedAt));
    const weeklyVolume = computeWeeklyVolume(logs);
    const recentPr = await computeRecentPr(logs[0]);

    return respondOk({ totalWorkouts, streakDays, weeklyVolume, recentPr });
  } catch (error) {
    return respondError(error);
  }
}
