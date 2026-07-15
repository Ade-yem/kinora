import { z } from "zod";

export const ExerciseListQuerySchema = z.object({
  page: z.string().default("1").transform(Number).pipe(z.number().positive()),
  pageSize: z
    .string()
    .default("20")
    .transform(Number)
    .pipe(z.number().positive().max(100)),
  search: z.string().optional(),
  targetMuscleGroup: z.string().optional(),
  bodyRegion: z.string().optional(),
  classification: z.string().optional(),
  equipment: z.string().optional(),
  sortBy: z
    .enum(["name", "difficulty", "createdAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ExerciseListQuery = z.infer<typeof ExerciseListQuerySchema>;
