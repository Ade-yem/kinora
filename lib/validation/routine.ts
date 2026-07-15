import { z } from "zod";

export const RoutineListQuerySchema = z.object({
  status: z
    .enum(["empty", "forming", "ready", "finalized"])
    .optional(),
  page: z.string().default("1").transform(Number).pipe(z.number().positive()),
  pageSize: z
    .string()
    .default("20")
    .transform(Number)
    .pipe(z.number().positive().max(100)),
});

export type RoutineListQuery = z.infer<typeof RoutineListQuerySchema>;

export const RoutineActionSchema = z.object({
  action: z.enum(["finalize"]),
});

export type RoutineAction = z.infer<typeof RoutineActionSchema>;
