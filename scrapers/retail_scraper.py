#!/usr/bin/env python3
"""
Amazon product-page template: live HTML fetch + BeautifulSoup extraction.

Requires: pip install -r scrapers/requirements.txt

Respect Amazon's Terms of Service and robots.txt; this module is a technical
template for environments where programmatic access is permitted.
"""

from __future__ import annotations

import sys
from typing import Final

import requests
from bs4 import BeautifulSoup

from base_scraper import BaseDealScraper, DealIngestPayload


class RetailDealScraper(BaseDealScraper):
    """Fetches a single Amazon PDP and extracts the product title when possible."""

    _DEFAULT_PRODUCT_URL: Final[str] = "https://www.amazon.in/dp/B08ZHPQB7Q"

    def scrape_deals(self) -> None:
        """
        Live-fetch an Amazon product detail page and ingest one placeholder-priced deal
        when the standard title node is present.
        """
        # ------------------------------------------------------------------ inject UUID
        merchant_id = "00000000-0000-4000-8000-000000000000"  # <-- paste merchant UUID

        url = self._DEFAULT_PRODUCT_URL

        # ------------------------------------------------------------------ browser-like headers
        headers: dict[str, str] = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,"
                "image/avif,image/webp,image/apng,*/*;q=0.8"
            ),
            "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "DNT": "1",
            "Connection": "keep-alive",
        }

        # ------------------------------------------------------------------ fetch
        try:
            response = requests.get(url, headers=headers, timeout=30)
        except requests.RequestException as exc:
            print(
                f"[RetailDealScraper] Network error during GET (no crash): {exc}",
                file=sys.stderr,
                flush=True,
            )
            return

        # Immediate visibility for throttling / interstitials (e.g. HTTP 503).
        print(f"[RetailDealScraper] HTTP status: {response.status_code}", flush=True)

        if response.status_code != 200:
            print(
                f"[RetailDealScraper] Non-200 response - skipping parse "
                f"(body length {len(response.text)} chars). "
                f"Frequent 503s usually indicate rate limits or bot filtering.",
                file=sys.stderr,
                flush=True,
            )
            return

        # ------------------------------------------------------------------ parse HTML
        try:
            soup = BeautifulSoup(response.text, "lxml")
        except Exception as exc:
            print(
                f"[RetailDealScraper] BeautifulSoup failed (no crash): {exc}",
                file=sys.stderr,
                flush=True,
            )
            return

        # Soft signal for CAPTCHA / robot pages (HTML varies by locale).
        lowered = response.text.lower()
        if any(
            token in lowered
            for token in (
                "captch",
                "robot check",
                "api-services-error",
                "enter the characters you see below",
            )
        ):
            print(
                "[RetailDealScraper] Response looks like a CAPTCHA or bot "
                "interstitial - not parsing as a normal PDP. Exiting safely.",
                file=sys.stderr,
                flush=True,
            )
            return

        # ------------------------------------------------------------------ title (exact selector per spec)
        title: str | None = None
        try:
            title_span = soup.find("span", id="productTitle")
            if title_span is None:
                print(
                    "[RetailDealScraper] WARNING: Missing <span id=\"productTitle\"/>. "
                    "Amazon may have changed the DOM, served a block page, or stripped "
                    "this element for automated clients.",
                    file=sys.stderr,
                    flush=True,
                )
            else:
                # Equivalent to: soup.find("span", id="productTitle").text.strip()
                title = title_span.text.strip()
                if not title:
                    print(
                        "[RetailDealScraper] WARNING: Found #productTitle but title text "
                        "is empty — treat as blocked or malformed HTML.",
                        file=sys.stderr,
                        flush=True,
                    )
        except Exception as exc:
            print(
                f"[RetailDealScraper] Title extraction raised (no crash): {exc}",
                file=sys.stderr,
                flush=True,
            )
            return

        if not title:
            return

        # ------------------------------------------------------------------ placeholder payload (replace with real price/affiliate logic later)
        original_price = 999.00
        discount_price = 799.00
        affiliate_url = url

        deal: DealIngestPayload = {
            "merchant_id": merchant_id,
            "title": title,
            "original_price": original_price,
            "discount_price": discount_price,
            "affiliate_url": affiliate_url,
            "is_loot_deal": True,
        }

        try:
            self.push_to_api(deal)
        except Exception as exc:
            print(
                f"[RetailDealScraper] push_to_api unexpected error (no crash): {exc}",
                file=sys.stderr,
                flush=True,
            )


__all__ = ["RetailDealScraper"]
