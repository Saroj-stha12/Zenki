import { z } from 'zod';

export const emailSchema = z.string().trim().email().max(320);
export const passwordSchema = z.string().min(8).max(128);

export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(80).optional(),
});

export const workspaceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  icon: z.string().trim().min(1).max(32).default('🗂️'),
});

export const folderSchema = z.object({
  title: z.string().trim().min(1).max(120),
  icon: z.string().trim().min(1).max(32).default('📁'),
  workspaceId: z.string().uuid(),
});

export const snippetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  icon: z.string().trim().min(1).max(32).default('📝'),
  content: z.string().default(''),
  language: z.string().trim().min(1).max(64).default('plain'),
  workspaceId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const snippetUpdateSchema = snippetSchema.partial().extend({
  favorite: z.boolean().optional(),
});

export const tagListSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(48)).default([]),
});

export const searchSchema = z.object({
  q: z.string().trim().max(200).default(''),
});

