"""Public supporter endpoints, meant to be embedded by other sites."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy import ARRAY, Text, func, or_, select, type_coerce
from sqlalchemy.dialects.postgresql import aggregate_order_by, array_agg
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Supporter, SupporterSource

router = APIRouter(prefix="/api/supporters", tags=["supporters"])

CACHE_CONTROL = "public, max-age=60"

visible = (Supporter.is_public.is_(True), Supporter.hidden.is_(False))
# Ko-fi payments, plus manual entries that were given an amount.
donations = or_(Supporter.source == SupporterSource.kofi, Supporter.amount.is_not(None))

Limit = Annotated[int, Query(ge=1, le=50, description="Number of entries to return")]


class TopSupporter(BaseModel):
    rank: int
    name: str
    message: str | None = Field(description="Their most recent non-empty message")


class RecentDonation(BaseModel):
    name: str
    message: str | None
    created_at: datetime


def distinct_visible_names(session: Session) -> list[str]:
    """Every visible supporter once (case-insensitive), in order of first support."""
    rows = session.scalars(
        select(Supporter.name).where(*visible).order_by(Supporter.created_at, Supporter.id)
    )
    seen: dict[str, str] = {}
    for name in rows:
        seen.setdefault(name.strip().lower(), name.strip())
    return list(seen.values())


@router.get("/top", response_model=list[TopSupporter])
def top_supporters(response: Response, limit: Limit = 10, session: Session = Depends(get_session)):
    """Supporters ranked by their total donated amount (amounts are not exposed)."""
    first_name = array_agg(aggregate_order_by(Supporter.name, Supporter.created_at, Supporter.id))[1]
    latest_message = type_coerce(
        array_agg(aggregate_order_by(Supporter.message, Supporter.created_at.desc(), Supporter.id.desc()))
        .filter(func.nullif(func.trim(Supporter.message), "").is_not(None)),
        ARRAY(Text),
    )[1]
    total = func.sum(func.coalesce(Supporter.amount, 0))
    first_at = func.min(Supporter.created_at)
    rows = session.execute(
        select(first_name, latest_message)
        .where(*visible, donations)
        .group_by(func.lower(func.trim(Supporter.name)))
        .order_by(total.desc(), first_at)
        .limit(limit)
    )
    response.headers["Cache-Control"] = CACHE_CONTROL
    return [
        TopSupporter(rank=i, name=name.strip(), message=message.strip() if message else None)
        for i, (name, message) in enumerate(rows, start=1)
    ]


@router.get("/recent", response_model=list[RecentDonation])
def recent_donations(response: Response, limit: Limit = 10, session: Session = Depends(get_session)):
    """Most recent donations, newest first."""
    rows = session.scalars(
        select(Supporter)
        .where(*visible, donations)
        .order_by(Supporter.created_at.desc(), Supporter.id.desc())
        .limit(limit)
    )
    response.headers["Cache-Control"] = CACHE_CONTROL
    return [
        RecentDonation(name=s.name.strip(), message=(s.message or "").strip() or None, created_at=s.created_at)
        for s in rows
    ]
