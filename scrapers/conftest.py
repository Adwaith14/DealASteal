"""Pytest bootstrap: allow ``import networks`` when running from repo root."""

from __future__ import annotations

import sys
from pathlib import Path

_SCRAPERS = Path(__file__).resolve().parent
if str(_SCRAPERS) not in sys.path:
    sys.path.insert(0, str(_SCRAPERS))
