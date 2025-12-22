import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MANAGER', 'SENIOR', 'WORKER', 'APPRENTICE']),
  customPermissions: z.array(z.string()).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string(),
  // If not logged in, also registration fields
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
});
