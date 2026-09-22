"""Backfill supporters from a Ko-fi CSV export (webhooks never replay old payments).

    python -m app.kofi_import export.csv [--dry-run] [--date-format '%d/%m/%Y %H:%M']

Export from the Ko-fi dashboard: More → Transactions, set the date range, Download CSV.
Headers are matched loosely (case, spaces and punctuation ignored). Rows already in
the DB (same transaction ID) are skipped, so re-running is safe. Emails and fees are
never stored. The export contains supporter emails; don't commit it.
"""

import argparse
import csv
import re
import sys
from datetime import datetime, timezone

from app.db import SessionLocal
from app.kofi import insert_kofi_supporter, parse_amount

# normalized header -> field. Extend if your export uses different names.
ALIASES = {
    "kofi_transaction_id": {"transactionid", "kofitransactionid", "transaction", "txnid", "id"},
    "name": {"from", "fromname", "name", "supporter", "supportername", "buyer"},
    "created_at": {"timestamp", "date", "datetime", "dateutc", "datetimeutc", "created", "time"},
    "type": {"type", "transactiontype", "paymenttype"},
    "amount": {"amount", "received", "gross", "grossamount", "total"},
    "currency": {"currency", "currencycode"},
    "message": {"message", "note", "comment"},
    "is_public": {"ispublic", "public"},
    "is_private": {"isprivate", "private"},
}
REQUIRED = ("kofi_transaction_id", "name")

# Ko-fi exports "DateTime (UTC)" as MM/DD/YYYY HH:MM (e.g. 03/17/2026 02:27), so
# month-first wins for ambiguous dates; day-first only catches days > 12.
DATE_FORMATS = (
    "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
    "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y",
    "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y",
)


def _norm(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "", header.lower())


def map_headers(headers: list[str]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for header in headers:
        key = _norm(header)
        for field, aliases in ALIASES.items():
            if key in aliases and field not in mapping:
                mapping[field] = header
    return mapping


def parse_date(value: str, fmt: str | None) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    candidates = [fmt] if fmt else []
    try:
        ts = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        ts = None
        for f in candidates + list(DATE_FORMATS):
            try:
                ts = datetime.strptime(value, f)
                break
            except ValueError:
                continue
    if ts is None:
        raise ValueError(f"Unrecognised date {value!r}; pass --date-format")
    return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)


def parse_bool(value: str) -> bool | None:
    v = (value or "").strip().lower()
    if v in {"true", "yes", "y", "1"}:
        return True
    if v in {"false", "no", "n", "0"}:
        return False
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv_path")
    parser.add_argument("--dry-run", action="store_true", help="parse and report without writing")
    parser.add_argument("--date-format", help="strptime format for the timestamp column")
    args = parser.parse_args()

    with open(args.csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        headers = reader.fieldnames or []
        mapping = map_headers(headers)
        print(f"Columns found: {headers}")
        print(f"Mapped: { {field: col for field, col in mapping.items()} }")
        missing = [f for f in REQUIRED if f not in mapping]
        if missing:
            sys.exit(f"Missing required column(s) for {missing}; add the header to ALIASES in {__file__}")
        if "is_public" not in mapping and "is_private" not in mapping:
            print("No public/private column: rows are imported as public. Hide private ones in the admin.")
        rows = list(reader)

    def col(row: dict, field: str) -> str:
        return (row.get(mapping[field]) or "").strip() if field in mapping else ""

    inserted = skipped = 0
    with SessionLocal() as session:
        for lineno, row in enumerate(rows, start=2):
            transaction_id = col(row, "kofi_transaction_id")
            if not transaction_id:
                print(f"line {lineno}: no transaction ID, skipped")
                skipped += 1
                continue

            is_public = parse_bool(col(row, "is_public"))
            if is_public is None:
                private = parse_bool(col(row, "is_private"))
                is_public = True if private is None else not private

            values = {
                "kofi_transaction_id": transaction_id,
                "name": (col(row, "name") or "Anonymous")[:200],
                "type": col(row, "type") or None,
                "amount": parse_amount(col(row, "amount")),
                "currency": col(row, "currency") or None,
                "message": col(row, "message") or None,
                "is_public": is_public,
            }
            try:
                created_at = parse_date(col(row, "created_at"), args.date_format)
            except ValueError as exc:
                sys.exit(f"line {lineno}: {exc}")
            if created_at:
                values["created_at"] = created_at

            if args.dry_run:
                print(values)
                continue
            if insert_kofi_supporter(session, values):
                inserted += 1
            else:
                skipped += 1

        if args.dry_run:
            print(f"Dry run: {len(rows)} row(s) parsed, nothing written.")
            return
        session.commit()
    print(f"Imported {inserted} new supporter row(s), skipped {skipped}.")


if __name__ == "__main__":
    main()
