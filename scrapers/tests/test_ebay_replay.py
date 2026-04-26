from __future__ import annotations

import json
import re
from pathlib import Path

import responses

from networks.ebay_client import EbayBrowseClient


@responses.activate
def test_ebay_oauth_and_search_replay() -> None:
    responses.add(
        responses.POST,
        "https://api.ebay.com/identity/v1/oauth2/token",
        json={"access_token": "fixture-token", "expires_in": 7200},
        status=200,
    )

    fixture = Path(__file__).parent / "fixtures" / "ebay_browse_search.json"
    search_body = json.loads(fixture.read_text(encoding="utf-8"))

    responses.add(
        responses.GET,
        re.compile(r"https://api\.ebay\.com/buy/browse/v1/item_summary/search\?.*"),
        json=search_body,
        status=200,
    )

    client = EbayBrowseClient(
        client_id="id",
        client_secret="secret",
        campaign_id="camp-1",
        min_interval_seconds=0.0,
    )
    items = client.search_item_summaries(q="deals", limit=5)
    assert len(items) == 1
    assert items[0].get("itemId") == "v1|987654321|0"
