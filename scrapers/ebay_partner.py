#!/usr/bin/env python3
"""eBay Partner Network (EPN) Browse API ingest template.

eBay uses OAuth 2.0 client-credentials. Steps:

1. Register an EPN account, get a Campaign ID.
2. Create an OAuth app in eBay Developer Program (production).
3. Exchange ``client_id:client_secret`` for an application access token
   (``grant_type=client_credentials``, scope ``buy.browse``), then call
   ``GET /buy/browse/v1/item_summary/search?q=...&filter=...&limit=...``
   with ``Authorization: Bearer <token>`` plus
   ``X-EBAY-C-MARKETPLACE-ID: EBAY_US`` and
   ``X-EBAY-C-ENDUSERCTX: affiliateCampaignId=<EBAY_CAMPAIGN_ID>``.

This template handles no auth or HTTP — fill those in before running.
"""

from __future__ import annotations

import os
import sys
from typing import Any, Iterable

from base_scraper import BaseDealScraper, DealIngestPayload


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        print(
            f"[ebay_partner] Missing env var {name!r}. See scrapers/README.md.",
            file=sys.stderr,
            flush=True,
        )
        sys.exit(1)
    return value


def _normalize_ebay_item(item: dict[str, Any], merchant_id: str) -> DealIngestPayload | None:
    """eBay Browse API ``item_summary`` response.

    Real shape (truncated):
        { "itemId": "v1|123|0",
          "title": "...",
          "price": {"value": "29.99", "currency": "USD"},
          "marketingPrice": {"originalPrice": {"value": "59.99", "currency": "USD"}},
          "itemAffiliateWebUrl": "https://...",
          "image": {"imageUrl": "https://..."}}
    """
    item_id = item.get("itemId")
    title = item.get("title")
    price = item.get("price") or {}
    marketing = item.get("marketingPrice") or {}
    original = marketing.get("originalPrice") or {}
    affiliate_url = item.get("itemAffiliateWebUrl") or item.get("itemWebUrl")

    try:
        sale_value = float(price.get("value", 0))
        msrp_value = float(original.get("value", 0)) if original else 0.0
    except (TypeError, ValueError):
        return None

    if not (item_id and title and affiliate_url and sale_value > 0):
        return None
    if msrp_value <= sale_value:
        return None

    payload: DealIngestPayload = {
        "merchant_id": merchant_id,
        "title": str(title),
        "original_price": msrp_value,
        "discount_price": sale_value,
        "affiliate_url": str(affiliate_url),
        "is_loot_deal": (msrp_value - sale_value) / msrp_value >= 0.50,
        "ingest_external_id": f"ebay:{item_id}",
    }
    payload["currency"] = price.get("currency") or "USD"
    if image := (item.get("image") or {}).get("imageUrl"):
        payload["image_url"] = str(image)
    if (condition := item.get("condition")):
        payload["availability"] = str(condition).lower()
    return payload


def _fetch_ebay_items() -> Iterable[dict[str, Any]]:
    """Stub. Replace with eBay Browse API search call."""
    return []


def main() -> int:
    merchant_id = _required_env("EBAY_MERCHANT_ID")
    _required_env("EBAY_CLIENT_ID")
    _required_env("EBAY_CLIENT_SECRET")
    _required_env("EBAY_CAMPAIGN_ID")
    _required_env("INGESTION_API_KEY")

    scraper = BaseDealScraper()
    sent = 0
    for item in _fetch_ebay_items():
        payload = _normalize_ebay_item(item, merchant_id)
        if payload is None:
            continue
        if scraper.push_to_api(payload):
            sent += 1
    print(f"[ebay_partner] Sent {sent} deal(s).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
