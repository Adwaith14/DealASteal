#!/usr/bin/env python3
"""Amazon Product Advertising API (PA-API 5.0) ingest template.

This is a SKELETON. To run for real you must:

1. Have an active Amazon Associates account in the marketplace you target
   (US Associates for ``amazon.com``).
2. Be approved for PA-API access (Amazon now requires recent qualifying
   sales before enabling API keys for new accounts).
3. Sign requests with **AWS SigV4** for the ``ProductAdvertisingAPI``
   service (Amazon publishes the canonical signing recipe).

Environment variables (loaded from repo-root ``.env.local``):

- ``AMAZON_PAAPI_ACCESS_KEY`` / ``AMAZON_PAAPI_SECRET_KEY``
- ``AMAZON_PAAPI_PARTNER_TAG`` (e.g. ``yourtag-20``)
- ``AMAZON_PAAPI_HOST`` (default: ``webservices.amazon.com``)
- ``AMAZON_PAAPI_REGION`` (default: ``us-east-1``)
- ``AMAZON_PAAPI_MARKETPLACE`` (default: ``www.amazon.com``)
- ``AMAZON_MERCHANT_ID`` — UUID of the ``merchants`` row representing Amazon
- ``INGESTION_API_KEY`` — shared secret for ``POST /api/ingest/deals``

This template intentionally does **not** ship a working request signer.
Drop in either ``paapi5-python-sdk`` (Amazon-provided) or your own SigV4
helper, then map the response onto :class:`DealIngestPayload`.
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
            f"[amazon_paapi] Missing env var {name!r}. See scrapers/README.md.",
            file=sys.stderr,
            flush=True,
        )
        sys.exit(1)
    return value


def _normalize_paapi_item(item: dict[str, Any], merchant_id: str) -> DealIngestPayload | None:
    """Map a single PA-API ``Item`` payload to a ``DealIngestPayload``.

    Real shape (truncated):
        { "ASIN": "...",
          "DetailPageURL": "...",
          "ItemInfo": {"Title": {"DisplayValue": "..."}, "ByLineInfo": {...}},
          "Offers": {"Listings": [{"Price": {"Amount": ..., "Currency": "USD"},
                                    "SavingBasis": {"Amount": ...}}]},
          "Images": {"Primary": {"Large": {"URL": "..."}}}}
    """
    asin = item.get("ASIN")
    title = item.get("ItemInfo", {}).get("Title", {}).get("DisplayValue")
    detail_page = item.get("DetailPageURL")
    listing = (item.get("Offers") or {}).get("Listings", [{}])[0]
    price = (listing.get("Price") or {}).get("Amount")
    currency = (listing.get("Price") or {}).get("Currency") or "USD"
    saving_basis = (listing.get("SavingBasis") or {}).get("Amount")
    image_url = (((item.get("Images") or {}).get("Primary") or {}).get("Large") or {}).get("URL")

    if not (asin and title and detail_page and price):
        return None
    if saving_basis is None or saving_basis <= price:
        return None

    payload: DealIngestPayload = {
        "merchant_id": merchant_id,
        "title": str(title),
        "original_price": float(saving_basis),
        "discount_price": float(price),
        "affiliate_url": str(detail_page),
        "is_loot_deal": (saving_basis - price) / saving_basis >= 0.50,
        "ingest_external_id": f"amazon:{asin}",
    }
    if image_url:
        payload["image_url"] = str(image_url)
    payload["currency"] = currency
    payload["asin"] = asin
    return payload


def _fetch_search_items(_keywords: str) -> Iterable[dict[str, Any]]:
    """Stub. Replace with PA-API ``SearchItems`` (or ``GetItems``) call.

    Amazon's official Python SDK is ``paapi5-python-sdk`` (PyPI); use it
    or implement SigV4 manually. Yields raw ``Item`` dicts so the rest
    of this script stays simple.
    """
    return []


def main() -> int:
    merchant_id = _required_env("AMAZON_MERCHANT_ID")
    _required_env("AMAZON_PAAPI_ACCESS_KEY")
    _required_env("AMAZON_PAAPI_SECRET_KEY")
    _required_env("AMAZON_PAAPI_PARTNER_TAG")
    _ = _required_env("INGESTION_API_KEY")

    scraper = BaseDealScraper()
    queries = ["laptop deals", "smart tv", "kitchen sale", "headphones"]

    sent = 0
    for query in queries:
        for item in _fetch_search_items(query):
            payload = _normalize_paapi_item(item, merchant_id)
            if payload is None:
                continue
            if scraper.push_to_api(payload):
                sent += 1

    print(f"[amazon_paapi] Sent {sent} deal(s).", flush=True)
    return 0 if sent or queries == [] else 0


if __name__ == "__main__":
    raise SystemExit(main())
