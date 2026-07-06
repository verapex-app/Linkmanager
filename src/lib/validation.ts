import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const websiteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  domain: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const websiteUpdateSchema = websiteSchema.partial();

export const platformValues = [
  "whatsapp",
  "telegram",
  "signal",
  "messenger",
  "instagram",
  "discord",
  "other",
] as const;

export const linkSchema = z.object({
  websiteId: z.number().int().positive(),
  platform: z.enum(platformValues),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  status: z.enum(["active", "inactive"]).default("active"),
  priority: z.number().int().default(0),
  notes: z.string().optional().nullable(),
});

export const linkUpdateSchema = linkSchema.partial().omit({ websiteId: true });
