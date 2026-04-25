-- Phase 8: trust bundle (affiliate provenance + future link-check metadata).

ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS trust_bundle jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.deals.trust_bundle IS
  'Strict-shape JSON from ingest: affiliate_network, link_verified_at, pipeline, etc.';
