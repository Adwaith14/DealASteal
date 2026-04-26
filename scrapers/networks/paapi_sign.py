"""AWS SigV4 signing for Amazon PA-API 5 JSON POST requests."""

from __future__ import annotations

import json
from typing import Any

from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials

PAAPI_SERVICE = "ProductAdvertisingAPI"
SEARCH_ITEMS_TARGET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems"


def build_search_items_body(
    *,
    keywords: str,
    marketplace: str,
    partner_tag: str,
    search_index: str = "All",
    item_count: int = 10,
    resources: list[str] | None = None,
) -> bytes:
    """Canonical JSON body bytes (must match what is POSTed for SigV4)."""
    if resources is None:
        resources = [
            "Images.Primary.Large",
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo.Brand",
            "Offers.Listings.Price",
            "Offers.Listings.SavingBasis",
        ]
    payload: dict[str, Any] = {
        "Keywords": keywords,
        "Marketplace": marketplace,
        "PartnerTag": partner_tag,
        "PartnerType": "Associates",
        "SearchIndex": search_index,
        "ItemCount": item_count,
        "Resources": resources,
    }
    # Compact JSON; stable key order helps debugging (SigV4 hashes exact bytes).
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


def sign_paapi_post(
    *,
    url: str,
    body: bytes,
    access_key: str,
    secret_key: str,
    region: str,
    target: str = SEARCH_ITEMS_TARGET,
) -> dict[str, str]:
    """Return headers to merge with ``requests.post(..., headers=..., data=body)``."""
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Encoding": "amz-1.0",
        "x-amz-target": target,
    }
    request = AWSRequest(method="POST", url=url, data=body, headers=headers)
    SigV4Auth(Credentials(access_key, secret_key), PAAPI_SERVICE, region).add_auth(request)
    merged = dict(request.headers)
    # requests expects str headers
    return {k: v if isinstance(v, str) else v.decode("utf-8") for k, v in merged.items()}
