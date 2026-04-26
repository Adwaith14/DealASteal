"""eBay Browse API — OAuth client-credentials + item_summary search."""

from __future__ import annotations

import base64
import logging
import time
from typing import Any, Final

import requests

_TOKEN_URL: Final[str] = "https://api.ebay.com/identity/v1/oauth2/token"
_BROWSE_BASE: Final[str] = "https://api.ebay.com/buy/browse/v1"
_DEFAULT_SCOPE: Final[str] = "https://api.ebay.com/oauth/api_scope"


class EbayHttpError(Exception):
    def __init__(self, message: str, *, http_status: int | None = None) -> None:
        super().__init__(message)
        self.http_status = http_status


class EbayBrowseClient:
    def __init__(
        self,
        *,
        client_id: str,
        client_secret: str,
        campaign_id: str,
        marketplace_id: str = "EBAY_US",
        min_interval_seconds: float = 0.35,
        oauth_scope: str = _DEFAULT_SCOPE,
    ) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._campaign_id = campaign_id
        self._marketplace_id = marketplace_id
        self._min_interval = min_interval_seconds
        self._scope = oauth_scope
        self._log = logging.getLogger("dealasteal.ebay_client")
        self._token: str | None = None
        self._token_expires_at: float = 0.0
        self._last_call: float = 0.0

    def _pace(self) -> None:
        now = time.monotonic()
        wait = self._min_interval - (now - self._last_call)
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.monotonic()

    def _fetch_token(self) -> str:
        self._pace()
        basic = base64.b64encode(f"{self._client_id}:{self._client_secret}".encode()).decode("ascii")
        r = requests.post(
            _TOKEN_URL,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {basic}",
            },
            data={"grant_type": "client_credentials", "scope": self._scope},
            timeout=30,
        )
        if r.status_code != 200:
            raise EbayHttpError(f"oauth token failed: {r.text[:500]}", http_status=r.status_code)
        body = r.json()
        token = body.get("access_token")
        if not token or not isinstance(token, str):
            raise EbayHttpError("oauth response missing access_token")
        expires_in = int(body.get("expires_in", 3600))
        self._token = token
        self._token_expires_at = time.monotonic() + max(60, expires_in - 120)
        return token

    def _get_token(self) -> str:
        if self._token and time.monotonic() < self._token_expires_at:
            return self._token
        return self._fetch_token()

    def search_item_summaries(self, *, q: str, limit: int = 20) -> list[dict[str, Any]]:
        """Returns ``itemSummaries`` list (may be empty)."""
        token = self._get_token()
        self._pace()
        params = {"q": q, "limit": str(max(1, min(limit, 50)))}
        r = requests.get(
            f"{_BROWSE_BASE}/item_summary/search",
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": self._marketplace_id,
                "X-EBAY-C-ENDUSERCTX": f"affiliateCampaignId={self._campaign_id}",
            },
            params=params,
            timeout=45,
        )
        if r.status_code != 200:
            raise EbayHttpError(f"browse search failed: {r.text[:500]}", http_status=r.status_code)
        data = r.json()
        items = data.get("itemSummaries") or []
        if not isinstance(items, list):
            return []
        self._log.debug("ebay search ok", extra={"q": q, "count": len(items)})
        return [x for x in items if isinstance(x, dict)]
