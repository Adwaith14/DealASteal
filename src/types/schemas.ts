import { z } from 'zod';
import { DEAL_CATEGORY_SLUGS } from '@/constants/deal-categories';

const dealCategorySlugEnum = z.enum(DEAL_CATEGORY_SLUGS);

const isoDateTimeString = z.string().refine((value) => Number.isFinite(Date.parse(value)), {
  message: 'expires_at must be a parseable ISO datetime string',
});

/** Optional fields most affiliate/catalog APIs can supply; keep strict so unknown keys still fail. */
export const DealIngestSchema = z
  .object({
    merchant_id: z.string().uuid(),
    title: z.string().min(1).max(500),
    original_price: z.number().finite().positive(),
    discount_price: z.number().finite().positive(),
    affiliate_url: z.string().url(),
    is_loot_deal: z.boolean(),
    category_slug: dealCategorySlugEnum.optional(),
    description: z.string().min(1).max(4000).optional(),
    image_url: z.string().url().optional(),
    expires_at: isoDateTimeString.optional(),
    /** Upsert/dedupe key from the upstream catalog (e.g. ``dummyjson:42``). Omit for one-off inserts. */
    ingest_external_id: z.string().min(1).max(220).optional(),
  })
  .strict()
  .refine((value) => value.discount_price <= value.original_price, {
    message: 'discount_price must be less than or equal to original_price',
    path: ['discount_price'],
  });

export type DealIngestPayload = z.infer<typeof DealIngestSchema>;
