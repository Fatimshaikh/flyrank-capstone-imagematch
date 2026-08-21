import { z } from 'zod';

export const ImageTagSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export function validateImageTag(raw) {
  const result = ImageTagSchema.safeParse(raw);
  if (!result.success) {
    return { valid: false, errors: result.error.issues };
  }
  return { valid: true, data: result.data };
}
