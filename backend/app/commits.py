"""`GET /api/commits`: daily commit counts, all-time totals and stars received across GitHub and GitLab.

A background loop (started in app.main) refreshes a snapshot in memory, so the
site never waits on either API. If one source fails, its last good numbers are
kept until the next cycle.

- GitHub: GraphQL contributions (needs GITHUB_TOKEN). Counts commits GitHub
  credits to the profile, i.e. on default branches; private repos only show up
  if the token belongs to GITHUB_USERNAME.
- GitLab: push events, summing each push's commit count. gitlab.com keeps
  events for 3 years, so older GitLab commits drop out of the all-time total.
"""

import asyncio
import json
import logging
import urllib.parse
import urllib.request
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException

from app.config import (
    COMMITS_REFRESH_MINUTES,
    GITHUB_TOKEN,
    GITHUB_USERNAME,
    GITLAB_TOKEN,
    GITLAB_URL,
    GITLAB_USERNAME,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["commits"])

# 53 Sunday-to-Saturday weeks ending with the current one, like GitHub's profile graph.
WEEKS = 53

# Latest per-source results: {"daily": Counter[date, int], "total": int}
_sources: dict[str, dict[str, Any]] = {}
_updated_at: datetime | None = None


def _window(today: date) -> tuple[date, date]:
    this_sunday = today - timedelta(days=(today.weekday() + 1) % 7)
    return this_sunday - timedelta(weeks=WEEKS - 1), today


def _get_json(url: str, headers: dict[str, str], body: dict | None = None) -> Any:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"User-Agent": "stella-profile", **headers, **({"Content-Type": "application/json"} if body else {})},
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.load(res)


# ── GitHub ───────────────────────────────────────────────────────────────────

def _github_query(query: str) -> dict[str, Any]:
    out = _get_json(
        "https://api.github.com/graphql",
        {"Authorization": f"Bearer {GITHUB_TOKEN}"},
        {"query": query},
    )
    if out.get("errors"):
        raise RuntimeError(f"GitHub GraphQL: {out['errors']}")
    return out["data"]["user"]


def fetch_github(start: date, end: date) -> dict[str, Any]:
    login = json.dumps(GITHUB_USERNAME)

    # Daily counts, one month per alias so no repo can have more than 31 day-nodes
    # (avoids paginating each repo's contributions separately).
    months, cur = [], start
    while cur <= end:
        nxt = min((cur.replace(day=1) + timedelta(days=32)).replace(day=1), end + timedelta(days=1))
        months.append((cur, nxt - timedelta(days=1)))
        cur = nxt
    fields = "\n".join(
        f'm{i}: contributionsCollection(from: "{a}T00:00:00Z", to: "{b}T23:59:59Z") '
        "{ commitContributionsByRepository(maxRepositories: 100) "
        "{ contributions(first: 31) { nodes { occurredAt commitCount } } } }"
        for i, (a, b) in enumerate(months)
    )
    data = _github_query(f"{{ user(login: {login}) {{ createdAt\n{fields} }} }}")
    daily: Counter[date] = Counter()
    for i in range(len(months)):
        for repo in data[f"m{i}"]["commitContributionsByRepository"]:
            for node in repo["contributions"]["nodes"]:
                daily[date.fromisoformat(node["occurredAt"][:10])] += node["commitCount"]

    # All-time total, one year per alias (a collection may span at most a year).
    first_year = int(data["createdAt"][:4])
    years = "\n".join(
        f'y{y}: contributionsCollection(from: "{y}-01-01T00:00:00Z", to: "{min(date(y, 12, 31), end)}T23:59:59Z") '
        "{ totalCommitContributions }"
        for y in range(first_year, end.year + 1)
    )
    totals = _github_query(f"{{ user(login: {login}) {{ {years} }} }}")
    total = sum(v["totalCommitContributions"] for v in totals.values())
    return {"daily": daily, "total": total, "stars": _github_stars(login)}


