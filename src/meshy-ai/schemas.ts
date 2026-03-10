import { z } from "zod";

export const createCharacterSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(600, "Prompt must be 600 characters or less"),
  pose_mode: z
    .union([z.literal(""), z.literal("t-pose"), z.literal("a-pose")])
    .optional()
    .default(""),
});

export const refineCharacterSchema = z.object({
  preview_task_id: z.string().min(1, "Preview task ID is required"),
  texture_prompt: z.string().max(600).optional(),
  enable_pbr: z.boolean().optional().default(false),
});

export const imageTo3DSchema = z.object({
  image_url: z.string().min(1, "Image is required"),
  texture_prompt: z.string().max(600).optional(),
});

export type ImageTo3DInput = z.infer<typeof imageTo3DSchema>;

export const rigCharacterSchema = z
  .object({
    model_url: z.string().url().optional(),
    input_task_id: z.string().optional(),
    height_meters: z.number().positive().max(10).optional(),
  })
  .refine(
    (data) => data.model_url || data.input_task_id,
    "Either model_url or input_task_id is required"
  );

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type RefineCharacterInput = z.infer<typeof refineCharacterSchema>;
export type RigCharacterInput = z.infer<typeof rigCharacterSchema>;
