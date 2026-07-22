import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  weight: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .nullable()
    .optional(),
  biologicalSex: z.string().trim().min(1).max(20).nullable().optional(),
  experienceLevel: z.string().trim().min(1).max(30).nullable().optional(),
  preferredLocation: z.enum(["home", "gym"]).nullable().optional(),
  unitsPreference: z.enum(["lb", "kg"]).optional(),
  logoStyle: z.enum(["pulse-bubble", "rep-loop", "signal-bars"]).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
