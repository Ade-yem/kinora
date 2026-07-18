import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const routineGenerationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "kinora:routine-gen",
});

export async function checkRoutineGenerationLimit(userId: string) {
  const { success, reset } = await routineGenerationLimiter.limit(userId);
  return { success, retryAfterSeconds: success ? 0 : Math.ceil((reset - Date.now()) / 1000) };
}