#!/usr/bin/env python3
"""Walmart Affiliate / Open API ingest template.

Walmart's affiliate API requires:

- A Walmart **Impact Radius** publisher account.
- A Consumer ID (``WM_CONSUMER.ID``) and a **private RSA key** registered
  in the Walmart developer portal. Each request is signed with
  RSA-SHA256 over a canonical string and base64-encoded into the
  ``WM_SEC.AUTH_SIGNATURE`` header.

This template signs nothing — it documents the headers and shows how the
JSON is mapped onto :class:`DealIngestPayload`. Wire up signing before
running in production.
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
            f"[walmart_affiliate] Missing env var {name!r}. See scrapers/README.md.",
            file=sys.stderr,
            flush=True,
        )
        sys.exit(1)
    return value


def _normalize_walmart_item(item: dict[str, Any], merchant_id: str) -> DealIngestPayload | None:
    """Walmart Open API trending/items response.

    Real shape (truncated):
        { "itemId": 12345,
          "name": "...",
          "msrp": 199.99,
          "salePrice": 149.99,
          "productUrl": "https://www.walmart.com/...",
          "affiliateAddToCartUrl": "https://goto.walmart.com/c/...",
          "stock": "Available",
          "customerRating": "4.5",
          "numReviews": 320,
          "brandName": "..." }
    """
    item_id = item.get("itemId")
    name = item.get("name")
    msrp = item.get("msrp")
    sale = item.get("salePrice")
    affiliate_url = item.get("affiliateAddToCartUrl") or item.get("productUrl")
    if not (item_id and name and msrp and sale and affiliate_url):
        return None
    if sale >= msrp:
        return None

    payload: DealIngestPayload = {
        "merchant_id": merchant_id,
        "title": str(name),
        "original_price": float(msrp),
        "discount_price": float(sale),
        "affiliate_url": str(affiliate_url),
        "is_loot_deal": (msrp - sale) / msrp >= 0.50,
        "ingest_external_id": f"walmart:{item_id}",
    }
    payload["currency"] = "USD"
    if (image_url := item.get("largeImage") or item.get("mediumImage")):
        payload["image_url"] = str(image_url)
    if rating := item.get("customerRating"):
        try:
            payload["rating"] = float(rating)
        except (TypeError, ValueError):
            pass
    if num_reviews := item.get("numReviews"):
        try:
            payload["rating_count"] = int(num_reviews)
        except (TypeError, ValueError):
            pass
    if brand := item.get("brandName"):
        payload["brand"] = str(brand)
    if stock := item.get("stock"):
        payload["availability"] = str(stock).lower()
    return payload


def _fetch_walmart_items() -> Iterable[dict[str, Any]]:
    """Stub. Replace with a signed call to:

    - ``GET https://developer.api.walmart.com/api-proxy/service/affil/product/v2/feeds/specialbuys`` (Special Buys)
    - or ``GET .../v2/feeds/clearance``
    - or ``GET .../v2/feeds/rollback``
    """
    return []


def main() -> int:
    merchant_id = _required_env("WALMART_MERCHANT_ID")
    _required_env("WALMART_CONSUMER_ID")
    _required_env("WALMART_PRIVATE_KEY_PATH")
    _required_env("WALMART_KEY_VERSION")
    _required_env("INGESTION_API_KEY")

    scraper = BaseDealScraper()
    sent = 0
    for item in _fetch_walmart_items():
        payload = _normalize_walmart_item(item, merchant_id)
        if payload is None:
            continue
        if scraper.push_to_api(payload):
            sent += 1
    print(f"[walmart_affiliate] Sent {sent} deal(s).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
