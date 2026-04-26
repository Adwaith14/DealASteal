from __future__ import annotations

import json
from pathlib import Path

import responses

from networks.paapi_client import PaapiClient


@responses.activate
def test_paapi_search_items_replay_fixture() -> None:
    fixture = Path(__file__).parent / "fixtures" / "paapi_searchitems_success.json"
    body = json.loads(fixture.read_text(encoding="utf-8"))

    responses.add(
        responses.POST,
        "https://webservices.amazon.com/paapi5/searchitems",
        json=body,
        status=200,
    )

    client = PaapiClient(
        access_key="AKIAIOSFODNN7EXAMPLE",
        secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        partner_tag="fixture-20",
        marketplace="www.amazon.com",
        region="us-east-1",
        host="webservices.amazon.com",
        min_interval_seconds=0.0,
    )
    items = client.search_items("fixture-query")
    assert len(items) == 1
    assert items[0].get("ASIN") == "B0TESTITEM1"
