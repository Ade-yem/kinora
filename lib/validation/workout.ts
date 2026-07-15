import { z } from "zod";

export const WorkoutListQuerySchema = z.object({
  routineId: z.string().optional(),
  page: z.string().default("1").transform(Number).pipe(z.number().positive()),
  pageSize: z
    .string()
    .default("20")
    .transform(Number)
    .pipe(z.number().positive().max(100)),
});

export type WorkoutListQuery = z.infer<typeof WorkoutListQuerySchema>;

export const CreateWorkoutLogSchema = z.object({
  routineId: z.string().cuid("Invalid routine ID"),
  durationSeconds: z.number().int().positive().optional(),
  entries: z.array(
    z.object({
      exerciseId: z.string().cuid("Invalid exercise ID"),
      sets: z.array(
        z.object({
          setIndex: z.number().int().nonnegative(),
          reps: z.number().int().positive().optional(),
          seconds: z.number().int().positive().optional(),
          weightKg: z.number().positive().optional(),
          rpe: z.number().min(1).max(10).optional(),
        })
      ),
    })
  ),
  totalVolumeKg: z.number().nonnegative().optional(),
});

export type CreateWorkoutLogInput = z.infer<typeof CreateWorkoutLogSchema>;
