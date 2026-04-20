import { z } from 'zod';

export const ContactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(8000),
});

export type ContactMessage = z.infer<typeof ContactMessageSchema>;
