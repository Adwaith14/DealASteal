from __future__ import annotations

import json
from pathlib import Path

import pytest
import responses

from networks.paapi_client import PaapiClient, PaapiError


@responses.activate
def test_invalid_parameter_raises() -> None:
    responses.add(
        responses.POST,
        "https://webservices.amazon.com/paapi5/searchitems",
        json={"Errors": [{"Code": "InvalidParameterValue", "Message": "bad"}]},
        status=400,
    )
    client = PaapiClient(
        access_key="AKIAIOSFODNN7EXAMPLE",
        secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        partner_tag="t-20",
        marketplace="www.amazon.com",
        region="us-east-1",
        host="webservices.amazon.com",
        min_interval_seconds=0.0,
        max_throttle_retries=0,
    )
    with pytest.raises(PaapiError) as ei:
        client.search_items("bad-keywords")
    assert "InvalidParameterValue" in ei.value.codes


@responses.activate
def test_throttle_then_success() -> None:
    fixture = Path(__file__).parent / "fixtures" / "paapi_searchitems_success.json"
    ok_body = json.loads(fixture.read_text(encoding="utf-8"))
    responses.add(
        responses.POST,
        "https://webservices.amazon.com/paapi5/searchitems",
        json={"Errors": [{"Code": "RequestThrottled", "Message": "slow"}]},
        status=200,
    )
    responses.add(
        responses.POST,
        "https://webservices.amazon.com/paapi5/searchitems",
        json=ok_body,
        status=200,
    )
    client = PaapiClient(
        access_key="AKIAIOSFODNN7EXAMPLE",
        secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        partner_tag="t-20",
        marketplace="www.amazon.com",
        region="us-east-1",
        host="webservices.amazon.com",
        min_interval_seconds=0.0,
        max_throttle_retries=3,
    )
    items = client.search_items("q")
    assert len(items) == 1
