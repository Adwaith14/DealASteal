import { z } from 'zod';

export const AffiliateRestOfferSchema = z
  .object({
    external_id: z.union([z.string(), z.number()]),
    title: z.string().min(1),
    merchant_slug: z.string().optional(),
    merchant_name: z.string().optional(),
    sale_price: z.number().finite().nonnegative(),
    list_price: z.number().finite().nonnegative().optional(),
    affiliate_url: z.string().url(),
    image_url: z.string().url().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    expires_at: z.string().optional(),
  })
  .passthrough();

export type AffiliateRestOffer = z.infer<typeof AffiliateRestOfferSchema>;

export const AffiliateRestPageSchema = z.object({
  offers: z.array(AffiliateRestOfferSchema),
  next_cursor: z.string().optional(),
});

export type AffiliateRestPage = z.infer<typeof AffiliateRestPageSchema>;
