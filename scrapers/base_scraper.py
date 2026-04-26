#!/usr/bin/env python3
"""
Base scraper utilities for posting validated deal payloads to the DealASteal ingest API.

Requires: pip install requests python-dotenv
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Final, NotRequired, TypedDict

import requests
from dotenv import load_dotenv


class DealTrustBundlePayload(TypedDict, total=False):
    affiliate_network: str
    link_verified_at: str
    pipeline: str


class DealIngestPayload(TypedDict):
    """Keys and value types aligned with DealIngestSchema in src/types/schemas.ts."""

    merchant_id: str
    title: str
    original_price: float
    discount_price: float
    affiliate_url: str
    is_loot_deal: bool
    description: NotRequired[str]
    image_url: NotRequired[str]
    expires_at: NotRequired[str]
    category_slug: NotRequired[str]
    ingest_external_id: NotRequired[str]
    trust_bundle: NotRequired[DealTrustBundlePayload]
    currency: NotRequired[str]
    asin: NotRequired[str]
    gtin: NotRequired[str]
    brand: NotRequired[str]
    rating: NotRequired[float]
    rating_count: NotRequired[int]
    availability: NotRequired[str]


class BaseDealScraper:
    """HTTP client for server-to-server deal ingestion."""

    _DEFAULT_API_URL: Final[str] = "http://localhost:3000/api/ingest/deals"

    def __init__(self) -> None:
        repo_root = Path(__file__).resolve().parent.parent
        env_path = repo_root / ".env.local"
        load_dotenv(dotenv_path=env_path, override=False)

        api_key = os.getenv("INGESTION_API_KEY", "").strip()
        if not api_key:
            raise ValueError(
                "INGESTION_API_KEY is missing or empty. "
                "Set it in .env.local at the repository root (parent of /scrapers)."
            )

        self._api_key: str = api_key
        # Allow the cron worker to point at staging/prod via env without code changes.
        self.api_url: str = os.getenv("DEALASTEAL_INGEST_URL", self._DEFAULT_API_URL).strip() or self._DEFAULT_API_URL

    def push_to_api(self, deal_payload: dict[str, Any]) -> bool:
        """
        POST ``deal_payload`` to the ingest API.

        Returns ``True`` only when the server responds with HTTP 201 Created.
        """
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._api_key}",
        }

        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                json=deal_payload,
                timeout=30,
            )
        except requests.exceptions.ConnectionError as exc:
            print(
                "Could not reach the ingest API. Is Next.js running?\n"
                "  From the repo root:  npm run dev\n"
                f"  Target: {self.api_url}\n"
                f"  Details: {exc}",
                file=sys.stderr,
            )
            return False
        except requests.RequestException as exc:
            print(f"HTTP request failed: {exc}", file=sys.stderr)
            return False

        # The ingest API returns 201 on insert and 200 on idempotent upsert (when
        # ``ingest_external_id`` is supplied). Both are success.
        if response.status_code in (200, 201):
            return True

        self._print_failed_response(response)
        return False

    def _print_failed_response(self, response: requests.Response) -> None:
        print(f"HTTP {response.status_code}", file=sys.stderr)
        content_type = response.headers.get("Content-Type", "")
        if "application/json" in content_type:
            try:
                body: Any = response.json()
            except ValueError:
                print(response.text, file=sys.stderr)
                return
            print(json.dumps(body, indent=2, sort_keys=True), file=sys.stderr)
            issues = body.get("issues") if isinstance(body, dict) else None
            if issues is not None:
                print("Validation issues (Zod flatten):", file=sys.stderr)
                print(json.dumps(issues, indent=2, sort_keys=True), file=sys.stderr)
        else:
            print(response.text, file=sys.stderr)


__all__ = ["BaseDealScraper", "DealIngestPayload", "DealTrustBundlePayload"]
