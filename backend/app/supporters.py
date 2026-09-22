"""Public supporter endpoints, meant to be embedded by other sites."""

import threading
import time
from collections.abc import Callable
from datetime import datetime
from typing import Annotated, TypeVar

from fastapi import APIRouter, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy import ARRAY, Text, func, or_, select, type_coerce
from sqlalchemy.dialects.postgresql import aggregate_order_by, array_agg
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Supporter, SupporterSource

router = APIRouter(prefix="/api/supporters", tags=["supporters"])

CACHE_CONTROL = "public, max-age=60"
# Server-side cache for the hot embed endpoints. Writes in this process (Ko-fi
# webhook, admin edits) clear it right away; the TTL covers everything else
# (e.g. the kofi_import CLI). Assumes a single uvicorn worker, as in the Dockerfile.
CACHE_TTL_SECONDS = 3600
MAX_LIMIT = 50

visible = (Supporter.is_public.is_(True), Supporter.hidden.is_(False))
# Ko-fi payments, plus manual entries that were given an amount.
donations = or_(Supporter.source == SupporterSource.kofi, Supporter.amount.is_not(None))

Limit = Annotated[int, Query(ge=1, le=MAX_LIMIT, description="Number of entries to return")]


class TopSupporter(BaseModel):
    rank: int
    name: str
    message: str | None = Field(description="Their most recent non-empty message")


class RecentDonation(BaseModel):
    name: str
    message: str | None
    created_at: datetime


T = TypeVar("T")

_cache: dict[str, tuple[float, list]] = {}
_cache_lock = threading.Lock()
_generation = 0


def invalidate_cache() -> None:
    """Drop cached top/recent lists; call after supporters change."""
    global _generation
    with _cache_lock:
        _generation += 1
        _cache.clear()


def _cached(key: str, compute: Callable[[], list[T]]) -> list[T]:
    """The full (MAX_LIMIT) list for `key`, recomputed at most once per TTL."""
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > time.monotonic():
            return hit[1]
        generation = _generation
    value = compute()
    with _cache_lock:
        # Don't store a result computed from data an invalidation has since replaced.
        if generation == _generation:
            _cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, value)
    return value


def distinct_visible_names(session: Session) -> list[str]:
    """Every visible supporter once (case-insensitive), in order of first support."""
    rows = session.scalars(
        select(Supporter.name).where(*visible).order_by(Supporter.created_at, Supporter.id)
    )
    seen: dict[str, str] = {}
    for name in rows:
        seen.setdefault(name.strip().lower(), name.strip())
    return list(seen.values())


def _compute_top() -> list[TopSupporter]:
    first_name = array_agg(aggregate_order_by(Supporter.name, Supporter.created_at, Supporter.id))[1]
    latest_message = type_coerce(
        array_agg(aggregate_order_by(Supporter.message, Supporter.created_at.desc(), Supporter.id.desc()))
        .filter(func.nullif(func.trim(Supporter.message), "").is_not(None)),
        ARRAY(Text),
    )[1]
    total = func.sum(func.coalesce(Supporter.amount, 0))
    first_at = func.min(Supporter.created_at)
    with SessionLocal() as session:
        rows = session.execute(
            select(first_name, latest_message)
            .where(*visible, donations)
            .group_by(func.lower(func.trim(Supporter.name)))
            .order_by(total.desc(), first_at)
            .limit(MAX_LIMIT)
        ).all()
    return [
        TopSupporter(rank=i, name=name.strip(), message=message.strip() if message else None)
        for i, (name, message) in enumerate(rows, start=1)
    ]


@router.get("/top", response_model=list[TopSupporter])
def top_supporters(response: Response, limit: Limit = 10):
    """Supporters ranked by their total donated amount (amounts are not exposed)."""
    response.headers["Cache-Control"] = CACHE_CONTROL
    return _cached("top", _compute_top)[:limit]


def _compute_recent() -> list[RecentDonation]:
    with SessionLocal() as session:
        rows = session.scalars(
            select(Supporter)
            .where(*visible, donations)
            .order_by(Supporter.created_at.desc(), Supporter.id.desc())
            .limit(MAX_LIMIT)
        ).all()
    return [
        RecentDonation(name=s.name.strip(), message=(s.message or "").strip() or None, created_at=s.created_at)
        for s in rows
    ]


@router.get("/recent", response_model=list[RecentDonation])
def recent_donations(response: Response, limit: Limit = 10):
    """Most recent donations, newest first."""
    response.headers["Cache-Control"] = CACHE_CONTROL
    return _cached("recent", _compute_recent)[:limit]
