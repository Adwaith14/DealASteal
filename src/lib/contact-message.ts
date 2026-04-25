import { z } from 'zod';

/** Honeypot: must stay empty (bots often fill hidden fields). */
const honeypot = z
  .string()
  .optional()
  .transform((v) => (v == null ? '' : v))
  .refine((v) => v.trim() === '', { message: 'Honeypot must be empty' });

export const ContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(8000),
  /** Hidden anti-spam field (form name ``company``). */
  company: honeypot,
});

export type ContactMessage = Omit<z.infer<typeof ContactMessageSchema>, 'company'>;