def _github_stars(login: str) -> int:
    """Stars across every repo the user owns (forks excluded), paging 100 at a time."""
    stars, after = 0, "null"
    while True:
        repos = _github_query(
            f"{{ user(login: {login}) {{ repositories(first: 100, after: {after}, ownerAffiliations: OWNER, isFork: false) "
            "{ pageInfo { hasNextPage endCursor } nodes { stargazerCount } } } }"
        )["repositories"]
        stars += sum(r["stargazerCount"] for r in repos["nodes"])
        if not repos["pageInfo"]["hasNextPage"]:
            return stars
        after = json.dumps(repos["pageInfo"]["endCursor"])


# ── GitLab ───────────────────────────────────────────────────────────────────

def fetch_gitlab(start: date, end: date) -> dict[str, Any]:
    user = urllib.parse.quote(GITLAB_USERNAME, safe="")
    headers = {"PRIVATE-TOKEN": GITLAB_TOKEN} if GITLAB_TOKEN else {}
    daily: Counter[date] = Counter()
    total, page = 0, 1
    while True:
        events = _get_json(
            f"{GITLAB_URL}/api/v4/users/{user}/events?action=pushed&per_page=100&page={page}",
            headers,
        )
        for e in events:
            n = (e.get("push_data") or {}).get("commit_count") or 0
            total += n
            day = date.fromisoformat(e["created_at"][:10])
            if start <= day <= end:
                daily[day] += n
        if len(events) < 100:
            break
        page += 1

    # Stars across the user's own projects
    stars, page = 0, 1
    while True:
        projects = _get_json(f"{GITLAB_URL}/api/v4/users/{user}/projects?per_page=100&page={page}", headers)
        stars += sum(p.get("star_count") or 0 for p in projects)
        if len(projects) < 100:
            break
        page += 1
    return {"daily": daily, "total": total, "stars": stars}


# ── Refresh loop + endpoint ──────────────────────────────────────────────────

SOURCES = {
    "github": (fetch_github, lambda: bool(GITHUB_USERNAME and GITHUB_TOKEN)),
    "gitlab": (fetch_gitlab, lambda: bool(GITLAB_USERNAME)),
}


def refresh() -> None:
    global _updated_at
    start, end = _window(datetime.now(timezone.utc).date())
    for name, (fetch, enabled) in SOURCES.items():
        if not enabled():
            continue
        try:
            _sources[name] = fetch(start, end)
            _updated_at = datetime.now(timezone.utc)
        except Exception:
            # Keep the last good numbers; try again next cycle.
            log.warning("Could not refresh %s commits", name, exc_info=True)
    log.info("Refreshed commit counts for %s", ", ".join(_sources) or "no sources")


async def refresh_loop() -> None:
    if not any(enabled() for _, enabled in SOURCES.values()):
        log.info("Commit graph disabled: set GITHUB_USERNAME (+ GITHUB_TOKEN) and/or GITLAB_USERNAME")
        return
    while True:
        try:
            await asyncio.to_thread(refresh)
        except Exception:
            log.exception("Commit refresh failed")
        await asyncio.sleep(COMMITS_REFRESH_MINUTES * 60)


@router.get("/commits")
def commits() -> dict[str, Any]:
    if not _sources:
        raise HTTPException(404, "No commit data yet")
    start, end = _window(datetime.now(timezone.utc).date())
    merged: Counter[date] = Counter()
    for s in _sources.values():
        merged.update(s["daily"])
    days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    return {
        "updatedAt": _updated_at.isoformat() if _updated_at else None,
        "today": end.isoformat(),
        # Starts on a Sunday; one entry per day up to and including today.
        "days": [{"date": d.isoformat(), "count": merged[d]} for d in days],
        "totals": {name: s["total"] for name, s in _sources.items()},
        "stars": sum(s["stars"] for s in _sources.values()),
    }
