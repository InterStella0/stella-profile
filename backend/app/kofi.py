"""Ko-fi webhook receiver.

Ko-fi has no API for listing supporters; it only POSTs each new payment to a
webhook as form data with a single `data` field containing a JSON string.
"""

import hmac
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import KOFI_CURRENCY, KOFI_VERIFICATION_TOKEN
from app.db import get_session
from app.models import Supporter, SupporterSource

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kofi", tags=["kofi"])


def parse_amount(value: Any) -> Decimal | None:
    if value is None or value == "":
        return None
    cleaned = "".join(ch for ch in str(value) if ch.isdigit() or ch in ".-")
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def insert_kofi_supporter(session: Session, values: dict[str, Any]) -> bool:
    """Insert a Ko-fi payment; returns False if the transaction was already stored.

    Existing rows are left untouched so edits made in the admin survive re-imports.
    """
    currency = values.get("currency")
    if KOFI_CURRENCY and currency and currency.upper() != KOFI_CURRENCY:
        log.warning(
            "Ko-fi transaction %s is in %s, expected %s; it still counts toward rankings as-is",
            values["kofi_transaction_id"], currency, KOFI_CURRENCY,
        )
    stmt = (
        insert(Supporter)
        .values(source=SupporterSource.kofi, **values)
        .on_conflict_do_nothing(index_elements=[Supporter.kofi_transaction_id])
        .returning(Supporter.id)
    )
    return session.execute(stmt).first() is not None


def _parse_timestamp(value: Any) -> datetime:
    if isinstance(value, str) and value:
        try:
            ts = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


@router.post("/webhook")
def kofi_webhook(data: str = Form(...), session: Session = Depends(get_session)):
    if not KOFI_VERIFICATION_TOKEN:
        log.error("KOFI_VERIFICATION_TOKEN is not set; rejecting Ko-fi webhook")
        raise HTTPException(503, "Webhook not configured")

    try:
        payload = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON in data field")
    if not isinstance(payload, dict):
        raise HTTPException(400, "Invalid payload")

    token = str(payload.get("verification_token") or "")
    if not hmac.compare_digest(token.encode(), KOFI_VERIFICATION_TOKEN.encode()):
        raise HTTPException(401, "Invalid verification token")

    transaction_id = payload.get("kofi_transaction_id")
    if not transaction_id:
        raise HTTPException(400, "Missing kofi_transaction_id")

    # Email and shipping details are deliberately not stored.
    inserted = insert_kofi_supporter(session, {
        "kofi_transaction_id": str(transaction_id),
        "name": (payload.get("from_name") or "Anonymous").strip()[:200],
        "type": payload.get("type"),
        "amount": parse_amount(payload.get("amount")),
        "currency": (payload.get("currency") or None),
        "message": (payload.get("message") or "").strip() or None,
        "is_public": bool(payload.get("is_public", True)),
        "created_at": _parse_timestamp(payload.get("timestamp")),
    })
    session.commit()
    return {"ok": True, "duplicate": not inserted}
