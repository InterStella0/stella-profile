"""Keep `Project.github_stars` up to date for projects linking to a GitHub repo.

A background loop (started in app.main) refreshes every project periodically;
saving a project in the admin refreshes just that one. Counts are cached in the
DB so the site never waits on GitHub and survives rate limits or outages.
"""

import asyncio
import json
import logging
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone

from sqlalchemy import select

from app.config import GITHUB_STARS_REFRESH_MINUTES, GITHUB_TOKEN
from app.db import SessionLocal
from app.models import Project

log = logging.getLogger(__name__)

_REPO_RE = re.compile(r"^https?://(?:www\.)?github\.com/([\w.-]+)/([\w.-]+?)(?:\.git)?/?(?:[?#].*)?$", re.I)


class RateLimited(Exception):
    pass


def repo_from_link(link: str | None) -> str | None:
    """'https://github.com/owner/repo' -> 'owner/repo'; profile or non-GitHub links -> None."""
    m = _REPO_RE.match((link or "").strip())
    return f"{m.group(1)}/{m.group(2)}" if m else None


def fetch_stars(repo: str) -> int | None:
    """Star count for owner/repo, or None if the repo doesn't exist (or is private)."""
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}", headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "stella-profile",
        **({"Authorization": f"Bearer {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}),
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return int(json.load(res)["stargazers_count"])
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        if exc.code in (403, 429) and exc.headers.get("x-ratelimit-remaining") == "0":
            raise RateLimited from exc
        raise


def refresh_project(project: Project) -> None:
    repo = repo_from_link(project.link)
    if repo is None:
        project.github_stars = None
        project.github_stars_updated_at = None
        return
    project.github_stars = fetch_stars(repo)
    project.github_stars_updated_at = datetime.now(timezone.utc)


def refresh_all() -> None:
    with SessionLocal() as session:
        projects = session.scalars(select(Project)).all()
        updated = 0
        for project in projects:
            try:
                refresh_project(project)
                updated += 1
            except RateLimited:
                log.warning("GitHub rate limit hit; set GITHUB_TOKEN to raise it. Will retry next cycle.")
                break
            except Exception:
                # Keep the last known count; try again next cycle.
                log.warning("Could not refresh stars for %s", project.link, exc_info=True)
        session.commit()
    log.info("Refreshed GitHub stars for %d project(s)", updated)


def refresh_one(project_id: int) -> None:
    with SessionLocal() as session:
        project = session.get(Project, project_id)
        if project is None:
            return
        try:
            refresh_project(project)
        except Exception:
            log.warning("Could not refresh stars for %s", project.link, exc_info=True)
            return
        session.commit()


async def refresh_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(refresh_all)
        except Exception:
            log.exception("GitHub star refresh failed")
        await asyncio.sleep(GITHUB_STARS_REFRESH_MINUTES * 60)
