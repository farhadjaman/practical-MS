import { z } from "zod";

export const EmailCreateSchema = z.object({
  recipient: z.string().email(),
  subject: z.string().min(3).max(100),
  body: z.string().min(3).max(1000),
  sender: z.string().email().optional(),
  source: z.string().optional(),
});
