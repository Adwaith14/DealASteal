import { z } from 'zod';
import { DEAL_CATEGORY_SLUGS } from '@/constants/deal-categories';

const dealCategorySlugEnum = z.enum(DEAL_CATEGORY_SLUGS);

const isoDateTimeString = z.string().refine((value) => Number.isFinite(Date.parse(value)), {
  message: 'must be a parseable ISO datetime string',
});

const ISO_4217_RE = /^[A-Z]{3}$/;
const currencyCode = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .refine((s) => ISO_4217_RE.test(s), { message: 'currency must be a 3-letter ISO-4217 code' });

const ASIN_RE = /^[A-Z0-9]{10}$/;
const GTIN_RE = /^\d{8,14}$/;
const RATING_RE = z.number().min(0).max(5);

/** Phase 8 — persisted on ``deals.trust_bundle``; strict keys only. */
export const DealTrustBundleSchema = z
  .object({
    affiliate_network: z.string().min(1).max(120).optional(),
    link_verified_at: isoDateTimeString.optional(),
    pipeline: z.string().min(1).max(80).optional(),
  })
  .strict();

export type DealTrustBundle = z.infer<typeof DealTrustBundleSchema>;

/**
 * Optional fields most affiliate / catalog APIs supply. Strict-mode rejects
 * unknown keys so a misnamed field never silently lands in the catalog.
 */
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
    /** Upsert/dedupe key from the upstream catalog (e.g. ``dummyjson:42``). */
    ingest_external_id: z.string().min(1).max(220).optional(),
    /** Provenance / future link-check metadata (stored as JSONB). */
    trust_bundle: DealTrustBundleSchema.optional(),
    // ── v2 catalog evolution (all optional for back-compat) ────────────────
    currency: currencyCode.optional(),
    merchant_sku: z.string().min(1).max(200).optional(),
    asin: z
      .string()
      .transform((s) => s.trim().toUpperCase())
      .refine((s) => ASIN_RE.test(s), { message: 'asin must be 10 alphanumerics' })
      .optional(),
    gtin: z
      .string()
      .refine((s) => GTIN_RE.test(s.trim()), { message: 'gtin must be 8–14 digits' })
      .optional(),
    brand: z.string().min(1).max(200).optional(),
    rating: RATING_RE.optional(),
    rating_count: z.number().int().nonnegative().optional(),
    availability: z.string().min(1).max(80).optional(),
    last_seen_at: isoDateTimeString.optional(),
  })
  .strict()
  .refine((value) => value.discount_price <= value.original_price, {
    message: 'discount_price must be less than or equal to original_price',
    path: ['discount_price'],
  });

export type DealIngestPayload = z.infer<typeof DealIngestSchema>;

const couponDiscountTypeEnum = z.enum(['percent', 'fixed']);

export const CouponIngestSchema = z
  .object({
    id: z.string().uuid().optional(),
    merchant_id: z.string().uuid(),
    deal_id: z.string().uuid().optional(),
    code: z.string().min(1).max(80),
    title: z.string().min(1).max(220),
    description: z.string().min(1).max(2000).optional(),
    discount_type: couponDiscountTypeEnum,
    discount_value: z.number().finite().nonnegative(),
    affiliate_url: z.string().url(),
    expires_at: isoDateTimeString.optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const CouponIngestUpdateSchema = z
  .object({
    id: z.string().uuid(),
    deal_id: z.string().uuid().nullable().optional(),
    code: z.string().min(1).max(80).optional(),
    title: z.string().min(1).max(220).optional(),
    description: z.string().min(1).max(2000).nullable().optional(),
    discount_type: couponDiscountTypeEnum.optional(),
    discount_value: z.number().finite().nonnegative().optional(),
    affiliate_url: z.string().url().optional(),
    expires_at: isoDateTimeString.nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).some((k) => k !== 'id'), {
    message: 'at least one updatable field is required',
    path: ['id'],
  });

export const CouponIngestDeleteSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

/** Phase 23 — ``PATCH /api/admin/deals/[id]`` (RLS-gated updates). */
export const AdminDealPatchSchema = z
  .object({
    category_slug: dealCategorySlugEnum.nullable().optional(),
    admin_hidden: z.boolean().optional(),
    /** ``true`` = pin (sets ``admin_pinned_at``); ``false`` = unpin. */
    pinned: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'at least one field is required' });

/** Phase 23 — workers report ingest health (``POST /api/ingest/network-status``). */
export const IngestNetworkStatusSchema = z
  .object({
    network: z.string().min(1).max(64),
    ok: z.boolean(),
    error: z.string().max(4000).nullable().optional(),
    rows: z.number().int().nonnegative().nullable().optional(),
    started_at: isoDateTimeString.optional(),
    finished_at: isoDateTimeString.optional(),
  })
  .strict();

const ingestNetworkSlugEnum = z.enum(['amazon', 'walmart', 'ebay', 'bestbuy', 'target']);

/** Phase 24 — ``PATCH /api/admin/network-settings``. */
export const AdminNetworkSettingsPatchSchema = z
  .object({
    network_slug: ingestNetworkSlugEnum,
    ingest_enabled: z.boolean().optional(),
    tos_url: z.string().url().max(2000).nullable().optional(),
    disclosure_note: z.string().max(4000).nullable().optional(),
    attribution_note: z.string().max(4000).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).some((k) => k !== 'network_slug'), {
    message: 'at least one field besides network_slug is required',
  });
