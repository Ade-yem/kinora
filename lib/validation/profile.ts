import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  goal: z.string().trim().min(1).max(120).optional(),
  location: z.enum(["home", "gym"]).optional(),
  equipment: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  sessionDurationMinutes: z.number().int().positive().optional(),
  injuriesNotes: z.string().optional(),
  unitsPreference: z.enum(["lb", "kg"]).optional(),
  injuries: z
    .array(
      z.object({
        bodyPart: z.string(),
        severity: z.enum(["mild", "moderate", "severe"]).optional(),
        note: z.string().optional(),
      })
    )
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
