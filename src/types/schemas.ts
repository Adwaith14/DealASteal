import { z } from 'zod';
import { DEAL_CATEGORY_SLUGS } from '@/constants/deal-categories';

const dealCategorySlugEnum = z.enum(DEAL_CATEGORY_SLUGS);

export const DealIngestSchema = z
  .object({
    merchant_id: z.string().uuid(),
    title: z.string().min(1).max(500),
    original_price: z.number().finite().positive(),
    discount_price: z.number().finite().positive(),
    affiliate_url: z.string().url(),
    is_loot_deal: z.boolean(),
    category_slug: dealCategorySlugEnum.optional(),
  })
  .strict()
  .refine((value) => value.discount_price <= value.original_price, {
    message: 'discount_price must be less than or equal to original_price',
    path: ['discount_price'],
  });

export type DealIngestPayload = z.infer<typeof DealIngestSchema>;
